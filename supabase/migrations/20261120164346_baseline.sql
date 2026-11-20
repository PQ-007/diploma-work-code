

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."article_status" AS ENUM (
    'draft',
    'published',
    'archieved'
);


ALTER TYPE "public"."article_status" OWNER TO "postgres";


CREATE TYPE "public"."dictionary_status" AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'rejected'
);


ALTER TYPE "public"."dictionary_status" OWNER TO "postgres";


CREATE TYPE "public"."project_category" AS ENUM (
    'creative_design',
    'mobile_dev',
    'game_dev',
    'web_dev',
    'hardware_iot',
    'ai',
    'other'
);


ALTER TYPE "public"."project_category" OWNER TO "postgres";


CREATE TYPE "public"."project_difficulty" AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);


ALTER TYPE "public"."project_difficulty" OWNER TO "postgres";


CREATE TYPE "public"."project_member_role" AS ENUM (
    'owner',
    'contributor',
    'viewer'
);


ALTER TYPE "public"."project_member_role" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'draft',
    'in_progress',
    'completed',
    'archived'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."project_type" AS ENUM (
    'diploma',
    'contest',
    'intership',
    'private'
);


ALTER TYPE "public"."project_type" OWNER TO "postgres";


CREATE TYPE "public"."user_type" AS ENUM (
    'admin',
    'user',
    'teacher',
    'super_admin'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE TYPE "public"."vote_type" AS ENUM (
    'up',
    'down'
);


ALTER TYPE "public"."vote_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_dictionary_duplicates"("search_term" "text", "lang_code" "text" DEFAULT NULL::"text") RETURNS TABLE("id" bigint, "term" "text", "slug" "text", "language_code" "text", "status" "public"."dictionary_status", "similarity_score" real)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    e.id,
    e.term,
    e.slug,
    e.language_code,
    e.status,
    similarity(e.term, search_term)::real AS similarity_score
  FROM public.dictionary_entries e
  WHERE e.status IN ('approved', 'pending_review')
    AND (lang_code IS NULL OR e.language_code = lang_code)
    AND (
      similarity(e.term, search_term) > 0.3
      OR e.term ILIKE search_term || '%'
      OR lower(e.term) = lower(search_term)
    )
  ORDER BY similarity(e.term, search_term) DESC
  LIMIT 5;
$$;


ALTER FUNCTION "public"."check_dictionary_duplicates"("search_term" "text", "lang_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_profile_privileged_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
      NEW.ranking_point := 0;
    ELSE
      NEW.role := OLD.role;
      NEW.ranking_point := OLD.ranking_point;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."guard_profile_privileged_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_project_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    NEW.created_by := OLD.created_by;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."guard_project_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_article_view"("p_article_id" bigint, "p_language_code" "text") RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE article_translations t
  SET views = COALESCE(t.views, 0) + 1
  FROM articles a
  WHERE a.id = t.article_id
    AND a.status = 'published'
    AND t.article_id = p_article_id
    AND t.language_code = p_language_code
  RETURNING t.views;
$$;


ALTER FUNCTION "public"."increment_article_view"("p_article_id" bigint, "p_language_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_dictionary_view"("p_entry_id" bigint) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE dictionary_entries
  SET views = views + 1
  WHERE id = p_entry_id AND status = 'approved'
  RETURNING views;
$$;


ALTER FUNCTION "public"."increment_dictionary_view"("p_entry_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_project_view"("p_project_id" bigint) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE projects
  SET views = views + 1
  WHERE id = p_project_id AND is_public = true
  RETURNING views;
$$;


ALTER FUNCTION "public"."increment_project_view"("p_project_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."projects_search_vector_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.technologies, ' '), '')), 'C');

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."projects_search_vector_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalc_project_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_count int;
  done_count  int;
  target_project_id bigint;
BEGIN
  target_project_id := COALESCE(NEW.project_id, OLD.project_id);

  SELECT
    count(*),
    count(*) FILTER (WHERE completed)
  INTO total_count, done_count
  FROM public.project_milestones
  WHERE project_id = target_project_id;

  UPDATE public.projects
  SET progress = CASE
    WHEN total_count = 0 THEN 0
    ELSE round((done_count::numeric / total_count) * 100)
  END
  WHERE id = target_project_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."recalc_project_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_is_project_contributor"("p_project_id" bigint, "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT EXISTS (SELECT 1 FROM project_members WHERE project_id = p_project_id AND user_id = p_user_id AND role IN ('owner', 'contributor')); $$;


ALTER FUNCTION "public"."rls_is_project_contributor"("p_project_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_is_project_member"("p_project_id" bigint, "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT EXISTS (SELECT 1 FROM project_members WHERE project_id = p_project_id AND user_id = p_user_id); $$;


ALTER FUNCTION "public"."rls_is_project_member"("p_project_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_project_is_public"("p_project_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND is_public = true); $$;


ALTER FUNCTION "public"."rls_project_is_public"("p_project_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_project_owner"("p_project_id" bigint) RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT created_by FROM projects WHERE id = p_project_id; $$;


ALTER FUNCTION "public"."rls_project_owner"("p_project_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_dictionary"("search_query" "text", "lang_filter" "text" DEFAULT NULL::"text", "result_limit" integer DEFAULT 20, "result_offset" integer DEFAULT 0) RETURNS TABLE("id" bigint, "term" "text", "slug" "text", "reading" "text", "language_code" "text", "definition" "text", "status" "public"."dictionary_status", "views" bigint, "saves" bigint, "ft_rank" real, "trgm_rank" real, "combined_rank" real)
    LANGUAGE "sql" STABLE
    AS $$
  WITH translation_candidates AS (
    -- Find entries that have a matching translated term
    SELECT DISTINCT entry_id
    FROM public.dictionary_translations
    WHERE translated_term ILIKE '%' || search_query || '%'
       OR similarity(translated_term, search_query) > 0.2
  ),
  trgm_scores AS (
    -- Best trigram score across all translations per entry
    SELECT entry_id, MAX(similarity(translated_term, search_query)) AS max_score
    FROM public.dictionary_translations
    GROUP BY entry_id
  )
  SELECT
    e.id,
    e.term,
    e.slug,
    e.reading,
    e.language_code,
    e.definition,
    e.status,
    e.views,
    e.saves,
    ts_rank_cd(e.search_vector, plainto_tsquery('simple', search_query))::real AS ft_rank,
    GREATEST(
      similarity(e.term, search_query),
      COALESCE(ts.max_score, 0)
    )::real AS trgm_rank,
    (
      0.6 * ts_rank_cd(e.search_vector, plainto_tsquery('simple', search_query))
      + 0.4 * GREATEST(
        similarity(e.term, search_query),
        COALESCE(ts.max_score, 0)
      )
    )::real AS combined_rank
  FROM public.dictionary_entries e
  LEFT JOIN trgm_scores ts ON ts.entry_id = e.id
  WHERE e.status = 'approved'
    AND (lang_filter IS NULL OR e.language_code = lang_filter)
    AND (
      e.search_vector @@ plainto_tsquery('simple', search_query)
      OR similarity(e.term, search_query) > 0.2
      OR e.term ILIKE search_query || '%'
      OR e.id IN (SELECT entry_id FROM translation_candidates)
    )
  ORDER BY combined_rank DESC, e.views DESC
  LIMIT result_limit
  OFFSET result_offset;
$$;


ALTER FUNCTION "public"."search_dictionary"("search_query" "text", "lang_filter" "text", "result_limit" integer, "result_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_projects"("search_term" "text", "filter_status" "public"."project_status" DEFAULT NULL::"public"."project_status", "filter_difficulty" "public"."project_difficulty" DEFAULT NULL::"public"."project_difficulty", "filter_type" "public"."project_category" DEFAULT NULL::"public"."project_category", "filter_category" "text" DEFAULT NULL::"text", "sort_by" "text" DEFAULT 'relevance'::"text", "page_limit" integer DEFAULT 20, "page_offset" integer DEFAULT 0) RETURNS TABLE("id" bigint, "title" "text", "slug" "text", "description" "text", "category" "text", "project_type" "public"."project_category", "difficulty" "public"."project_difficulty", "status" "public"."project_status", "is_public" boolean, "thumbnail_url" "text", "progress" integer, "technologies" "text"[], "created_by" "uuid", "created_at" timestamp with time zone, "views" bigint, "likes_count" bigint, "rank" real)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  ts_query tsquery;
BEGIN
  ts_query := plainto_tsquery('simple', coalesce(search_term, ''));

  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.description,
    p.category,
    p.project_type,
    p.difficulty,
    p.status,
    p.is_public,
    p.thumbnail_url,
    p.progress,
    p.technologies,
    p.created_by,
    p.created_at,
    p.views,
    p.likes_count,
    (
      0.6 * ts_rank(p.search_vector, ts_query) +
      0.4 * similarity(p.title, coalesce(search_term, ''))
    )::real AS rank
  FROM public.projects p
  WHERE
    p.is_public = true
    AND (
      search_term IS NULL
      OR search_term = ''
      OR (
        p.search_vector @@ ts_query
        OR similarity(p.title, search_term) > 0.1
      )
    )
    AND (filter_status IS NULL OR p.status = filter_status)
    AND (filter_difficulty IS NULL OR p.difficulty = filter_difficulty)
    AND (filter_type IS NULL OR p.project_type = filter_type)
    AND (filter_category IS NULL OR p.category = filter_category)
  ORDER BY
    CASE
      WHEN sort_by = 'relevance' AND search_term IS NOT NULL AND search_term <> ''
      THEN 0.6 * ts_rank(p.search_vector, ts_query) + 0.4 * similarity(p.title, search_term)
      ELSE 0
    END DESC,
    CASE
      WHEN sort_by = 'newest'
      THEN extract(epoch FROM p.created_at)
      ELSE 0
    END DESC,
    CASE
      WHEN sort_by = 'most_liked'
      THEN p.likes_count
      ELSE 0
    END DESC,
    p.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;


ALTER FUNCTION "public"."search_projects"("search_term" "text", "filter_status" "public"."project_status", "filter_difficulty" "public"."project_difficulty", "filter_type" "public"."project_category", "filter_category" "text", "sort_by" "text", "page_limit" integer, "page_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."suggest_dictionary_terms"("partial_term" "text", "result_limit" integer DEFAULT 5) RETURNS TABLE("id" bigint, "term" "text", "slug" "text", "language_code" "text", "similarity_score" real)
    LANGUAGE "sql" STABLE
    AS $$
  WITH trgm_scores AS (
    -- Best trigram score across translations per entry
    SELECT entry_id, MAX(similarity(translated_term, partial_term)) AS max_score
    FROM public.dictionary_translations
    WHERE translated_term ILIKE partial_term || '%'
       OR similarity(translated_term, partial_term) > 0.2
    GROUP BY entry_id
  )
  SELECT
    e.id,
    e.term,
    e.slug,
    e.language_code,
    GREATEST(
      similarity(e.term, partial_term),
      COALESCE(ts.max_score, 0)
    )::real AS similarity_score
  FROM public.dictionary_entries e
  LEFT JOIN trgm_scores ts ON ts.entry_id = e.id
  WHERE e.status = 'approved'
    AND (
      e.term ILIKE partial_term || '%'
      OR similarity(e.term, partial_term) > 0.2
      OR ts.entry_id IS NOT NULL
    )
  ORDER BY
    (e.term ILIKE partial_term || '%') DESC,
    similarity_score DESC
  LIMIT result_limit;
$$;


ALTER FUNCTION "public"."suggest_dictionary_terms"("partial_term" "text", "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_dictionary_saves"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE dictionary_entries SET saves = saves + 1 WHERE id = NEW.entry_id;
  ELSE
    UPDATE dictionary_entries SET saves = GREATEST(saves - 1, 0) WHERE id = OLD.entry_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_dictionary_saves"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_project_likes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
  ELSE
    UPDATE projects SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_project_likes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_dictionary_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (to_jsonb(NEW) - 'views' - 'saves' - 'updated_at')
     IS DISTINCT FROM (to_jsonb(OLD) - 'views' - 'saves' - 'updated_at') THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_dictionary_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects
    SET likes_count = likes_count + 1
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects
    SET likes_count = likes_count - 1
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_project_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_translation_request_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_translation_request_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."article_comments" (
    "id" bigint NOT NULL,
    "article_id" bigint NOT NULL,
    "author_id" "uuid" NOT NULL,
    "parent_comment_id" bigint,
    "body" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."article_comments" OWNER TO "postgres";


ALTER TABLE "public"."article_comments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."article_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."article_reactions" (
    "user_id" "uuid" NOT NULL,
    "article_id" bigint NOT NULL,
    "reaction" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."article_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."article_tags" (
    "article_id" bigint NOT NULL,
    "tag_id" bigint NOT NULL
);


ALTER TABLE "public"."article_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."article_translation_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "translation_article_id" bigint NOT NULL,
    "source_type" "text" NOT NULL,
    "source_article_id" bigint,
    "external_source_url" "text",
    "external_source_title" "text",
    "external_source_author" "text",
    "source_language_code" "text" NOT NULL,
    "translation_request_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "article_translation_sources_source_type_check" CHECK (("source_type" = ANY (ARRAY['platform'::"text", 'external'::"text"]))),
    CONSTRAINT "ats_platform_requires_source_article" CHECK (((("source_type" = 'platform'::"text") AND ("source_article_id" IS NOT NULL) AND ("external_source_url" IS NULL)) OR (("source_type" = 'external'::"text") AND ("external_source_url" IS NOT NULL) AND ("source_article_id" IS NULL))))
);


ALTER TABLE "public"."article_translation_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."article_translations" (
    "id" bigint NOT NULL,
    "article_id" bigint NOT NULL,
    "language_code" "text" NOT NULL,
    "title" "text",
    "body" "text",
    "published_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "edited_at" timestamp without time zone,
    "sub_title" "text",
    "views" bigint DEFAULT '0'::bigint
);


ALTER TABLE "public"."article_translations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."article_translations"."body" IS 'MDX content';



ALTER TABLE "public"."article_translations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."article_translations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" bigint NOT NULL,
    "author_id" "uuid" NOT NULL,
    "status" "public"."article_status" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "series" "text",
    "base_lang_code" "text" DEFAULT 'mn'::"text",
    "project_id" bigint
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."articles"."status" IS 'draft | published | archieved';



ALTER TABLE "public"."articles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."articles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bookmarked_articles" (
    "user_id" "uuid" NOT NULL,
    "article_id" bigint NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."bookmarked_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dictionary_entries" (
    "id" bigint NOT NULL,
    "term" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "reading" "text",
    "language_code" "text" NOT NULL,
    "definition" "text" NOT NULL,
    "status" "public"."dictionary_status" DEFAULT 'draft'::"public"."dictionary_status" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "views" bigint DEFAULT 0 NOT NULL,
    "saves" bigint DEFAULT 0 NOT NULL,
    "current_revision_id" bigint,
    "search_vector" "tsvector" GENERATED ALWAYS AS ((("setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("term", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("reading", ''::"text")), 'A'::"char")) || "setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("definition", ''::"text")), 'B'::"char"))) STORED,
    CONSTRAINT "dictionary_entries_language_code_check" CHECK (("language_code" = ANY (ARRAY['mn'::"text", 'ja'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."dictionary_entries" OWNER TO "postgres";


ALTER TABLE "public"."dictionary_entries" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."dictionary_entries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."dictionary_entry_tags" (
    "entry_id" bigint NOT NULL,
    "tag_id" bigint NOT NULL
);


ALTER TABLE "public"."dictionary_entry_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dictionary_examples" (
    "id" bigint NOT NULL,
    "entry_id" bigint NOT NULL,
    "example_text" "text" NOT NULL,
    "source" "text",
    "context" "text",
    "language_code" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dictionary_examples_language_code_check" CHECK (("language_code" = ANY (ARRAY['mn'::"text", 'ja'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."dictionary_examples" OWNER TO "postgres";


ALTER TABLE "public"."dictionary_examples" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."dictionary_examples_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."dictionary_moderation_actions" (
    "id" bigint NOT NULL,
    "revision_id" bigint NOT NULL,
    "entry_id" bigint NOT NULL,
    "action" "text" NOT NULL,
    "reason" "text",
    "moderator_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dictionary_moderation_actions_action_check" CHECK (("action" = ANY (ARRAY['approve'::"text", 'reject'::"text"])))
);


ALTER TABLE "public"."dictionary_moderation_actions" OWNER TO "postgres";


ALTER TABLE "public"."dictionary_moderation_actions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."dictionary_moderation_actions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."dictionary_revisions" (
    "id" bigint NOT NULL,
    "entry_id" bigint NOT NULL,
    "revision_number" integer DEFAULT 1 NOT NULL,
    "term" "text" NOT NULL,
    "reading" "text",
    "language_code" "text" NOT NULL,
    "definition" "text" NOT NULL,
    "translations_snapshot" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "examples_snapshot" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "tags_snapshot" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "change_summary" "text",
    "status" "public"."dictionary_status" DEFAULT 'pending_review'::"public"."dictionary_status" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dictionary_revisions" OWNER TO "postgres";


ALTER TABLE "public"."dictionary_revisions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."dictionary_revisions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."dictionary_saves" (
    "entry_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dictionary_saves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dictionary_translations" (
    "id" bigint NOT NULL,
    "entry_id" bigint NOT NULL,
    "language_code" "text" NOT NULL,
    "translated_term" "text" NOT NULL,
    "explanation" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dictionary_translations_language_code_check" CHECK (("language_code" = ANY (ARRAY['mn'::"text", 'ja'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."dictionary_translations" OWNER TO "postgres";


ALTER TABLE "public"."dictionary_translations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."dictionary_translations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."discussion_bookmarks" (
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discussion_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussion_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discussion_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussion_tags" (
    "discussion_id" "uuid" NOT NULL,
    "tag_id" bigint NOT NULL
);


ALTER TABLE "public"."discussion_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussion_votes" (
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote" "public"."vote_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discussion_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "pinned" boolean DEFAULT false NOT NULL,
    "answered" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discussions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."language_skills" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "language_name" "text" NOT NULL,
    "flag_emoji" "text" DEFAULT ''::"text",
    "proficiency_level" "text" DEFAULT 'Beginner'::"text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."language_skills" OWNER TO "postgres";


ALTER TABLE "public"."language_skills" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."language_skills_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."poll_options" (
    "id" bigint NOT NULL,
    "poll_id" bigint NOT NULL,
    "option_text" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."poll_options" OWNER TO "postgres";


ALTER TABLE "public"."poll_options" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."poll_options_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."poll_votes" (
    "poll_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "option_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."polls" (
    "id" bigint NOT NULL,
    "author_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."polls" OWNER TO "postgres";


ALTER TABLE "public"."polls" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."polls_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "user_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "email" character varying,
    "role" "public"."user_type" DEFAULT 'user'::"public"."user_type",
    "ranking_point" integer DEFAULT 0,
    "display_name" "text",
    "skills" "text",
    "interest" "text",
    "language_level" "jsonb",
    "banner_gradient" "text" DEFAULT 'from-violet-600 via-purple-500 to-fuchsia-500'::"text",
    "avatar_ring_color" "text" DEFAULT 'from-amber-400 via-yellow-300 to-amber-500'::"text",
    "pinned_project_ids" bigint[] DEFAULT '{}'::bigint[],
    "pinned_article_ids" bigint[] DEFAULT '{}'::bigint[]
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_comments" (
    "id" bigint NOT NULL,
    "project_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" bigint,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_comments" OWNER TO "postgres";


ALTER TABLE "public"."project_comments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."project_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" bigint NOT NULL,
    "project_id" bigint NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text",
    "file_size" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_files" OWNER TO "postgres";


ALTER TABLE "public"."project_files" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."project_files_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_likes" (
    "project_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "project_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."project_member_role" DEFAULT 'viewer'::"public"."project_member_role" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_tags" (
    "project_id" bigint NOT NULL,
    "tag_id" bigint NOT NULL
);


ALTER TABLE "public"."project_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_updates" (
    "id" bigint NOT NULL,
    "project_id" bigint NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "update_type" "text" DEFAULT 'regular'::"text" NOT NULL,
    "image_url" "text",
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_updates_update_type_check" CHECK (("update_type" = ANY (ARRAY['regular'::"text", 'milestone'::"text", 'release'::"text", 'announcement'::"text"])))
);


ALTER TABLE "public"."project_updates" OWNER TO "postgres";


ALTER TABLE "public"."project_updates" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."project_updates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "category" "public"."project_category",
    "difficulty" "public"."project_difficulty" DEFAULT 'beginner'::"public"."project_difficulty" NOT NULL,
    "status" "public"."project_status" DEFAULT 'draft'::"public"."project_status" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "repository_url" "text",
    "demo_url" "text",
    "thumbnail_url" "text",
    "progress" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    "views" bigint DEFAULT 0 NOT NULL,
    "likes_count" bigint DEFAULT 0 NOT NULL,
    "video_url" "text",
    "type" "public"."project_type" DEFAULT 'private'::"public"."project_type",
    CONSTRAINT "projects_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


ALTER TABLE "public"."projects" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tag_similarities" (
    "id" bigint NOT NULL,
    "tag_a_id" bigint NOT NULL,
    "tag_b_id" bigint NOT NULL,
    "similarity_score" numeric(3,2) NOT NULL,
    "similarity_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tag_similarities" OWNER TO "postgres";


ALTER TABLE "public"."tag_similarities" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."tag_similarities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


ALTER TABLE "public"."tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."translation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "original_article_id" bigint NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "target_language_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "request_message" "text",
    "response_message" "text",
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "translation_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."translation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_follows_no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


ALTER TABLE ONLY "public"."article_comments"
    ADD CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_reactions"
    ADD CONSTRAINT "article_reactions_pkey" PRIMARY KEY ("user_id", "article_id");



ALTER TABLE ONLY "public"."article_tags"
    ADD CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id", "tag_id");



ALTER TABLE ONLY "public"."article_tags"
    ADD CONSTRAINT "article_tags_unique" UNIQUE ("article_id", "tag_id");



ALTER TABLE ONLY "public"."article_translation_sources"
    ADD CONSTRAINT "article_translation_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_translation_sources"
    ADD CONSTRAINT "article_translation_sources_translation_article_id_key" UNIQUE ("translation_article_id");



ALTER TABLE ONLY "public"."article_translations"
    ADD CONSTRAINT "article_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_translations"
    ADD CONSTRAINT "article_translations_unique" UNIQUE ("article_id", "language_code");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarked_articles"
    ADD CONSTRAINT "bookmarked_articles_pkey" PRIMARY KEY ("user_id", "article_id");



ALTER TABLE ONLY "public"."dictionary_entries"
    ADD CONSTRAINT "dictionary_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dictionary_entries"
    ADD CONSTRAINT "dictionary_entries_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."dictionary_entry_tags"
    ADD CONSTRAINT "dictionary_entry_tags_pkey" PRIMARY KEY ("entry_id", "tag_id");



ALTER TABLE ONLY "public"."dictionary_examples"
    ADD CONSTRAINT "dictionary_examples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dictionary_moderation_actions"
    ADD CONSTRAINT "dictionary_moderation_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dictionary_revisions"
    ADD CONSTRAINT "dictionary_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dictionary_revisions"
    ADD CONSTRAINT "dictionary_revisions_unique_version" UNIQUE ("entry_id", "revision_number");



ALTER TABLE ONLY "public"."dictionary_saves"
    ADD CONSTRAINT "dictionary_saves_pkey" PRIMARY KEY ("entry_id", "user_id");



ALTER TABLE ONLY "public"."dictionary_translations"
    ADD CONSTRAINT "dictionary_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion_bookmarks"
    ADD CONSTRAINT "discussion_bookmarks_pkey" PRIMARY KEY ("discussion_id", "user_id");



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion_tags"
    ADD CONSTRAINT "discussion_tags_pkey" PRIMARY KEY ("discussion_id", "tag_id");



ALTER TABLE ONLY "public"."discussion_votes"
    ADD CONSTRAINT "discussion_votes_pkey" PRIMARY KEY ("discussion_id", "user_id");



ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."language_skills"
    ADD CONSTRAINT "language_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."language_skills"
    ADD CONSTRAINT "language_skills_user_id_language_name_key" UNIQUE ("user_id", "language_name");



ALTER TABLE ONLY "public"."poll_options"
    ADD CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("poll_id", "user_id");



ALTER TABLE ONLY "public"."polls"
    ADD CONSTRAINT "polls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_pkey" PRIMARY KEY ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_tags"
    ADD CONSTRAINT "project_tags_pkey" PRIMARY KEY ("project_id", "tag_id");



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tag_similarities"
    ADD CONSTRAINT "tag_similarities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_similarities"
    ADD CONSTRAINT "tag_similarities_unique" UNIQUE ("tag_a_id", "tag_b_id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."translation_requests"
    ADD CONSTRAINT "translation_requests_original_article_id_requester_id_targe_key" UNIQUE ("original_article_id", "requester_id", "target_language_code");



ALTER TABLE ONLY "public"."translation_requests"
    ADD CONSTRAINT "translation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("follower_id", "following_id");



CREATE INDEX "article_translation_sources_source_article_id_idx" ON "public"."article_translation_sources" USING "btree" ("source_article_id");



CREATE UNIQUE INDEX "article_translations_article_id_language_code_idx" ON "public"."article_translations" USING "btree" ("article_id", "language_code");



CREATE INDEX "articles_project_id_idx" ON "public"."articles" USING "btree" ("project_id");



CREATE INDEX "discussion_comments_discussion_id_created_at_idx" ON "public"."discussion_comments" USING "btree" ("discussion_id", "created_at");



CREATE INDEX "discussion_tags_tag_id_idx" ON "public"."discussion_tags" USING "btree" ("tag_id");



CREATE INDEX "discussions_author_id_idx" ON "public"."discussions" USING "btree" ("author_id");



CREATE INDEX "discussions_created_at_idx" ON "public"."discussions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_dict_entries_created_at" ON "public"."dictionary_entries" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_dict_entries_created_by" ON "public"."dictionary_entries" USING "btree" ("created_by");



CREATE INDEX "idx_dict_entries_language" ON "public"."dictionary_entries" USING "btree" ("language_code");



CREATE INDEX "idx_dict_entries_search_vector" ON "public"."dictionary_entries" USING "gin" ("search_vector");



CREATE INDEX "idx_dict_entries_slug" ON "public"."dictionary_entries" USING "btree" ("slug");



CREATE INDEX "idx_dict_entries_status" ON "public"."dictionary_entries" USING "btree" ("status");



CREATE INDEX "idx_dict_entries_term_trgm" ON "public"."dictionary_entries" USING "gin" ("term" "public"."gin_trgm_ops");



CREATE INDEX "idx_dict_entry_tags_tag" ON "public"."dictionary_entry_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_dict_examples_entry" ON "public"."dictionary_examples" USING "btree" ("entry_id");



CREATE INDEX "idx_dict_mod_actions_entry" ON "public"."dictionary_moderation_actions" USING "btree" ("entry_id");



CREATE INDEX "idx_dict_mod_actions_revision" ON "public"."dictionary_moderation_actions" USING "btree" ("revision_id");



CREATE INDEX "idx_dict_revisions_created_at" ON "public"."dictionary_revisions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_dict_revisions_entry" ON "public"."dictionary_revisions" USING "btree" ("entry_id");



CREATE INDEX "idx_dict_revisions_status" ON "public"."dictionary_revisions" USING "btree" ("status");



CREATE INDEX "idx_dict_translations_entry" ON "public"."dictionary_translations" USING "btree" ("entry_id");



CREATE INDEX "idx_dict_translations_lang" ON "public"."dictionary_translations" USING "btree" ("language_code");



CREATE INDEX "idx_project_comments_parent" ON "public"."project_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_project_comments_project" ON "public"."project_comments" USING "btree" ("project_id");



CREATE INDEX "idx_project_comments_user" ON "public"."project_comments" USING "btree" ("user_id");



CREATE INDEX "idx_project_files_project" ON "public"."project_files" USING "btree" ("project_id");



CREATE INDEX "idx_project_likes_user" ON "public"."project_likes" USING "btree" ("user_id");



CREATE INDEX "idx_project_members_user" ON "public"."project_members" USING "btree" ("user_id");



CREATE INDEX "idx_project_tags_tag" ON "public"."project_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_projects_created_by" ON "public"."projects" USING "btree" ("created_by");



CREATE INDEX "idx_projects_difficulty" ON "public"."projects" USING "btree" ("difficulty");



CREATE INDEX "idx_projects_is_public" ON "public"."projects" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_projects_slug" ON "public"."projects" USING "btree" ("slug");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_projects_title_trgm" ON "public"."projects" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_tag_similarities_score" ON "public"."tag_similarities" USING "btree" ("similarity_score" DESC);



CREATE INDEX "idx_tag_similarities_tag_a" ON "public"."tag_similarities" USING "btree" ("tag_a_id");



CREATE INDEX "idx_tag_similarities_tag_b" ON "public"."tag_similarities" USING "btree" ("tag_b_id");



CREATE INDEX "idx_tags_usage_count" ON "public"."tags" USING "btree" ("usage_count" DESC);



CREATE INDEX "idx_translation_requests_original" ON "public"."translation_requests" USING "btree" ("original_article_id");



CREATE INDEX "idx_translation_requests_requester" ON "public"."translation_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_translation_requests_status" ON "public"."translation_requests" USING "btree" ("status");



CREATE INDEX "idx_translation_sources_source_article" ON "public"."article_translation_sources" USING "btree" ("source_article_id");



CREATE INDEX "idx_translation_sources_type" ON "public"."article_translation_sources" USING "btree" ("source_type");



CREATE INDEX "translation_requests_original_article_id_idx" ON "public"."translation_requests" USING "btree" ("original_article_id");



CREATE INDEX "translation_requests_requester_id_idx" ON "public"."translation_requests" USING "btree" ("requester_id");



CREATE UNIQUE INDEX "uq_article_translations_article_lang" ON "public"."article_translations" USING "btree" ("article_id", "language_code");



CREATE INDEX "user_follows_follower_id_created_at_idx" ON "public"."user_follows" USING "btree" ("follower_id", "created_at" DESC);



CREATE INDEX "user_follows_following_id_created_at_idx" ON "public"."user_follows" USING "btree" ("following_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "trg_dictionary_entries_updated_at" BEFORE UPDATE ON "public"."dictionary_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_dictionary_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dictionary_saves_count" AFTER INSERT OR DELETE ON "public"."dictionary_saves" FOR EACH ROW EXECUTE FUNCTION "public"."sync_dictionary_saves"();



CREATE OR REPLACE TRIGGER "trg_profiles_guard_privileged" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."guard_profile_privileged_columns"();



CREATE OR REPLACE TRIGGER "trg_project_comments_updated_at" BEFORE UPDATE ON "public"."project_comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_project_likes_count" AFTER INSERT OR DELETE ON "public"."project_likes" FOR EACH ROW EXECUTE FUNCTION "public"."sync_project_likes"();



CREATE OR REPLACE TRIGGER "trg_projects_guard_owner" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."guard_project_owner"();



CREATE OR REPLACE TRIGGER "trg_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at_discussions" BEFORE UPDATE ON "public"."discussions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_translation_request_updated" BEFORE UPDATE ON "public"."translation_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_translation_request_timestamp"();



CREATE OR REPLACE TRIGGER "trg_translation_requests_updated_at" BEFORE UPDATE ON "public"."translation_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "article_author" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_comments"
    ADD CONSTRAINT "article_has_comments" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_translations"
    ADD CONSTRAINT "article_has_translations" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_reactions"
    ADD CONSTRAINT "article_reactions_article" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_reactions"
    ADD CONSTRAINT "article_reactions_user" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_tags"
    ADD CONSTRAINT "article_tag_article" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_tags"
    ADD CONSTRAINT "article_tag_tag" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_translation_sources"
    ADD CONSTRAINT "article_translation_sources_source_article_id_fkey" FOREIGN KEY ("source_article_id") REFERENCES "public"."articles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."article_translation_sources"
    ADD CONSTRAINT "article_translation_sources_translation_article_id_fkey" FOREIGN KEY ("translation_article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_translation_sources"
    ADD CONSTRAINT "article_translation_sources_translation_request_id_fkey" FOREIGN KEY ("translation_request_id") REFERENCES "public"."translation_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookmarked_articles"
    ADD CONSTRAINT "bookmark_article" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarked_articles"
    ADD CONSTRAINT "bookmark_user" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_comments"
    ADD CONSTRAINT "comment_author" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_comments"
    ADD CONSTRAINT "comment_replies" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."article_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_entries"
    ADD CONSTRAINT "dictionary_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dictionary_entries"
    ADD CONSTRAINT "dictionary_entries_current_revision_fkey" FOREIGN KEY ("current_revision_id") REFERENCES "public"."dictionary_revisions"("id");



ALTER TABLE ONLY "public"."dictionary_entry_tags"
    ADD CONSTRAINT "dictionary_entry_tags_entry_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_entry_tags"
    ADD CONSTRAINT "dictionary_entry_tags_tag_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_examples"
    ADD CONSTRAINT "dictionary_examples_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dictionary_examples"
    ADD CONSTRAINT "dictionary_examples_entry_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_moderation_actions"
    ADD CONSTRAINT "dictionary_mod_entry_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_moderation_actions"
    ADD CONSTRAINT "dictionary_mod_moderator_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dictionary_moderation_actions"
    ADD CONSTRAINT "dictionary_mod_revision_fkey" FOREIGN KEY ("revision_id") REFERENCES "public"."dictionary_revisions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_revisions"
    ADD CONSTRAINT "dictionary_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dictionary_revisions"
    ADD CONSTRAINT "dictionary_revisions_entry_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_saves"
    ADD CONSTRAINT "dictionary_saves_entry_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dictionary_saves"
    ADD CONSTRAINT "dictionary_saves_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dictionary_translations"
    ADD CONSTRAINT "dictionary_translations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dictionary_translations"
    ADD CONSTRAINT "dictionary_translations_entry_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_bookmarks"
    ADD CONSTRAINT "discussion_bookmarks_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_bookmarks"
    ADD CONSTRAINT "discussion_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."discussion_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_tags"
    ADD CONSTRAINT "discussion_tags_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_tags"
    ADD CONSTRAINT "discussion_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_votes"
    ADD CONSTRAINT "discussion_votes_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_votes"
    ADD CONSTRAINT "discussion_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."language_skills"
    ADD CONSTRAINT "language_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_options"
    ADD CONSTRAINT "poll_options_poll_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_opt_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id");



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_poll_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poll_votes"
    ADD CONSTRAINT "poll_votes_user_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."polls"
    ADD CONSTRAINT "polls_author_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_parent_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."project_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_tags"
    ADD CONSTRAINT "project_tags_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_tags"
    ADD CONSTRAINT "project_tags_tag_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."tag_similarities"
    ADD CONSTRAINT "tag_similarities_tag_a_fkey" FOREIGN KEY ("tag_a_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_similarities"
    ADD CONSTRAINT "tag_similarities_tag_b_fkey" FOREIGN KEY ("tag_b_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."translation_requests"
    ADD CONSTRAINT "translation_requests_original_article_id_fkey" FOREIGN KEY ("original_article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."translation_requests"
    ADD CONSTRAINT "translation_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_fk" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can read profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Anyone can view translation sources" ON "public"."article_translation_sources" FOR SELECT USING (true);



CREATE POLICY "Auth users change vote" ON "public"."poll_votes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Auth users create poll_options" ON "public"."poll_options" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."polls" "p"
  WHERE (("p"."id" = "poll_options"."poll_id") AND ("p"."author_id" = "auth"."uid"())))));



CREATE POLICY "Auth users create polls" ON "public"."polls" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Auth users remove vote" ON "public"."poll_votes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Auth users vote" ON "public"."poll_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Author deletes poll" ON "public"."polls" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can manage their translation sources" ON "public"."article_translation_sources" USING ((EXISTS ( SELECT 1
   FROM "public"."articles"
  WHERE (("articles"."id" = "article_translation_sources"."translation_article_id") AND ("articles"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can respond to requests" ON "public"."translation_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."articles"
  WHERE (("articles"."id" = "translation_requests"."original_article_id") AND ("articles"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can view requests for their articles" ON "public"."translation_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."articles"
  WHERE (("articles"."id" = "translation_requests"."original_article_id") AND ("articles"."author_id" = "auth"."uid"())))));



CREATE POLICY "Follows are viewable by everyone" ON "public"."user_follows" FOR SELECT USING (true);



CREATE POLICY "Language skills are viewable by everyone" ON "public"."language_skills" FOR SELECT USING (true);



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public read poll_options" ON "public"."poll_options" FOR SELECT USING (true);



CREATE POLICY "Public read poll_votes" ON "public"."poll_votes" FOR SELECT USING (true);



CREATE POLICY "Public read polls" ON "public"."polls" FOR SELECT USING (true);



CREATE POLICY "Requesters can cancel pending requests" ON "public"."translation_requests" FOR DELETE USING ((("requester_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "Requesters can view their requests" ON "public"."translation_requests" FOR SELECT USING (("requester_id" = "auth"."uid"()));



CREATE POLICY "Users can create translation requests" ON "public"."translation_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "requester_id"));



CREATE POLICY "Users can delete own language skills" ON "public"."language_skills" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can follow others" ON "public"."user_follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can insert own language skills" ON "public"."language_skills" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can unfollow" ON "public"."user_follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can update own language skills" ON "public"."language_skills" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."article_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."article_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."article_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "article_tags_delete_own_article" ON "public"."article_tags" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_tags"."article_id") AND ("a"."author_id" = "auth"."uid"())))));



CREATE POLICY "article_tags_insert_own_article" ON "public"."article_tags" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_tags"."article_id") AND ("a"."author_id" = "auth"."uid"())))));



CREATE POLICY "article_tags_select_own" ON "public"."article_tags" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_tags"."article_id") AND ("a"."author_id" = "auth"."uid"())))));



CREATE POLICY "article_tags_select_published" ON "public"."article_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_tags"."article_id") AND ("a"."status" = 'published'::"public"."article_status")))));



ALTER TABLE "public"."article_translation_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."article_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "articles_delete_own" ON "public"."articles" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "articles_insert_own" ON "public"."articles" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "articles_select_own" ON "public"."articles" FOR SELECT TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "articles_select_published" ON "public"."articles" FOR SELECT USING (("status" = 'published'::"public"."article_status"));



CREATE POLICY "articles_update_own" ON "public"."articles" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



ALTER TABLE "public"."bookmarked_articles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookmarks_delete_own" ON "public"."bookmarked_articles" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "bookmarks_insert_own" ON "public"."bookmarked_articles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "bookmarks_select_own" ON "public"."bookmarked_articles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "comments_admin_delete" ON "public"."project_comments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_type")))));



CREATE POLICY "comments_delete_own" ON "public"."article_comments" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "comments_insert" ON "public"."project_comments" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."rls_project_is_public"("project_id")));



CREATE POLICY "comments_insert_on_published" ON "public"."article_comments" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_comments"."article_id") AND ("a"."status" = 'published'::"public"."article_status"))))));



CREATE POLICY "comments_member_read" ON "public"."project_comments" FOR SELECT TO "authenticated" USING ((("public"."rls_project_owner"("project_id") = "auth"."uid"()) OR "public"."rls_is_project_member"("project_id", "auth"."uid"())));



CREATE POLICY "comments_own_delete" ON "public"."project_comments" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "comments_own_update" ON "public"."project_comments" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "comments_public_read" ON "public"."project_comments" FOR SELECT USING ("public"."rls_project_is_public"("project_id"));



CREATE POLICY "comments_select_published" ON "public"."article_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_comments"."article_id") AND ("a"."status" = 'published'::"public"."article_status")))));



CREATE POLICY "comments_update_own" ON "public"."article_comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "dict_entries_delete_own_draft" ON "public"."dictionary_entries" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ("status" = 'draft'::"public"."dictionary_status")));



CREATE POLICY "dict_entries_insert" ON "public"."dictionary_entries" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "dict_entries_select_approved" ON "public"."dictionary_entries" FOR SELECT USING (("status" = 'approved'::"public"."dictionary_status"));



CREATE POLICY "dict_entries_select_moderator" ON "public"."dictionary_entries" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"]))))));



CREATE POLICY "dict_entries_select_own" ON "public"."dictionary_entries" FOR SELECT TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "dict_entries_update_moderator" ON "public"."dictionary_entries" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"]))))));



CREATE POLICY "dict_entries_update_own_draft" ON "public"."dictionary_entries" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ("status" = 'draft'::"public"."dictionary_status"))) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "dict_entry_tags_delete" ON "public"."dictionary_entry_tags" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."dictionary_entries" "e"
  WHERE (("e"."id" = "dictionary_entry_tags"."entry_id") AND ("e"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"])))))));



CREATE POLICY "dict_entry_tags_insert" ON "public"."dictionary_entry_tags" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."dictionary_entries" "e"
  WHERE (("e"."id" = "dictionary_entry_tags"."entry_id") AND ("e"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"])))))));



CREATE POLICY "dict_entry_tags_select" ON "public"."dictionary_entry_tags" FOR SELECT USING (true);



CREATE POLICY "dict_examples_insert" ON "public"."dictionary_examples" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "dict_examples_select" ON "public"."dictionary_examples" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dictionary_entries" "e"
  WHERE (("e"."id" = "dictionary_examples"."entry_id") AND (("e"."status" = 'approved'::"public"."dictionary_status") OR ("e"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"]))))))))));



CREATE POLICY "dict_examples_update" ON "public"."dictionary_examples" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "dict_mod_actions_insert" ON "public"."dictionary_moderation_actions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"]))))));



CREATE POLICY "dict_mod_actions_select" ON "public"."dictionary_moderation_actions" FOR SELECT TO "authenticated" USING ((("moderator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."dictionary_entries" "e"
  WHERE (("e"."id" = "dictionary_moderation_actions"."entry_id") AND ("e"."created_by" = "auth"."uid"()))))));



CREATE POLICY "dict_revisions_insert" ON "public"."dictionary_revisions" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "dict_revisions_select" ON "public"."dictionary_revisions" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR ("status" = 'approved'::"public"."dictionary_status") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"])))))));



CREATE POLICY "dict_revisions_update_moderator" ON "public"."dictionary_revisions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"]))))));



