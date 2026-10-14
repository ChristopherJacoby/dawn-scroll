-- Per-user verse highlights: one color per verse reference per user
-- (re-highlighting changes the color). Colors are stored as palette keys,
-- not hex, so each reading mode can render its own shade.

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  translation_id bigint not null,
  book_id bigint not null,
  chapter_number smallint not null,
  verse_number smallint not null,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint highlights_color_valid check (
    color in ('yellow', 'green', 'blue', 'pink', 'purple')
  ),
  constraint highlights_verse_fkey
    foreign key (translation_id, book_id, chapter_number, verse_number)
    references public.verses (translation_id, book_id, chapter_number, verse_number)
    on delete restrict,
  -- Redundant with the verse key, but lets PostgREST embed books and
  -- translations directly for list views.
  constraint highlights_book_fkey
    foreign key (book_id) references public.books(id) on delete restrict,
  constraint highlights_translation_fkey
    foreign key (translation_id) references public.translations(id) on delete restrict,
  constraint highlights_user_verse_unique
    unique (user_id, book_id, chapter_number, verse_number)
);

create index highlights_verse_idx on public.highlights (translation_id, book_id, chapter_number, verse_number);

create trigger set_highlights_updated_at
before update on public.highlights
for each row execute function public.set_updated_at();

alter table public.highlights enable row level security;

-- Clients set only the verse and color on insert (id, user_id via
-- auth.uid(), and timestamps are server-assigned) and may change only the
-- color afterwards.
grant select, delete on public.highlights to authenticated;
grant insert (translation_id, book_id, chapter_number, verse_number, color)
  on public.highlights to authenticated;
grant update (color) on public.highlights to authenticated;
grant all on public.highlights to service_role;

create policy "Users can read their own highlights"
on public.highlights
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Foreign-key checks bypass RLS, so require an enabled translation here.
create policy "Users can create their own highlights"
on public.highlights
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.translations t
    where t.id = translation_id and t.is_enabled
  )
);

create policy "Users can recolor their own highlights"
on public.highlights
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own highlights"
on public.highlights
for delete
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.highlights is 'Per-user verse highlights; one palette color per verse reference per user.';
