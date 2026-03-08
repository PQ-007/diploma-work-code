-- ============================================================================
-- DICTIONARY MODULE — Complete Database Schema for Supabase (PostgreSQL)
-- ============================================================================
-- Prerequisites: pg_trgm extension for fuzzy search
-- Run once: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- ============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Enum for dictionary entry status workflow
DO $$ BEGIN
  CREATE TYPE dictionary_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. DICTIONARY_ENTRIES — Core term table
-- ============================================================================
CREATE TABLE public.dictionary_entries (
  id            bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  term          text NOT NULL,                          -- The word/term itself
  slug          text NOT NULL UNIQUE,                   -- URL-friendly slug
  reading       text,                                   -- Kana reading for Japanese terms
  language_code text NOT NULL CHECK (language_code IN ('mn', 'ja', 'en')),
  definition    text NOT NULL,                          -- Primary definition/explanation
  status        dictionary_status NOT NULL DEFAULT 'draft',
  created_by    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  views         bigint NOT NULL DEFAULT 0,
  saves         bigint NOT NULL DEFAULT 0,
  current_revision_id bigint,                           -- Points to latest approved revision

  -- Full-text search vector (auto-updated via trigger)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(term, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(reading, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(definition, '')), 'B')
  ) STORED,

  CONSTRAINT dictionary_entries_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_entries_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)
);

-- Indexes for dictionary_entries
CREATE INDEX idx_dict_entries_status ON public.dictionary_entries (status);
CREATE INDEX idx_dict_entries_language ON public.dictionary_entries (language_code);
CREATE INDEX idx_dict_entries_created_by ON public.dictionary_entries (created_by);
CREATE INDEX idx_dict_entries_created_at ON public.dictionary_entries (created_at DESC);
CREATE INDEX idx_dict_entries_search_vector ON public.dictionary_entries USING gin (search_vector);
CREATE INDEX idx_dict_entries_term_trgm ON public.dictionary_entries USING gin (term gin_trgm_ops);
CREATE INDEX idx_dict_entries_slug ON public.dictionary_entries (slug);