CREATE POLICY "dict_saves_delete" ON "public"."dictionary_saves" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "dict_saves_insert" ON "public"."dictionary_saves" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "dict_saves_select" ON "public"."dictionary_saves" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "dict_translations_insert" ON "public"."dictionary_translations" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "dict_translations_select" ON "public"."dictionary_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dictionary_entries" "e"
  WHERE (("e"."id" = "dictionary_translations"."entry_id") AND (("e"."status" = 'approved'::"public"."dictionary_status") OR ("e"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['teacher'::"public"."user_type", 'admin'::"public"."user_type"]))))))))));



CREATE POLICY "dict_translations_update" ON "public"."dictionary_translations" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."dictionary_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionary_entry_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionary_examples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionary_moderation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionary_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionary_saves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionary_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion_bookmarks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discussion_bookmarks_delete" ON "public"."discussion_bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "discussion_bookmarks_insert" ON "public"."discussion_bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "discussion_bookmarks_select" ON "public"."discussion_bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."discussion_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discussion_comments_delete" ON "public"."discussion_comments" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "discussion_comments_insert" ON "public"."discussion_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "discussion_comments_select" ON "public"."discussion_comments" FOR SELECT USING (true);



CREATE POLICY "discussion_comments_update" ON "public"."discussion_comments" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."discussion_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discussion_tags_delete" ON "public"."discussion_tags" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."discussions" "d"
  WHERE (("d"."id" = "discussion_tags"."discussion_id") AND ("d"."author_id" = "auth"."uid"()))))));



