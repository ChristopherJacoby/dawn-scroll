-- Original-language layer: Strong's dictionaries, morphology code
-- expansions, the Hebrew/Greek words of each verse, and a per-verse map
-- from the reader's display tokens to those words. All public, read-only
-- reference data, loaded by scripts/import-original-language.mjs.

create table public.strongs_entries (
  number text primary key,
  language text not null,
  lemma text not null,
  transliteration text not null,
  pronunciation text,
  derivation text,
  definition text not null,
  kjv_usage text,

  constraint strongs_entries_number_format check (number ~ '^[GH][0-9]{4}$'),
  constraint strongs_entries_language_valid check (language in ('hebrew', 'greek')),
  constraint strongs_entries_language_matches check (
    (language = 'hebrew') = (number like 'H%')
  )
);

-- Robinson (Greek) and OSHB (Hebrew) codes expanded into named features,
-- e.g. N-NSM → [{name: Function, value: Noun}, {name: Case, …}, …].
create table public.morphology_codes (
  code text primary key,
  language text not null,
  features jsonb not null,

  constraint morphology_codes_language_valid check (language in ('hebrew', 'greek'))
);

-- The original-language words of a verse (KJV versification), in order.
-- Each element: {w: word as written, x: transliteration, s: Strong's,
-- m: morphology code, g: English gloss in context}.
create table public.verse_original_words (
  book_id bigint not null references public.books(id) on delete cascade,
  chapter_number smallint not null,
  verse_number smallint not null,
  words jsonb not null,

  primary key (book_id, chapter_number, verse_number),
  constraint verse_original_words_is_array check (jsonb_typeof(words) = 'array')
);

-- For one translation's verse: element i describes display token i of the
-- verse text (whitespace-split), either null (untagged) or
-- {s: Strong's, o: index into verse_original_words.words or null}.
create table public.verse_word_map (
  verse_id bigint primary key references public.verses(id) on delete cascade,
  tokens jsonb not null,

  constraint verse_word_map_is_array check (jsonb_typeof(tokens) = 'array')
);

alter table public.strongs_entries enable row level security;
alter table public.morphology_codes enable row level security;
alter table public.verse_original_words enable row level security;
alter table public.verse_word_map enable row level security;

grant select on public.strongs_entries, public.morphology_codes,
  public.verse_original_words, public.verse_word_map to anon, authenticated;
grant all on public.strongs_entries, public.morphology_codes,
  public.verse_original_words, public.verse_word_map to service_role;

create policy "Anyone can read Strong's entries"
on public.strongs_entries for select to anon, authenticated using (true);
create policy "Anyone can read morphology codes"
on public.morphology_codes for select to anon, authenticated using (true);
create policy "Anyone can read original-language words"
on public.verse_original_words for select to anon, authenticated using (true);
create policy "Anyone can read verse word maps"
on public.verse_word_map for select to anon, authenticated using (true);

comment on table public.strongs_entries is 'Strong''s Hebrew and Greek dictionaries (public domain; Hebrew via Open Scriptures, CC BY 4.0).';
comment on table public.verse_original_words is 'Hebrew/Greek words per verse from STEPBible TAHOT/TAGNT (CC BY 4.0).';
comment on table public.verse_word_map is 'Display token → Strong''s/original word, aligned from eBible KJV2006 Strong''s tagging (public domain).';
