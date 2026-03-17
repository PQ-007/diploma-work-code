-- ═══════════════════════════════════════════════════════════════
-- Profile Module — Schema additions & RLS
-- Run this migration against your Supabase project
-- ═══════════════════════════════════════════════════════════════

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_gradient text DEFAULT 'from-violet-600 via-purple-500 to-fuchsia-500',
  ADD COLUMN IF NOT EXISTS avatar_ring_color text DEFAULT 'from-amber-400 via-yellow-300 to-amber-500',
  ADD COLUMN IF NOT EXISTS pinned_article_ids bigint[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pinned_project_ids bigint[] DEFAULT '{}';

-- 2. Language skills table
CREATE TABLE IF NOT EXISTS public.language_skills (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language_name text NOT NULL,
  flag_emoji text DEFAULT '',
  proficiency_level text DEFAULT 'Beginner',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, language_name)
);

-- 3. RLS — profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read any profile
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. RLS — language_skills
ALTER TABLE public.language_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Language skills are viewable by everyone"
  ON public.language_skills FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own language skills"
  ON public.language_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own language skills"
  ON public.language_skills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own language skills"
  ON public.language_skills FOR DELETE
  USING (auth.uid() = user_id);

-- 5. RLS — user_follows (if not already set)
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);