CREATE POLICY "discussion_tags_insert" ON "public"."discussion_tags" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."discussions" "d"
  WHERE (("d"."id" = "discussion_tags"."discussion_id") AND ("d"."author_id" = "auth"."uid"()))))));



CREATE POLICY "discussion_tags_select" ON "public"."discussion_tags" FOR SELECT USING (true);



ALTER TABLE "public"."discussion_votes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discussion_votes_delete" ON "public"."discussion_votes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "discussion_votes_insert" ON "public"."discussion_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "discussion_votes_select" ON "public"."discussion_votes" FOR SELECT USING (true);



CREATE POLICY "discussion_votes_update" ON "public"."discussion_votes" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."discussions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discussions_delete" ON "public"."discussions" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "discussions_insert" ON "public"."discussions" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "discussions_select" ON "public"."discussions" FOR SELECT USING (true);



CREATE POLICY "discussions_update" ON "public"."discussions" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "files_manage" ON "public"."project_files" TO "authenticated" USING ((("public"."rls_project_owner"("project_id") = "auth"."uid"()) OR "public"."rls_is_project_contributor"("project_id", "auth"."uid"())));



CREATE POLICY "files_member_read" ON "public"."project_files" FOR SELECT TO "authenticated" USING ((("public"."rls_project_owner"("project_id") = "auth"."uid"()) OR "public"."rls_is_project_member"("project_id", "auth"."uid"())));



