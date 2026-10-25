-- Full-text search in any enabled translation, so search matches what the
-- reader shows. search_kjv_verses stays until the code calling it is
-- replaced in production; a follow-up migration drops it.

create or replace function public.search_verses(
  search_query text,
  search_translation text default 'kjv',
  result_limit integer default 20
)
returns table (
  book_slug text,
  book_name text,
  book_order smallint,
  chapter_number smallint,
  verse_number smallint,
  translation_slug text,
  translation_abbreviation text,
  verse_text text,
  rank real
)
language sql
stable
set search_path = public
as $$
  with query_input as (
    select websearch_to_tsquery('english', btrim(search_query)) as query
    where btrim(coalesce(search_query, '')) <> ''
  )
  select
    b.slug as book_slug,
    b.name as book_name,
    b.book_order,
    v.chapter_number,
    v.verse_number,
    tr.slug as translation_slug,
    tr.abbreviation as translation_abbreviation,
    v.verse_text,
    ts_rank_cd(v.search_vector, query_input.query) as rank
  from query_input
  -- Disabled translations never match, even when called directly.
  join public.translations tr on tr.slug = search_translation and tr.is_enabled = true
  join public.verses v on v.translation_id = tr.id
  join public.books b on b.id = v.book_id
  where v.search_vector @@ query_input.query
  order by rank desc, b.book_order, v.chapter_number, v.verse_number
  limit least(greatest(coalesce(result_limit, 20), 1), 50);
$$;

grant execute on function public.search_verses(text, text, integer) to anon, authenticated;

comment on function public.search_verses(text, text, integer) is 'Full-text verse search in one enabled translation.';
