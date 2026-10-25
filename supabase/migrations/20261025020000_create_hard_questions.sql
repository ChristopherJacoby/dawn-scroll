-- Hard Questions: arguments from design and cosmology, each with the case
-- as its proponents make it, the main critiques, where the debate stands,
-- rated claims, short quotes and sources. A public, read-only catalog
-- generated from data/questions/questions.json by
-- scripts/generate-questions-seed.mjs and maintained by migrations.

create table public.questions (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  category text not null,
  -- One or two sentences for cards.
  summary text not null,
  -- Paragraphs separated by blank lines; may cite sources inline as [n].
  argument text not null,
  critiques text not null,
  standing text not null,
  sort_order smallint not null,
  -- Set by the generator, so there's deliberately no default.
  reviewed_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint questions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint questions_title_present check (title ~ '\S' and char_length(title) <= 120),
  constraint questions_category_valid check (category in ('life', 'universe')),
  constraint questions_summary_present check (summary ~ '\S' and char_length(summary) <= 300),
  constraint questions_argument_present check (argument ~ '\S' and char_length(argument) <= 6000),
  constraint questions_critiques_present check (critiques ~ '\S' and char_length(critiques) <= 6000),
  constraint questions_standing_present check (standing ~ '\S' and char_length(standing) <= 3000)
);

-- Same five-level scale as tradition_claims, worded for science
-- (src/lib/questions/ratings.ts).
create table public.question_claims (
  question_id bigint not null references public.questions(id) on delete cascade,
  position smallint not null,
  claim text not null,
  rating text not null,
  explanation text not null,

  primary key (question_id, position),
  constraint question_claims_claim_present check (claim ~ '\S' and char_length(claim) <= 200),
  constraint question_claims_rating_valid check (
    rating in ('established', 'supported', 'debated', 'unverified', 'contradicted')
  ),
  constraint question_claims_explanation_present check (
    explanation ~ '\S' and char_length(explanation) <= 1200
  )
);

-- A short quote from one of the question's sources (source_position).
create table public.question_quotes (
  question_id bigint not null references public.questions(id) on delete cascade,
  position smallint not null,
  quote text not null,
  speaker text not null,
  role text not null,
  source_position smallint not null,

  primary key (question_id, position),
  constraint question_quotes_quote_present check (quote ~ '\S' and char_length(quote) <= 400),
  constraint question_quotes_speaker_present check (speaker ~ '\S' and char_length(speaker) <= 120),
  constraint question_quotes_role_present check (role ~ '\S' and char_length(role) <= 160),
  constraint question_quotes_source_positive check (source_position > 0)
);

create table public.question_sources (
  question_id bigint not null references public.questions(id) on delete cascade,
  position smallint not null,
  citation text not null,
  url text,

  primary key (question_id, position),
  constraint question_sources_citation_present check (citation ~ '\S' and char_length(citation) <= 600),
  constraint question_sources_url_https check (url ~ '^https://[^\s]+$')
);

-- Stored in both directions (the generator checks the content is symmetric).
create table public.related_questions (
  question_id bigint not null references public.questions(id) on delete cascade,
  related_question_id bigint not null references public.questions(id) on delete cascade,
  position smallint not null,

  primary key (question_id, related_question_id),
  constraint related_questions_not_self check (question_id <> related_question_id)
);

alter table public.questions enable row level security;
alter table public.question_claims enable row level security;
alter table public.question_quotes enable row level security;
alter table public.question_sources enable row level security;
alter table public.related_questions enable row level security;

grant select on public.questions, public.question_claims, public.question_quotes,
  public.question_sources, public.related_questions to anon, authenticated;
grant all on public.questions, public.question_claims, public.question_quotes,
  public.question_sources, public.related_questions to service_role;
-- Read-only to clients. RLS already blocks writes; revoking them too means
-- a policy mistake can't open them, and covers TRUNCATE, which RLS doesn't.
revoke insert, update, delete, truncate, references, trigger
  on public.questions, public.question_claims, public.question_quotes,
     public.question_sources, public.related_questions
  from anon, authenticated;

create policy "Anyone can read questions"
on public.questions for select to anon, authenticated using (true);
create policy "Anyone can read question claims"
on public.question_claims for select to anon, authenticated using (true);
create policy "Anyone can read question quotes"
on public.question_quotes for select to anon, authenticated using (true);
create policy "Anyone can read question sources"
on public.question_sources for select to anon, authenticated using (true);
create policy "Anyone can read related questions"
on public.related_questions for select to anon, authenticated using (true);

create trigger set_questions_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

comment on table public.questions is 'Hard Questions: design and cosmology arguments with critiques and rated claims (Dawnscroll content).';