CREATE POLICY "files_public_read" ON "public"."project_files" FOR SELECT USING ("public"."rls_project_is_public"("project_id"));



ALTER TABLE "public"."language_skills" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "likes_insert" ON "public"."project_likes" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."rls_project_is_public"("project_id")));



CREATE POLICY "likes_own_delete" ON "public"."project_likes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "likes_public_read" ON "public"."project_likes" FOR SELECT USING ("public"."rls_project_is_public"("project_id"));



CREATE POLICY "members_owner_manage" ON "public"."project_members" TO "authenticated" USING (("public"."rls_project_owner"("project_id") = "auth"."uid"()));



CREATE POLICY "members_read" ON "public"."project_members" FOR SELECT USING (("public"."rls_project_is_public"("project_id") OR ("public"."rls_project_owner"("project_id") = "auth"."uid"()) OR "public"."rls_is_project_member"("project_id", "auth"."uid"())));



ALTER TABLE "public"."poll_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."poll_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."polls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_admin_delete" ON "public"."projects" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_type")))));



CREATE POLICY "projects_contributor_update" ON "public"."projects" FOR UPDATE TO "authenticated" USING ("public"."rls_is_project_contributor"("id", "auth"."uid"()));



CREATE POLICY "projects_insert" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "projects_member_read" ON "public"."projects" FOR SELECT TO "authenticated" USING ("public"."rls_is_project_member"("id", "auth"."uid"()));