-- ============================================================================
-- 3. DICTIONARY_TRANSLATIONS — Multi-language translation candidates
-- ============================================================================
CREATE TABLE public.dictionary_translations (
  id              bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  entry_id        bigint NOT NULL,
  language_code   text NOT NULL CHECK (language_code IN ('mn', 'ja', 'en')),
  translated_term text NOT NULL,                -- The translated term text
  explanation     text,                         -- Translation-specific explanation
  created_by      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dictionary_translations_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_translations_entry_fkey FOREIGN KEY (entry_id)
    REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
  CONSTRAINT dictionary_translations_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_dict_translations_entry ON public.dictionary_translations (entry_id);
CREATE INDEX idx_dict_translations_lang ON public.dictionary_translations (language_code);

-- ============================================================================
-- 4. DICTIONARY_EXAMPLES — Usage examples with source/context
-- ============================================================================
CREATE TABLE public.dictionary_examples (
  id          bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  entry_id    bigint NOT NULL,
  example_text text NOT NULL,                   -- The example sentence/usage
  source      text,                             -- Where this example comes from
  context     text,                             -- Additional context (chapter, lecture, etc.)
  language_code text NOT NULL CHECK (language_code IN ('mn', 'ja', 'en')),
  created_by  uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dictionary_examples_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_examples_entry_fkey FOREIGN KEY (entry_id)
    REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
  CONSTRAINT dictionary_examples_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_dict_examples_entry ON public.dictionary_examples (entry_id);

-- ============================================================================
-- 5. DICTIONARY_ENTRY_TAGS — Junction table (reuses existing tags table)
-- ============================================================================
CREATE TABLE public.dictionary_entry_tags (
  entry_id bigint NOT NULL,
  tag_id   bigint NOT NULL,

  CONSTRAINT dictionary_entry_tags_pkey PRIMARY KEY (entry_id, tag_id),
  CONSTRAINT dictionary_entry_tags_entry_fkey FOREIGN KEY (entry_id)
    REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
  CONSTRAINT dictionary_entry_tags_tag_fkey FOREIGN KEY (tag_id)
    REFERENCES public.tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_dict_entry_tags_tag ON public.dictionary_entry_tags (tag_id);

-- ============================================================================
-- 6. DICTIONARY_REVISIONS — Version history / audit log
-- ============================================================================
CREATE TABLE public.dictionary_revisions (
  id              bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  entry_id        bigint NOT NULL,
  revision_number int NOT NULL DEFAULT 1,
  term            text NOT NULL,
  reading         text,
  language_code   text NOT NULL,
  definition      text NOT NULL,
  -- Snapshot of translations + examples as JSONB for immutable history
  translations_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  examples_snapshot     jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags_snapshot         jsonb NOT NULL DEFAULT '[]'::jsonb,
  change_summary  text,                         -- "Updated definition", "Added JA translation", etc.
  status          dictionary_status NOT NULL DEFAULT 'pending_review',
  created_by      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dictionary_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_revisions_entry_fkey FOREIGN KEY (entry_id)
    REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
  CONSTRAINT dictionary_revisions_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.profiles(id),
  CONSTRAINT dictionary_revisions_unique_version UNIQUE (entry_id, revision_number)
);

CREATE INDEX idx_dict_revisions_entry ON public.dictionary_revisions (entry_id);
CREATE INDEX idx_dict_revisions_status ON public.dictionary_revisions (status);
CREATE INDEX idx_dict_revisions_created_at ON public.dictionary_revisions (created_at DESC);

-- Add FK from entries back to revisions (deferred to avoid circular dependency)
ALTER TABLE public.dictionary_entries
  ADD CONSTRAINT dictionary_entries_current_revision_fkey
  FOREIGN KEY (current_revision_id) REFERENCES public.dictionary_revisions(id);

-- ============================================================================
-- 7. DICTIONARY_MODERATION_ACTIONS — Approve/reject log
-- ============================================================================
CREATE TABLE public.dictionary_moderation_actions (
  id            bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  revision_id   bigint NOT NULL,
  entry_id      bigint NOT NULL,
  action        text NOT NULL CHECK (action IN ('approve', 'reject')),
  reason        text,                           -- Required for rejections
  moderator_id  uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dictionary_moderation_actions_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_mod_revision_fkey FOREIGN KEY (revision_id)
    REFERENCES public.dictionary_revisions(id) ON DELETE CASCADE,
  CONSTRAINT dictionary_mod_entry_fkey FOREIGN KEY (entry_id)
    REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
  CONSTRAINT dictionary_mod_moderator_fkey FOREIGN KEY (moderator_id)
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_dict_mod_actions_entry ON public.dictionary_moderation_actions (entry_id);
CREATE INDEX idx_dict_mod_actions_revision ON public.dictionary_moderation_actions (revision_id);

-- ============================================================================
-- 8. DICTIONARY_SAVES — Bookmarked/saved entries per user
-- ============================================================================
CREATE TABLE public.dictionary_saves (
  entry_id   bigint NOT NULL,
  user_id    uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dictionary_saves_pkey PRIMARY KEY (entry_id, user_id),
  CONSTRAINT dictionary_saves_entry_fkey FOREIGN KEY (entry_id)
    REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
  CONSTRAINT dictionary_saves_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
);

-- ============================================================================
-- 9. FLASHCARDS table (if not already existing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id          bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id     uuid NOT NULL,
  front       text NOT NULL,
  back        text NOT NULL,
  source_type text,                             -- 'dictionary', 'article', 'manual'
  source_id   bigint,                           -- dictionary_entries.id if source_type='dictionary'
  deck        text DEFAULT 'default',
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_flashcards_user ON public.flashcards (user_id);
CREATE INDEX idx_flashcards_source ON public.flashcards (source_type, source_id);

-- ============================================================================
-- 10. HELPER FUNCTION — Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_dictionary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dictionary_entries_updated_at
  BEFORE UPDATE ON public.dictionary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_dictionary_updated_at();

-- ============================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all dictionary tables
ALTER TABLE public.dictionary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- ── dictionary_entries ──

-- Anyone can read APPROVED entries
CREATE POLICY "dict_entries_select_approved"
  ON public.dictionary_entries FOR SELECT
  USING (status = 'approved');

-- Authenticated users can see their own entries (any status)
CREATE POLICY "dict_entries_select_own"
  ON public.dictionary_entries FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Moderators (teacher/admin) can see all entries
CREATE POLICY "dict_entries_select_moderator"
  ON public.dictionary_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Authenticated users can create entries (as drafts)
CREATE POLICY "dict_entries_insert"
  ON public.dictionary_entries FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only owner can update their DRAFT entries
CREATE POLICY "dict_entries_update_own_draft"
  ON public.dictionary_entries FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND status = 'draft')
  WITH CHECK (created_by = auth.uid());

-- Moderators can update any entry (for status changes)
CREATE POLICY "dict_entries_update_moderator"
  ON public.dictionary_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Only owner can delete their DRAFT entries
CREATE POLICY "dict_entries_delete_own_draft"
  ON public.dictionary_entries FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND status = 'draft');

-- ── dictionary_translations ──

CREATE POLICY "dict_translations_select"
  ON public.dictionary_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dictionary_entries e
      WHERE e.id = entry_id AND (
        e.status = 'approved'
        OR e.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
      )
    )
  );

CREATE POLICY "dict_translations_insert"
  ON public.dictionary_translations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "dict_translations_update"
  ON public.dictionary_translations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- ── dictionary_examples ──

CREATE POLICY "dict_examples_select"
  ON public.dictionary_examples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dictionary_entries e
      WHERE e.id = entry_id AND (
        e.status = 'approved'
        OR e.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
      )
    )
  );

