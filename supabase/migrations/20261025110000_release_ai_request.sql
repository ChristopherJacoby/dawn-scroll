-- Gives back a claimed request when the AI service failed before
-- answering, so an outage doesn't use up anyone's daily questions.
create function public.release_ai_request(p_user uuid, p_mode text)
returns void
language sql
set search_path = public
as $$
  update ai_usage set requests = greatest(requests - 1, 0)
  where user_id = p_user and day = current_date and mode = p_mode;
  update ai_usage_daily set requests = greatest(requests - 1, 0)
  where day = current_date and mode = p_mode;
$$;

revoke execute on function public.release_ai_request(uuid, text) from public, anon, authenticated;
grant execute on function public.release_ai_request(uuid, text) to service_role;