CREATE POLICY "projects_owner_delete" ON "public"."projects" FOR DELETE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "projects_owner_read" ON "public"."projects" FOR SELECT TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "projects_owner_update" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "projects_public_read" ON "public"."projects" FOR SELECT USING (("is_public" = true));



CREATE POLICY "reactions_delete_own" ON "public"."article_reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "reactions_insert_own" ON "public"."article_reactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "reactions_select_published" ON "public"."article_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_reactions"."article_id") AND ("a"."status" = 'published'::"public"."article_status")))));



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_insert_authenticated" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "tags_member_read" ON "public"."project_tags" FOR SELECT TO "authenticated" USING ((("public"."rls_project_owner"("project_id") = "auth"."uid"()) OR "public"."rls_is_project_member"("project_id", "auth"."uid"())));



CREATE POLICY "tags_owner_manage" ON "public"."project_tags" TO "authenticated" USING (("public"."rls_project_owner"("project_id") = "auth"."uid"()));



CREATE POLICY "tags_public_read" ON "public"."project_tags" FOR SELECT USING ("public"."rls_project_is_public"("project_id"));



CREATE POLICY "tags_select_all" ON "public"."tags" FOR SELECT USING (true);



ALTER TABLE "public"."translation_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "translations_delete_own_article" ON "public"."article_translations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_translations"."article_id") AND ("a"."author_id" = "auth"."uid"())))));



