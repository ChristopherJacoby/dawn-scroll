-- Archaeological findings: a public, read-only catalog (findings → the
-- passages they bear on, their sources, and a dated timeline). Content is
-- generated from data/archaeology/findings.json and maintained by
-- migrations.

create table public.findings (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  -- Two sentences for cards and the in-reader trigger.
  summary text not null,
  -- Paragraphs separated by blank lines.
  description text not null,
  site_name text not null,
  location_lat numeric(7, 4) not null,
  location_lng numeric(7, 4) not null,
  credibility_rating text not null,
  -- Why the finding has its rating.
  credibility_note text not null,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint findings_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint findings_title_present check (title ~ '\S' and char_length(title) <= 120),
  constraint findings_summary_present check (summary ~ '\S' and char_length(summary) <= 400),
  constraint findings_description_present check (description ~ '\S' and char_length(description) <= 6000),
  constraint findings_site_name_present check (site_name ~ '\S' and char_length(site_name) <= 120),
  constraint findings_credibility_note_present check (
    credibility_note ~ '\S' and char_length(credibility_note) <= 1000
  ),
  constraint findings_location_lat_range check (location_lat between -90 and 90),
  constraint findings_location_lng_range check (location_lng between -180 and 180),
  constraint findings_credibility_rating_valid check (
    credibility_rating in ('established', 'supported', 'debated', 'unverified')
  )
);

-- A passage the finding bears on: a verse range, possibly across chapters.
create table public.finding_scripture_refs (
  finding_id bigint not null references public.findings(id) on delete cascade,
  position smallint not null,
  book_id bigint not null references public.books(id) on delete restrict,
  chapter_start smallint not null,
  verse_start smallint not null,
  chapter_end smallint not null,
  verse_end smallint not null,

  primary key (finding_id, position),
  constraint finding_scripture_refs_range check (
    chapter_start > 0 and verse_start > 0 and verse_end > 0
    and (chapter_end > chapter_start
      or (chapter_end = chapter_start and verse_end >= verse_start))
  )
);

-- By-passage lookups: which findings touch this chapter of this book?
create index finding_scripture_refs_book_idx
  on public.finding_scripture_refs (book_id, chapter_start, chapter_end);

create table public.finding_sources (
  finding_id bigint not null references public.findings(id) on delete cascade,
  position smallint not null,
  citation text not null,
  url text,

  primary key (finding_id, position),
  constraint finding_sources_citation_present check (citation ~ '\S' and char_length(citation) <= 600),
  constraint finding_sources_url_https check (url ~ '^https://[^\s]+$')
);

-- Dated events. `year` sorts (negative = BC); `label` is what readers see,
-- e.g. "c. 840 BC" or "1930–1936".
create table public.finding_timeline (
  finding_id bigint not null references public.findings(id) on delete cascade,
  position smallint not null,
  year integer not null,
  label text not null,
  event text not null,

  primary key (finding_id, position),
  constraint finding_timeline_label_present check (label ~ '\S' and char_length(label) <= 60),
  constraint finding_timeline_event_present check (event ~ '\S' and char_length(event) <= 300)
);

alter table public.findings enable row level security;
alter table public.finding_scripture_refs enable row level security;
alter table public.finding_sources enable row level security;
alter table public.finding_timeline enable row level security;

grant select on public.findings, public.finding_scripture_refs,
  public.finding_sources, public.finding_timeline to anon, authenticated;
grant all on public.findings, public.finding_scripture_refs,
  public.finding_sources, public.finding_timeline to service_role;

create policy "Anyone can read findings"
on public.findings for select to anon, authenticated using (true);
create policy "Anyone can read finding scripture refs"
on public.finding_scripture_refs for select to anon, authenticated using (true);
create policy "Anyone can read finding sources"
on public.finding_sources for select to anon, authenticated using (true);
create policy "Anyone can read finding timelines"
on public.finding_timeline for select to anon, authenticated using (true);

comment on table public.findings is 'Archaeological findings with honest credibility ratings (Dawnscroll content).';
