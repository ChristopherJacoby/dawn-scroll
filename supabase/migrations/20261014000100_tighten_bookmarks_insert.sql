-- Tighten bookmark inserts (security review follow-up):
-- * Clients may set only the verse columns; id, user_id (default
--   auth.uid()) and created_at are always server-assigned.
-- * Foreign-key checks bypass RLS, so the insert policy itself requires
--   the translation to be enabled.

revoke insert on public.bookmarks from authenticated;
grant insert (translation_id, book_id, chapter_number, verse_number)
  on public.bookmarks to authenticated;

drop policy "Users can create their own bookmarks" on public.bookmarks;

create policy "Users can create their own bookmarks"
on public.bookmarks
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.translations t
    where t.id = translation_id and t.is_enabled
  )
);
