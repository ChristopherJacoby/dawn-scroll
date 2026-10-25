-- Translation picker: remember each signed-in user's translation, and
-- enable the ASV, YLT and WEB texts that scripts/import-translations.mjs
-- loads (disabled) into public.verses.

-- Null means "no choice saved": the app falls back to the browser's
-- cookie, then the KJV. Foreign-key checks bypass RLS, so this can name a
-- disabled translation; the app treats that as no choice.
alter table public.user_settings
  add column translation text references public.translations(slug) on update cascade on delete set null;

-- A no-op where the import hasn't run (e.g. a fresh local database).
update public.translations set is_enabled = true where slug in ('asv', 'ylt', 'web');