CREATE POLICY "translations_insert_own_article" ON "public"."article_translations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_translations"."article_id") AND ("a"."author_id" = "auth"."uid"())))));



CREATE POLICY "translations_select_own" ON "public"."article_translations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_translations"."article_id") AND ("a"."author_id" = "auth"."uid"())))));



CREATE POLICY "translations_select_published" ON "public"."article_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_translations"."article_id") AND ("a"."status" = 'published'::"public"."article_status")))));



CREATE POLICY "translations_update_own_article" ON "public"."article_translations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_translations"."article_id") AND ("a"."author_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."articles" "a"
  WHERE (("a"."id" = "article_translations"."article_id") AND ("a"."author_id" = "auth"."uid"())))));



ALTER TABLE "public"."user_follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_follows_delete_self" ON "public"."user_follows" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "user_follows_insert_self" ON "public"."user_follows" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "user_follows_select_all" ON "public"."user_follows" FOR SELECT USING (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_dictionary_duplicates"("search_term" "text", "lang_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_dictionary_duplicates"("search_term" "text", "lang_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_dictionary_duplicates"("search_term" "text", "lang_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_profile_privileged_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_profile_privileged_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_profile_privileged_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_project_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_project_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_project_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_article_view"("p_article_id" bigint, "p_language_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_article_view"("p_article_id" bigint, "p_language_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_article_view"("p_article_id" bigint, "p_language_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_article_view"("p_article_id" bigint, "p_language_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_dictionary_view"("p_entry_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_dictionary_view"("p_entry_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_dictionary_view"("p_entry_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_dictionary_view"("p_entry_id" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_project_view"("p_project_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_project_view"("p_project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_project_view"("p_project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_project_view"("p_project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."projects_search_vector_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."projects_search_vector_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."projects_search_vector_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalc_project_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_project_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_project_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_is_project_contributor"("p_project_id" bigint, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rls_is_project_contributor"("p_project_id" bigint, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_is_project_contributor"("p_project_id" bigint, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_is_project_member"("p_project_id" bigint, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rls_is_project_member"("p_project_id" bigint, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_is_project_member"("p_project_id" bigint, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_project_is_public"("p_project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."rls_project_is_public"("p_project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_project_is_public"("p_project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_project_owner"("p_project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."rls_project_owner"("p_project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_project_owner"("p_project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_dictionary"("search_query" "text", "lang_filter" "text", "result_limit" integer, "result_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_dictionary"("search_query" "text", "lang_filter" "text", "result_limit" integer, "result_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_dictionary"("search_query" "text", "lang_filter" "text", "result_limit" integer, "result_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_projects"("search_term" "text", "filter_status" "public"."project_status", "filter_difficulty" "public"."project_difficulty", "filter_type" "public"."project_category", "filter_category" "text", "sort_by" "text", "page_limit" integer, "page_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_projects"("search_term" "text", "filter_status" "public"."project_status", "filter_difficulty" "public"."project_difficulty", "filter_type" "public"."project_category", "filter_category" "text", "sort_by" "text", "page_limit" integer, "page_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_projects"("search_term" "text", "filter_status" "public"."project_status", "filter_difficulty" "public"."project_difficulty", "filter_type" "public"."project_category", "filter_category" "text", "sort_by" "text", "page_limit" integer, "page_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."suggest_dictionary_terms"("partial_term" "text", "result_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."suggest_dictionary_terms"("partial_term" "text", "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."suggest_dictionary_terms"("partial_term" "text", "result_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_dictionary_saves"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_dictionary_saves"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_dictionary_saves"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_project_likes"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_project_likes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_project_likes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_dictionary_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_dictionary_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_dictionary_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_translation_request_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_translation_request_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_translation_request_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."article_comments" TO "anon";
GRANT ALL ON TABLE "public"."article_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."article_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."article_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."article_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."article_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."article_reactions" TO "anon";
GRANT ALL ON TABLE "public"."article_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."article_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."article_tags" TO "anon";
GRANT ALL ON TABLE "public"."article_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."article_tags" TO "service_role";



GRANT ALL ON TABLE "public"."article_translation_sources" TO "anon";
GRANT ALL ON TABLE "public"."article_translation_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."article_translation_sources" TO "service_role";



GRANT ALL ON TABLE "public"."article_translations" TO "anon";
GRANT ALL ON TABLE "public"."article_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."article_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."article_translations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."article_translations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."article_translations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."articles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."articles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."articles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bookmarked_articles" TO "anon";
GRANT ALL ON TABLE "public"."bookmarked_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarked_articles" TO "service_role";



GRANT ALL ON TABLE "public"."dictionary_entries" TO "anon";
GRANT ALL ON TABLE "public"."dictionary_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_entries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dictionary_entries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dictionary_entries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dictionary_entries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dictionary_entry_tags" TO "anon";
GRANT ALL ON TABLE "public"."dictionary_entry_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_entry_tags" TO "service_role";



GRANT ALL ON TABLE "public"."dictionary_examples" TO "anon";
GRANT ALL ON TABLE "public"."dictionary_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_examples" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dictionary_examples_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dictionary_examples_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dictionary_examples_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dictionary_moderation_actions" TO "anon";
GRANT ALL ON TABLE "public"."dictionary_moderation_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_moderation_actions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dictionary_moderation_actions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dictionary_moderation_actions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dictionary_moderation_actions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dictionary_revisions" TO "anon";
GRANT ALL ON TABLE "public"."dictionary_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_revisions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dictionary_revisions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dictionary_revisions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dictionary_revisions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dictionary_saves" TO "anon";
GRANT ALL ON TABLE "public"."dictionary_saves" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_saves" TO "service_role";



GRANT ALL ON TABLE "public"."dictionary_translations" TO "anon";
GRANT ALL ON TABLE "public"."dictionary_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_translations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dictionary_translations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dictionary_translations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dictionary_translations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."discussion_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_comments" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_tags" TO "anon";
GRANT ALL ON TABLE "public"."discussion_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_tags" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_votes" TO "anon";
GRANT ALL ON TABLE "public"."discussion_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_votes" TO "service_role";



GRANT ALL ON TABLE "public"."discussions" TO "anon";
GRANT ALL ON TABLE "public"."discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."discussions" TO "service_role";



GRANT ALL ON TABLE "public"."language_skills" TO "anon";
GRANT ALL ON TABLE "public"."language_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."language_skills" TO "service_role";



GRANT ALL ON SEQUENCE "public"."language_skills_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."language_skills_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."language_skills_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."poll_options" TO "anon";
GRANT ALL ON TABLE "public"."poll_options" TO "authenticated";
GRANT ALL ON TABLE "public"."poll_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."poll_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."poll_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."poll_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."polls" TO "anon";
GRANT ALL ON TABLE "public"."polls" TO "authenticated";
GRANT ALL ON TABLE "public"."polls" TO "service_role";



GRANT ALL ON SEQUENCE "public"."polls_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."polls_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."polls_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_comments" TO "anon";
GRANT ALL ON TABLE "public"."project_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_files" TO "anon";
GRANT ALL ON TABLE "public"."project_files" TO "authenticated";
GRANT ALL ON TABLE "public"."project_files" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_files_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_files_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_files_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_likes" TO "anon";
GRANT ALL ON TABLE "public"."project_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_likes" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."project_tags" TO "anon";
GRANT ALL ON TABLE "public"."project_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."project_tags" TO "service_role";



GRANT ALL ON TABLE "public"."project_updates" TO "anon";
GRANT ALL ON TABLE "public"."project_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_updates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_updates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_updates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_updates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tag_similarities" TO "anon";
GRANT ALL ON TABLE "public"."tag_similarities" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_similarities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tag_similarities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tag_similarities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tag_similarities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."translation_requests" TO "anon";
GRANT ALL ON TABLE "public"."translation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."translation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






