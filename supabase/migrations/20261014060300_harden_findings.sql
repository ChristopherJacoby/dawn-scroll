-- Review follow-ups for the archaeology catalog.

-- reviewed_on is set by the content generator; a default would label any
-- row added another way as reviewed today.
alter table public.findings alter column reviewed_on drop default;

-- The catalog is read-only to clients. RLS (select-only policies) already
-- blocks writes; revoking them too means a policy mistake can't open them,
-- and covers TRUNCATE, which RLS doesn't.
revoke insert, update, delete, truncate, references, trigger
  on public.findings, public.finding_scripture_refs,
     public.finding_sources, public.finding_timeline
  from anon, authenticated;
