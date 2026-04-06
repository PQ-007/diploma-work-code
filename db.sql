-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.article_comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  article_id bigint NOT NULL,
  author_id uuid NOT NULL,
  parent_comment_id bigint,
  body text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT article_comments_pkey PRIMARY KEY (id),
  CONSTRAINT comment_author FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT article_has_comments FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT comment_replies FOREIGN KEY (parent_comment_id) REFERENCES public.article_comments(id)
);
CREATE TABLE public.article_reactions (
  user_id uuid NOT NULL,
  article_id bigint NOT NULL,
  reaction text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT article_reactions_pkey PRIMARY KEY (user_id, article_id),
  CONSTRAINT article_reactions_user FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT article_reactions_article FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.article_tags (
  article_id bigint NOT NULL,
  tag_id bigint NOT NULL,
  CONSTRAINT article_tags_pkey PRIMARY KEY (article_id, tag_id),
  CONSTRAINT article_tag_article FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT article_tag_tag FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.article_translation_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  translation_article_id bigint NOT NULL UNIQUE,
  source_type text NOT NULL CHECK (source_type = ANY (ARRAY['platform'::text, 'external'::text])),
  source_article_id bigint,
  external_source_url text,
  external_source_title text,
  external_source_author text,
  source_language_code text NOT NULL,
  translation_request_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT article_translation_sources_pkey PRIMARY KEY (id),
  CONSTRAINT article_translation_sources_translation_article_id_fkey FOREIGN KEY (translation_article_id) REFERENCES public.articles(id),
  CONSTRAINT article_translation_sources_source_article_id_fkey FOREIGN KEY (source_article_id) REFERENCES public.articles(id),
  CONSTRAINT article_translation_sources_translation_request_id_fkey FOREIGN KEY (translation_request_id) REFERENCES public.translation_requests(id)
);
CREATE TABLE public.article_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  article_id bigint NOT NULL,
  language_code text NOT NULL,
  title text,
  body text,
  published_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  edited_at timestamp without time zone,
  sub_title text,
  views bigint DEFAULT '0'::bigint,
  CONSTRAINT article_translations_pkey PRIMARY KEY (id),
  CONSTRAINT article_has_translations FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.articles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  author_id uuid NOT NULL,
  status USER-DEFINED NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  series text,
  base_lang_code text,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT article_author FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bookmarked_articles (
  user_id uuid NOT NULL,
  article_id bigint NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT bookmarked_articles_pkey PRIMARY KEY (user_id, article_id),
  CONSTRAINT bookmark_user FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT bookmark_article FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.dictionary_entries (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  term text NOT NULL,
  slug text NOT NULL UNIQUE,
  reading text,
  language_code text NOT NULL CHECK (language_code = ANY (ARRAY['mn'::text, 'ja'::text, 'en'::text])),
  definition text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::dictionary_status,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  views bigint NOT NULL DEFAULT 0,
  saves bigint NOT NULL DEFAULT 0,
  current_revision_id bigint,
  search_vector tsvector DEFAULT ((setweight(to_tsvector('simple'::regconfig, COALESCE(term, ''::text)), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, COALESCE(reading, ''::text)), 'A'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(definition, ''::text)), 'B'::"char")),
  CONSTRAINT dictionary_entries_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT dictionary_entries_current_revision_fkey FOREIGN KEY (current_revision_id) REFERENCES public.dictionary_revisions(id)
);
CREATE TABLE public.dictionary_entry_tags (
  entry_id bigint NOT NULL,
  tag_id bigint NOT NULL,
  CONSTRAINT dictionary_entry_tags_pkey PRIMARY KEY (entry_id, tag_id),
  CONSTRAINT dictionary_entry_tags_entry_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id),
  CONSTRAINT dictionary_entry_tags_tag_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.dictionary_examples (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  entry_id bigint NOT NULL,
  example_text text NOT NULL,
  source text,
  context text,
  language_code text NOT NULL CHECK (language_code = ANY (ARRAY['mn'::text, 'ja'::text, 'en'::text])),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dictionary_examples_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_examples_entry_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id),
  CONSTRAINT dictionary_examples_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.dictionary_moderation_actions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  revision_id bigint NOT NULL,
  entry_id bigint NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['approve'::text, 'reject'::text])),
  reason text,
  moderator_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dictionary_moderation_actions_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_mod_revision_fkey FOREIGN KEY (revision_id) REFERENCES public.dictionary_revisions(id),
  CONSTRAINT dictionary_mod_entry_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id),
  CONSTRAINT dictionary_mod_moderator_fkey FOREIGN KEY (moderator_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dictionary_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  entry_id bigint NOT NULL,
  revision_number integer NOT NULL DEFAULT 1,
  term text NOT NULL,
  reading text,
  language_code text NOT NULL,
  definition text NOT NULL,
  translations_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  examples_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  change_summary text,
  status USER-DEFINED NOT NULL DEFAULT 'pending_review'::dictionary_status,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dictionary_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_revisions_entry_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id),
  CONSTRAINT dictionary_revisions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.dictionary_saves (
  entry_id bigint NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dictionary_saves_pkey PRIMARY KEY (entry_id, user_id),
  CONSTRAINT dictionary_saves_entry_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id),
  CONSTRAINT dictionary_saves_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dictionary_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  entry_id bigint NOT NULL,
  language_code text NOT NULL CHECK (language_code = ANY (ARRAY['mn'::text, 'ja'::text, 'en'::text])),
  translated_term text NOT NULL,
  explanation text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dictionary_translations_pkey PRIMARY KEY (id),
  CONSTRAINT dictionary_translations_entry_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id),
  CONSTRAINT dictionary_translations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.discussion_bookmarks (
  discussion_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discussion_bookmarks_pkey PRIMARY KEY (discussion_id, user_id),
  CONSTRAINT discussion_bookmarks_discussion_id_fkey FOREIGN KEY (discussion_id) REFERENCES public.discussions(id),
  CONSTRAINT discussion_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.discussion_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  parent_comment_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discussion_comments_pkey PRIMARY KEY (id),
  CONSTRAINT discussion_comments_discussion_id_fkey FOREIGN KEY (discussion_id) REFERENCES public.discussions(id),
  CONSTRAINT discussion_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT discussion_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.discussion_comments(id)
);
CREATE TABLE public.discussion_tags (
  discussion_id uuid NOT NULL,
  tag_id bigint NOT NULL,
  CONSTRAINT discussion_tags_pkey PRIMARY KEY (discussion_id, tag_id),
  CONSTRAINT discussion_tags_discussion_id_fkey FOREIGN KEY (discussion_id) REFERENCES public.discussions(id),
  CONSTRAINT discussion_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.discussion_votes (
  discussion_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discussion_votes_pkey PRIMARY KEY (discussion_id, user_id),
  CONSTRAINT discussion_votes_discussion_id_fkey FOREIGN KEY (discussion_id) REFERENCES public.discussions(id),
  CONSTRAINT discussion_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.discussions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT ''::text,
  pinned boolean NOT NULL DEFAULT false,
  answered boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discussions_pkey PRIMARY KEY (id),
  CONSTRAINT discussions_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);
CREATE TABLE public.flashcards (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  source_type text,
  source_id bigint,
  deck text DEFAULT 'default'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.language_skills (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  language_name text NOT NULL,
  flag_emoji text DEFAULT ''::text,
  proficiency_level text DEFAULT 'Beginner'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT language_skills_pkey PRIMARY KEY (id),
  CONSTRAINT language_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.poll_options (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  poll_id bigint NOT NULL,
  option_text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  CONSTRAINT poll_options_pkey PRIMARY KEY (id),
  CONSTRAINT poll_options_poll_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id)
);
CREATE TABLE public.poll_votes (
  poll_id bigint NOT NULL,
  user_id uuid NOT NULL,
  option_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (poll_id, user_id),
  CONSTRAINT poll_votes_poll_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_opt_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id),
  CONSTRAINT poll_votes_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.polls (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  author_id uuid NOT NULL,
  question text NOT NULL,
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT polls_pkey PRIMARY KEY (id),
  CONSTRAINT polls_author_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  user_name text,
  avatar_url text,
  bio text,
  created_at timestamp without time zone DEFAULT now(),
  email character varying,
  role USER-DEFINED DEFAULT 'user'::user_type,
  ranking_point integer DEFAULT 0,
  display_name text,
  skills text,
  interest text,
  language_level jsonb,
  banner_gradient text DEFAULT 'from-violet-600 via-purple-500 to-fuchsia-500'::text,
  avatar_ring_color text DEFAULT 'from-amber-400 via-yellow-300 to-amber-500'::text,
  pinned_project_ids ARRAY DEFAULT '{}'::bigint[],
  pinned_article_ids ARRAY DEFAULT '{}'::bigint[],
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.project_comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id bigint NOT NULL,
  user_id uuid NOT NULL,
  parent_id bigint,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_comments_pkey PRIMARY KEY (id),
  CONSTRAINT project_comments_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_comments_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT project_comments_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.project_comments(id)
);
CREATE TABLE public.project_files (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id bigint NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_files_pkey PRIMARY KEY (id),
  CONSTRAINT project_files_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.project_likes (
  project_id bigint NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_likes_pkey PRIMARY KEY (project_id, user_id),
  CONSTRAINT project_likes_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_likes_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.project_members (
  project_id bigint NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'viewer'::project_member_role,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id),
  CONSTRAINT project_members_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_members_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.project_milestones (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id bigint NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT project_milestones_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_updates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id bigint NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  update_type text NOT NULL DEFAULT 'regular'::text CHECK (update_type = ANY (ARRAY['regular'::text, 'milestone'::text, 'release'::text, 'announcement'::text])),
  image_url text,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_updates_pkey PRIMARY KEY (id),
  CONSTRAINT project_updates_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_updates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.project_sections (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id bigint NOT NULL,
  title text NOT NULL,
  section_type text NOT NULL DEFAULT 'custom'::text CHECK (section_type = ANY (ARRAY['overview'::text, 'goals'::text, 'architecture'::text, 'implementation'::text, 'results'::text, 'lessons_learned'::text, 'custom'::text])),
  content text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_sections_pkey PRIMARY KEY (id),
  CONSTRAINT project_sections_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_tags (
  project_id bigint NOT NULL,
  tag_id bigint NOT NULL,
  CONSTRAINT project_tags_pkey PRIMARY KEY (project_id, tag_id),
  CONSTRAINT project_tags_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_tags_tag_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.projects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text,
  project_type USER-DEFINED NOT NULL DEFAULT 'coding'::project_type,
  difficulty USER-DEFINED NOT NULL DEFAULT 'beginner'::project_difficulty,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::project_status,
  is_public boolean NOT NULL DEFAULT false,
  repository_url text,
  demo_url text,
  thumbnail_url text,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  technologies ARRAY NOT NULL DEFAULT '{}'::text[],
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  published_at timestamp with time zone,
  views bigint NOT NULL DEFAULT 0,
  likes_count bigint NOT NULL DEFAULT 0,
  search_vector tsvector,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.tag_similarities (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  tag_a_id bigint NOT NULL,
  tag_b_id bigint NOT NULL,
  similarity_score numeric NOT NULL,
  similarity_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tag_similarities_pkey PRIMARY KEY (id),
  CONSTRAINT tag_similarities_tag_a_fkey FOREIGN KEY (tag_a_id) REFERENCES public.tags(id),
  CONSTRAINT tag_similarities_tag_b_fkey FOREIGN KEY (tag_b_id) REFERENCES public.tags(id)
);
CREATE TABLE public.tags (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.translation_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  original_article_id bigint NOT NULL,
  requester_id uuid NOT NULL,
  target_language_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'revoked'::text])),
  request_message text,
  response_message text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT translation_requests_pkey PRIMARY KEY (id),
  CONSTRAINT translation_requests_original_article_id_fkey FOREIGN KEY (original_article_id) REFERENCES public.articles(id),
  CONSTRAINT translation_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_follows_follower_fk FOREIGN KEY (follower_id) REFERENCES public.profiles(id),
  CONSTRAINT user_follows_following_fk FOREIGN KEY (following_id) REFERENCES public.profiles(id)
);