-- The Reina-Valera 1909 (DS-138), with search in Spanish. Each translation
-- names the text-search configuration it's searched with. The stored
-- search_vector stays English; a Spanish expression index serves Spanish
-- translations, so nothing is rewritten.

alter table public.translations
  add column search_config regconfig not null default 'english';

comment on column public.translations.search_config is
  'Text-search configuration for this translation''s verses (english or spanish).';

update public.translations set search_config = 'spanish' where language_code = 'es';

create index verses_search_spanish_idx
  on public.verses using gin (to_tsvector('spanish'::regconfig, verse_text));

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
    select tr.id, tr.slug, tr.abbreviation, tr.search_config,
           websearch_to_tsquery(tr.search_config, btrim(search_query)) as query
    from public.translations tr
    -- Disabled translations never match, even when called directly.
    where tr.slug = search_translation
      and tr.is_enabled = true
      and btrim(coalesce(search_query, '')) <> ''
  ),
  -- One branch per configuration, each matching the expression its index
  -- covers.
  matches as (
    select v.book_id, v.chapter_number, v.verse_number, v.verse_text,
           q.slug, q.abbreviation, ts_rank_cd(v.search_vector, q.query) as rank
    from query_input q
    join public.verses v on v.translation_id = q.id
    where q.search_config = 'english'::regconfig
      and v.search_vector @@ q.query
    union all
    select v.book_id, v.chapter_number, v.verse_number, v.verse_text,
           q.slug, q.abbreviation,
           ts_rank_cd(to_tsvector('spanish'::regconfig, v.verse_text), q.query) as rank
    from query_input q
    join public.verses v on v.translation_id = q.id
    where q.search_config = 'spanish'::regconfig
      and to_tsvector('spanish'::regconfig, v.verse_text) @@ q.query
  )
  select
    b.slug as book_slug,
    b.name as book_name,
    b.book_order,
    m.chapter_number,
    m.verse_number,
    m.slug as translation_slug,
    m.abbreviation as translation_abbreviation,
    m.verse_text,
    m.rank
  from matches m
  join public.books b on b.id = m.book_id
  order by m.rank desc, b.book_order, m.chapter_number, m.verse_number
  limit least(greatest(coalesce(result_limit, 20), 1), 50);
$$;

update public.translations set is_enabled = true where slug = 'rv1909';
