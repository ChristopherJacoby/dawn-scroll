-- Roots takes a position (DS-139): another name a tradition goes by
-- ("Called Easter in English"), and a headed section on whether Christians
-- should keep it. Paragraphs are separated by blank lines and may cite the
-- tradition's sources inline as [n], like origin and early_church.

alter table public.traditions
  add column also_called text,
  add column stance_heading text,
  add column stance text,
  add constraint traditions_also_called_present
    check (also_called is null or (also_called ~ '\S' and char_length(also_called) <= 80)),
  add constraint traditions_stance_complete
    check ((stance_heading is null) = (stance is null)),
  add constraint traditions_stance_present
    check (stance is null or (
      stance_heading ~ '\S' and char_length(stance_heading) <= 100
      and stance ~ '\S' and char_length(stance) <= 4000
    ));
