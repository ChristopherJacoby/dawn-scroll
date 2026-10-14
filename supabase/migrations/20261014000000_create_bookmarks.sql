-- Per-user verse bookmarks. A bookmark belongs to a verse reference (book,
-- chapter, verse), not to a translation: one bookmark per verse per user.
-- translation_id records which translation it was made in, and the
-- composite foreign key guarantees the referenced verse exists.

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  translation_id bigint not null,
  book_id bigint not null,
  chapter_number smallint not null,
  verse_number smallint not null,
  created_at timestamptz not null default now(),

  constraint bookmarks_verse_fkey
    foreign key (translation_id, book_id, chapter_number, verse_number)
    references public.verses (translation_id, book_id, chapter_number, verse_number)
    on delete restrict,
  -- Redundant with the verse key, but lets PostgREST embed books and
  -- translations directly for list views.
  constraint bookmarks_book_fkey
    foreign key (book_id) references public.books(id) on delete restrict,
  constraint bookmarks_translation_fkey
    foreign key (translation_id) references public.translations(id) on delete restrict,
  constraint bookmarks_user_verse_unique
    unique (user_id, book_id, chapter_number, verse_number)
);

-- The unique constraint's index serves per-chapter lookups; this one serves
-- the "most recent first" list.
create index bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);
create index bookmarks_verse_idx on public.bookmarks (translation_id, book_id, chapter_number, verse_number);

alter table public.bookmarks enable row level security;

grant select, insert, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;

create policy "Users can read their own bookmarks"
on public.bookmarks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own bookmarks"
on public.bookmarks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own bookmarks"
on public.bookmarks
for delete
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.bookmarks is 'Per-user verse bookmarks; one per verse reference per user.';
