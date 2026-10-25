-- AI foundations: a retrieval corpus for grounding chat answers, and
-- per-user daily usage with caps. Both are server-only (service role).

create extension if not exists vector with schema extensions;

-- One row per retrievable document, built from the app's own content by
-- public.refresh_ai_documents(). `embedding` is filled only once an
-- embedding provider is configured (384 dimensions, the size of the free
-- gte-small / MiniLM models); until then retrieval uses full-text search.
create table public.ai_documents (
  id bigint generated always as identity primary key,
  source_type text not null,
  source_id text not null,
  title text not null,
  -- App path to cite, e.g. /read/john/3#verse-16.
  url text,
  content text not null,
  embedding extensions.vector(384),
  search_vector tsvector generated always as (to_tsvector('english', title || ' ' || content)) stored,
  updated_at timestamptz not null default now(),

  unique (source_type, source_id),
  constraint ai_documents_source_type_valid check (
    source_type in ('verse', 'strongs', 'finding', 'tradition', 'question')
  )
);

create index ai_documents_search_idx on public.ai_documents using gin (search_vector);
create index ai_documents_embedding_idx on public.ai_documents
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.ai_documents enable row level security;
revoke all on public.ai_documents from anon, authenticated;
grant all on public.ai_documents to service_role;

-- Rebuilds the corpus from the source tables. Idempotent: unchanged rows
-- keep their embeddings; changed text clears the embedding so it's redone.
create or replace function public.refresh_ai_documents()
returns integer
language plpgsql
set search_path = public
as $$
declare
  affected integer;
begin
  with docs as (
    -- KJV verses; answers cite by reference, which every translation shares.
    select 'verse' as source_type,
           b.slug || '.' || v.chapter_number || '.' || v.verse_number as source_id,
           b.name || ' ' || v.chapter_number || ':' || v.verse_number as title,
           '/read/' || b.slug || '/' || v.chapter_number || '#verse-' || v.verse_number as url,
           v.verse_text as content
    from verses v
    join translations t on t.id = v.translation_id and t.slug = 'kjv'
    join books b on b.id = v.book_id
    union all
    select 'strongs', s.number,
           s.number || ' ' || s.lemma || coalesce(' (' || nullif(s.transliteration, '') || ')', ''),
           null,
           s.definition || coalesce(' KJV renders it: ' || nullif(s.kjv_usage, ''), '')
    from strongs_entries s
    union all
    select 'finding', f.slug, f.title, '/archaeology/' || f.slug,
           f.summary || E'\n\n' || f.description || E'\n\nRating: ' || f.credibility_rating || '. ' || f.credibility_note
    from findings f
    union all
    select 'tradition', t.slug, t.name, '/roots/' || t.slug,
           regexp_replace(t.summary || E'\n\n' || t.origin || E'\n\n' || t.early_church, '\[\d+\]', '', 'g')
    from traditions t
    union all
    select 'question', q.slug, q.title, '/questions/' || q.slug,
           regexp_replace(q.summary || E'\n\n' || q.argument || E'\n\n' || q.critiques || E'\n\n' || q.standing, '\[\d+\]', '', 'g')
    from questions q
  ),
  upserted as (
    insert into ai_documents (source_type, source_id, title, url, content)
    select source_type, source_id, title, url, content from docs
    on conflict (source_type, source_id) do update
      set title = excluded.title,
          url = excluded.url,
          content = excluded.content,
          embedding = case when ai_documents.content = excluded.content then ai_documents.embedding end,
          updated_at = now()
      where ai_documents.title is distinct from excluded.title
         or ai_documents.url is distinct from excluded.url
         or ai_documents.content is distinct from excluded.content
    returning 1
  )
  select count(*) into affected from upserted;

  -- Drop documents whose source no longer exists.
  delete from ai_documents d
  where not exists (
    select 1 from (
      select 'verse' as st, b.slug || '.' || v.chapter_number || '.' || v.verse_number as sid
      from verses v join translations t on t.id = v.translation_id and t.slug = 'kjv' join books b on b.id = v.book_id
      union all select 'strongs', number from strongs_entries
      union all select 'finding', slug from findings
      union all select 'tradition', slug from traditions
      union all select 'question', slug from questions
    ) live where live.st = d.source_type and live.sid = d.source_id
  );
  return affected;
