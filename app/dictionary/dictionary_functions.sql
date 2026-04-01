-- ============================================================================
-- DICTIONARY MODULE — Supabase RPC Functions
-- Run this AFTER dictionary_schema.sql
-- ============================================================================

-- 1. Full-text + trigram search function
CREATE OR REPLACE FUNCTION search_dictionary(
  search_query text,
  lang_filter text DEFAULT NULL,
  result_limit int DEFAULT 20,
  result_offset int DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  term text,
  slug text,
  reading text,
  language_code text,
  definition text,
  status dictionary_status,
  views bigint,
  saves bigint,
  ft_rank real,
  trgm_rank real,
  combined_rank real
)
LANGUAGE sql STABLE
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

-- 2. Trigram autocomplete suggestions
CREATE OR REPLACE FUNCTION suggest_dictionary_terms(
  partial_term text,
  result_limit int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  term text,
  slug text,
  language_code text,
  similarity_score real
)
LANGUAGE sql STABLE
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

-- 3. Duplicate detection function
CREATE OR REPLACE FUNCTION check_dictionary_duplicates(
  search_term text,
  lang_code text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  term text,
  slug text,
  language_code text,
  status dictionary_status,
  similarity_score real
)
LANGUAGE sql STABLE
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
