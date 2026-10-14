-- Per-user verse notes: one note per verse reference per user. Clearing a
-- note's text deletes it, so stored content is never blank.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  translation_id bigint not null,
  book_id bigint not null,
  chapter_number smallint not null,
  verse_number smallint not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notes_content_length check (
    char_length(btrim(content)) between 1 and 5000
  ),
  constraint notes_verse_fkey
    foreign key (translation_id, book_id, chapter_number, verse_number)
    references public.verses (translation_id, book_id, chapter_number, verse_number)
    on delete restrict,
  -- Redundant with the verse key, but lets PostgREST embed books and
  -- translations directly for list views.
  constraint notes_book_fkey
    foreign key (book_id) references public.books(id) on delete restrict,
  constraint notes_translation_fkey
    foreign key (translation_id) references public.translations(id) on delete restrict,
  constraint notes_user_verse_unique
    unique (user_id, book_id, chapter_number, verse_number)
);

create index notes_verse_idx on public.notes (translation_id, book_id, chapter_number, verse_number);

create trigger set_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

-- Clients set only the verse and content on insert (id, user_id via
-- auth.uid(), and timestamps are server-assigned) and may change only the
-- content afterwards.
grant select, delete on public.notes to authenticated;
grant insert (translation_id, book_id, chapter_number, verse_number, content)
  on public.notes to authenticated;
grant update (content) on public.notes to authenticated;
grant all on public.notes to service_role;

create policy "Users can read their own notes"
on public.notes
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Foreign-key checks bypass RLS, so require an enabled translation here.
create policy "Users can create their own notes"
on public.notes
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.translations t
    where t.id = translation_id and t.is_enabled
  )
);

create policy "Users can edit their own notes"
on public.notes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
on public.notes
for delete
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.notes is 'Per-user verse notes; one per verse reference per user, never blank.';
