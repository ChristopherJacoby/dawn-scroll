-- When a finding's content was last checked against current scholarship,
-- so readers can judge how fresh it is (archaeological claims change:
-- papers get retracted, sites get redated).
alter table public.findings
  add column reviewed_on date not null default current_date;
