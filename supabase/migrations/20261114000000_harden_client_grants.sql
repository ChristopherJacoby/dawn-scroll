-- Security review follow-up (2026-11-14).
--
-- Where Supabase's default privileges are in force, anon and authenticated
-- get ALL on every new public table. A column-level grant adds to that; it
-- restricts nothing unless the table-level privilege is revoked first.
-- Bookmarks did that (20261014000100); highlights, notes and the
-- reading-plan tables only added column grants, so with the defaults a
-- signed-in user could set any column of their own rows through the REST
-- API: re-key a note to another verse or a disabled translation, or
-- backdate plan progress. RLS kept all of it to the user's own rows.
--
-- A signed-out probe of production on 2026-11-14 got "permission denied"
-- on these tables, which suggests the defaults are not in force there.
-- These statements make the intended privileges explicit either way.

-- Highlights and notes: clients set the verse and the color/content on
-- insert, and may change only the color/content afterwards.
revoke insert, update on public.highlights, public.notes from authenticated;
grant insert (translation_id, book_id, chapter_number, verse_number, color)
  on public.highlights to authenticated;
grant update (color) on public.highlights to authenticated;
grant insert (translation_id, book_id, chapter_number, verse_number, content)
  on public.notes to authenticated;
grant update (content) on public.notes to authenticated;

-- Reading plans: clients choose only the plan (and day); nothing is
-- updatable.
revoke insert, update on public.user_reading_plans, public.user_reading_progress
  from authenticated;
grant insert (plan_id) on public.user_reading_plans to authenticated;
grant insert (plan_id, day_number) on public.user_reading_progress to authenticated;

-- Bookmarks have no update policy; drop the unused privilege.
revoke update on public.bookmarks from authenticated;

-- Per-user tables are for signed-in users only. Every policy on them is
-- already "to authenticated"; this removes the unused anon privileges.
revoke all on
  public.bookmarks, public.highlights, public.notes, public.user_settings,
  public.profiles, public.user_reading_plans, public.user_reading_progress
from anon;

-- Reference tables created before the per-table revokes became routine.
-- Select-only RLS already blocks writes; without these privileges a
-- future policy mistake can't open scripture or lexicon text to clients.
revoke insert, update, delete on
  public.translations, public.books, public.data_sources, public.verses,
  public.chapters, public.reading_plans, public.reading_plan_days,
  public.reading_plan_readings, public.strongs_entries,
  public.morphology_codes, public.verse_original_words,
  public.verse_word_map, public.strongs_drift_notes
from anon, authenticated;

-- New tables start with no client write privileges; each migration grants
-- what its table needs.
alter default privileges in schema public
  revoke insert, update, delete on tables from anon, authenticated;

-- The only limit on avatar_url was its scheme. Not validated against
-- existing rows; it applies to every new write.
alter table public.profiles add constraint profiles_avatar_url_length
  check (avatar_url is null or char_length(avatar_url) <= 2048) not valid;
