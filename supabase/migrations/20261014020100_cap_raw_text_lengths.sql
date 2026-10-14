-- Security review follow-up: length checks on btrim(...) measure the text
-- *after* stripping spaces, so a direct PostgREST call could store a note
-- (or display name) padded with millions of spaces. Cap the raw length and
-- require at least one non-whitespace character instead (\S also rejects
-- tab/newline-only text, which btrim allowed).

alter table public.notes drop constraint notes_content_length;
alter table public.notes add constraint notes_content_length check (
  char_length(content) <= 5000 and content ~ '\S'
);

alter table public.profiles drop constraint profiles_display_name_length;
alter table public.profiles add constraint profiles_display_name_length check (
  display_name is null
  or (char_length(display_name) <= 60 and display_name ~ '\S')
);