end;
$$;

-- Full-text retrieval: any of the query's words, best matches first.
create or replace function public.search_ai_documents(
  search_query text,
  source_types text[] default null,
  result_limit integer default 5
)
returns table (source_type text, source_id text, title text, url text, content text, rank real)
language sql
stable
set search_path = public
as $$
  with query_input as (
    -- Lexemes are already stemmed, so build the query without re-stemming.
    select to_tsquery('simple', string_agg(quote_literal(lexeme), ' | ')) as query
    from unnest(to_tsvector('english', coalesce(search_query, '')))
    having count(*) > 0
  )
  select d.source_type, d.source_id, d.title, d.url, d.content,
         ts_rank_cd(d.search_vector, query_input.query) as rank
  from query_input
  join ai_documents d on d.search_vector @@ query_input.query
  where source_types is null or d.source_type = any(source_types)
  order by rank desc, d.id
  limit least(greatest(coalesce(result_limit, 5), 1), 20);
$$;

-- Vector retrieval, for when embeddings exist.
create or replace function public.match_ai_documents(
  query_embedding extensions.vector(384),
  source_types text[] default null,
  result_limit integer default 5
)
returns table (source_type text, source_id text, title text, url text, content text, similarity real)
language sql
stable
set search_path = public, extensions
as $$
  select d.source_type, d.source_id, d.title, d.url, d.content,
         (1 - (d.embedding <=> query_embedding))::real as similarity
  from ai_documents d
  where d.embedding is not null
    and (source_types is null or d.source_type = any(source_types))
  order by d.embedding <=> query_embedding
  limit least(greatest(coalesce(result_limit, 5), 1), 20);
$$;

revoke execute on function public.refresh_ai_documents() from public, anon, authenticated;
revoke execute on function public.search_ai_documents(text, text[], integer) from public, anon, authenticated;
revoke execute on function public.match_ai_documents(extensions.vector, text[], integer) from public, anon, authenticated;
grant execute on function public.refresh_ai_documents() to service_role;
grant execute on function public.search_ai_documents(text, text[], integer) to service_role;
grant execute on function public.match_ai_documents(extensions.vector, text[], integer) to service_role;

-- Per-user daily AI usage: requests (for caps) and tokens (for spend).
create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  mode text not null,
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,

  primary key (user_id, day, mode),
  constraint ai_usage_mode_valid check (mode in ('scholar', 'apostle'))
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon;
revoke insert, update, delete, truncate, references, trigger on public.ai_usage from authenticated;
grant select on public.ai_usage to authenticated;
grant all on public.ai_usage to service_role;

create policy "Users can read their own AI usage"
on public.ai_usage for select to authenticated
using ((select auth.uid()) = user_id);

-- Claims one request against today's cap, atomically. Returns the new
-- count, or null when the cap is already reached.
create or replace function public.claim_ai_request(p_user uuid, p_mode text, p_limit integer)
returns integer
language sql
set search_path = public
as $$
  insert into ai_usage (user_id, day, mode, requests)
  values (p_user, current_date, p_mode, 1)
  on conflict (user_id, day, mode) do update
    set requests = ai_usage.requests + 1
    where ai_usage.requests < p_limit
  returning requests;
$$;

create or replace function public.record_ai_tokens(
  p_user uuid, p_mode text, p_input bigint, p_output bigint, p_cache_read bigint
)
returns void
language sql
set search_path = public
as $$
  update ai_usage
  set input_tokens = input_tokens + coalesce(p_input, 0),
      output_tokens = output_tokens + coalesce(p_output, 0),
      cache_read_tokens = cache_read_tokens + coalesce(p_cache_read, 0)
  where user_id = p_user and day = current_date and mode = p_mode;
$$;

revoke execute on function public.claim_ai_request(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.record_ai_tokens(uuid, text, bigint, bigint, bigint) from public, anon, authenticated;
grant execute on function public.claim_ai_request(uuid, text, integer) to service_role;
grant execute on function public.record_ai_tokens(uuid, text, bigint, bigint, bigint) to service_role;
