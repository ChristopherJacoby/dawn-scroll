-- Subscriptions are written only by the server (service role). RLS already
-- blocks client writes; revoking the table privileges Supabase grants by
-- default means a policy mistake can't hand out free Premium.
revoke insert, update, delete on public.subscriptions from anon, authenticated;
revoke select on public.subscriptions from anon;
