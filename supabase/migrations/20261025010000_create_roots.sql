-- Roots: where Christian traditions came from. A public, read-only catalog
-- (traditions → rated popular claims, a dated timeline, related passages
-- and sources), generated from data/roots/traditions.json by
-- scripts/generate-roots-seed.mjs and maintained by migrations.

create table public.traditions (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  -- One or two sentences for cards.
  summary text not null,
  -- Documented history, paragraphs separated by blank lines. Prose may
  -- cite the tradition's sources inline as [n] (1-based position).
  origin text not null,
  -- What the sources show for AD 30–100.
  early_church text not null,
  sort_order smallint not null,
  -- When the content was last checked against the sources; set by the
  -- generator, so there's deliberately no default.
  reviewed_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint traditions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint traditions_name_present check (name ~ '\S' and char_length(name) <= 80),
  constraint traditions_summary_present check (summary ~ '\S' and char_length(summary) <= 300),
  constraint traditions_origin_present check (origin ~ '\S' and char_length(origin) <= 8000),
  constraint traditions_early_church_present check (early_church ~ '\S' and char_length(early_church) <= 3000)
);

-- A popular claim about the tradition and how well the evidence supports
-- it. Unlike archaeology's scale, claims can be contradicted by evidence.
create table public.tradition_claims (
  tradition_id bigint not null references public.traditions(id) on delete cascade,
  position smallint not null,
  claim text not null,
  rating text not null,
  explanation text not null,

  primary key (tradition_id, position),
  constraint tradition_claims_claim_present check (claim ~ '\S' and char_length(claim) <= 200),
  constraint tradition_claims_rating_valid check (
    rating in ('established', 'supported', 'debated', 'unverified', 'contradicted')
  ),
  constraint tradition_claims_explanation_present check (
    explanation ~ '\S' and char_length(explanation) <= 1200
  )
);

-- Dated events. `year` sorts (negative = BC); `label` is what readers see.
create table public.tradition_timeline (
  tradition_id bigint not null references public.traditions(id) on delete cascade,
  position smallint not null,
  year integer not null,
  label text not null,
  event text not null,

  primary key (tradition_id, position),
  constraint tradition_timeline_label_present check (label ~ '\S' and char_length(label) <= 60),
  constraint tradition_timeline_event_present check (event ~ '\S' and char_length(event) <= 300)
);

-- A passage that bears on the tradition, with what it says.
create table public.tradition_scripture_refs (
  tradition_id bigint not null references public.traditions(id) on delete cascade,
  position smallint not null,
  book_id bigint not null references public.books(id) on delete restrict,
  chapter_start smallint not null,
  verse_start smallint not null,
  chapter_end smallint not null,
  verse_end smallint not null,
  note text not null,

  primary key (tradition_id, position),
  constraint tradition_scripture_refs_range check (
    chapter_start > 0 and verse_start > 0 and verse_end > 0
    and (chapter_end > chapter_start
      or (chapter_end = chapter_start and verse_end >= verse_start))
  ),
  constraint tradition_scripture_refs_note_present check (note ~ '\S' and char_length(note) <= 300)
);

create table public.tradition_sources (
  tradition_id bigint not null references public.traditions(id) on delete cascade,
  position smallint not null,
  citation text not null,
  url text,

  primary key (tradition_id, position),
  constraint tradition_sources_citation_present check (citation ~ '\S' and char_length(citation) <= 600),
  constraint tradition_sources_url_https check (url ~ '^https://[^\s]+$')
);

alter table public.traditions enable row level security;
alter table public.tradition_claims enable row level security;
alter table public.tradition_timeline enable row level security;
alter table public.tradition_scripture_refs enable row level security;
alter table public.tradition_sources enable row level security;

grant select on public.traditions, public.tradition_claims, public.tradition_timeline,
  public.tradition_scripture_refs, public.tradition_sources to anon, authenticated;
grant all on public.traditions, public.tradition_claims, public.tradition_timeline,
  public.tradition_scripture_refs, public.tradition_sources to service_role;
-- Read-only to clients. RLS already blocks writes; revoking them too means
-- a policy mistake can't open them, and covers TRUNCATE, which RLS doesn't.
revoke insert, update, delete, truncate, references, trigger
  on public.traditions, public.tradition_claims, public.tradition_timeline,
     public.tradition_scripture_refs, public.tradition_sources
  from anon, authenticated;

create policy "Anyone can read traditions"
on public.traditions for select to anon, authenticated using (true);
create policy "Anyone can read tradition claims"
on public.tradition_claims for select to anon, authenticated using (true);
create policy "Anyone can read tradition timelines"
on public.tradition_timeline for select to anon, authenticated using (true);
create policy "Anyone can read tradition scripture refs"
on public.tradition_scripture_refs for select to anon, authenticated using (true);
create policy "Anyone can read tradition sources"
on public.tradition_sources for select to anon, authenticated using (true);

create trigger set_traditions_updated_at
before update on public.traditions
for each row execute function public.set_updated_at();

comment on table public.traditions is 'Origins of Christian traditions with rated popular claims (Dawnscroll content).';