CREATE POLICY "dict_examples_insert"
  ON public.dictionary_examples FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "dict_examples_update"
  ON public.dictionary_examples FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- ── dictionary_entry_tags ──

CREATE POLICY "dict_entry_tags_select"
  ON public.dictionary_entry_tags FOR SELECT
  USING (true);  -- Tags are always readable

CREATE POLICY "dict_entry_tags_insert"
  ON public.dictionary_entry_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "dict_entry_tags_delete"
  ON public.dictionary_entry_tags FOR DELETE
  TO authenticated
  USING (true);

-- ── dictionary_revisions ──

CREATE POLICY "dict_revisions_select"
  ON public.dictionary_revisions FOR SELECT
  USING (
    -- Author can see their own revisions
    created_by = auth.uid()
    -- Anyone can see approved revisions
    OR status = 'approved'
    -- Moderators can see all
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "dict_revisions_insert"
  ON public.dictionary_revisions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Moderators can update revision status
CREATE POLICY "dict_revisions_update_moderator"
  ON public.dictionary_revisions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- ── dictionary_moderation_actions ──

CREATE POLICY "dict_mod_actions_select"
  ON public.dictionary_moderation_actions FOR SELECT
  TO authenticated
  USING (
    moderator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
    -- Entry authors can see moderation actions on their entries
    OR EXISTS (
      SELECT 1 FROM public.dictionary_entries e
      WHERE e.id = entry_id AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "dict_mod_actions_insert"
  ON public.dictionary_moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- ── dictionary_saves ──

CREATE POLICY "dict_saves_select"
  ON public.dictionary_saves FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "dict_saves_insert"
  ON public.dictionary_saves FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dict_saves_delete"
  ON public.dictionary_saves FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── flashcards ──

CREATE POLICY "flashcards_select_own"
  ON public.flashcards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "flashcards_insert_own"
  ON public.flashcards FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "flashcards_delete_own"
  ON public.flashcards FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
