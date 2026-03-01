-- ═══════════════════════════════════════════════════
-- Discussion tables for FutureHub
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Main discussions table
CREATE TABLE IF NOT EXISTS public.discussions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  answered    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Discussion ↔ Tag junction (reuses existing tags table)
CREATE TABLE IF NOT EXISTS public.discussion_tags (
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  tag_id        UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (discussion_id, tag_id)
);

-- 3. Vote tracking (up / down per user per discussion)
CREATE TYPE public.vote_type AS ENUM ('up', 'down');

CREATE TABLE IF NOT EXISTS public.discussion_votes (
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote          public.vote_type NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

-- 4. Discussion comments (threaded via parent_comment_id)
CREATE TABLE IF NOT EXISTS public.discussion_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id     UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body              TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Discussion bookmarks
CREATE TABLE IF NOT EXISTS public.discussion_bookmarks (
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

-- ═══════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_bookmarks ENABLE ROW LEVEL SECURITY;

-- discussions: anyone can read, auth users can insert their own, authors can update
CREATE POLICY "discussions_select" ON public.discussions FOR SELECT USING (true);
CREATE POLICY "discussions_insert" ON public.discussions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "discussions_update" ON public.discussions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "discussions_delete" ON public.discussions FOR DELETE USING (auth.uid() = author_id);

-- discussion_tags: anyone can read, auth users can insert/delete
CREATE POLICY "discussion_tags_select" ON public.discussion_tags FOR SELECT USING (true);
CREATE POLICY "discussion_tags_insert" ON public.discussion_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "discussion_tags_delete" ON public.discussion_tags FOR DELETE USING (true);

-- discussion_votes: anyone can read, auth users manage their own
CREATE POLICY "discussion_votes_select" ON public.discussion_votes FOR SELECT USING (true);
CREATE POLICY "discussion_votes_insert" ON public.discussion_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discussion_votes_update" ON public.discussion_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "discussion_votes_delete" ON public.discussion_votes FOR DELETE USING (auth.uid() = user_id);

-- discussion_comments: anyone can read, auth users can insert their own
CREATE POLICY "discussion_comments_select" ON public.discussion_comments FOR SELECT USING (true);
CREATE POLICY "discussion_comments_insert" ON public.discussion_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "discussion_comments_update" ON public.discussion_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "discussion_comments_delete" ON public.discussion_comments FOR DELETE USING (auth.uid() = author_id);

-- discussion_bookmarks: anyone can read, auth users manage their own
CREATE POLICY "discussion_bookmarks_select" ON public.discussion_bookmarks FOR SELECT USING (true);
CREATE POLICY "discussion_bookmarks_insert" ON public.discussion_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discussion_bookmarks_delete" ON public.discussion_bookmarks FOR DELETE USING (auth.uid() = user_id);
