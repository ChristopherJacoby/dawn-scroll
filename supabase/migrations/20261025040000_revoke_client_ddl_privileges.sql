-- Supabase's default privileges give anon and authenticated TRUNCATE,
-- REFERENCES and TRIGGER on every new public table. Clients never need
-- them (they run no DDL, and TRUNCATE bypasses RLS), so take them away
-- everywhere, and stop new tables from getting them. Row access is still
-- governed by each table's grants and RLS policies.

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
