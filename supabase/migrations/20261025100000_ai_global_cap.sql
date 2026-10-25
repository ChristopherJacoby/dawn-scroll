-- A ceiling on AI requests across all users per day, so many accounts
-- can't multiply the per-user cap into unbounded spend. Server-only.

create table public.ai_usage_daily (
  day date not null default current_date,
  mode text not null,
  requests integer not null default 0,

  primary key (day, mode),
  constraint ai_usage_daily_mode_valid check (mode in ('scholar', 'apostle'))
);

alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from anon, authenticated;
grant all on public.ai_usage_daily to service_role;

-- Replaces the per-user-only claim. Claims one request against the user's
-- cap and then the global one, atomically. Returns the user's new count;
-- null when the user's cap is reached; 0 when the global cap is reached
-- (the user's claim is then given back).
drop function public.claim_ai_request(uuid, text, integer);

create function public.claim_ai_request(
  p_user uuid, p_mode text, p_limit integer, p_global_limit integer
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  claimed integer;
  total integer;
begin
  insert into ai_usage (user_id, day, mode, requests)
  values (p_user, current_date, p_mode, 1)
  on conflict (user_id, day, mode) do update
    set requests = ai_usage.requests + 1
    where ai_usage.requests < p_limit
  returning requests into claimed;
  if claimed is null then
    return null;
  end if;

  insert into ai_usage_daily (day, mode, requests)
  values (current_date, p_mode, 1)
  on conflict (day, mode) do update
    set requests = ai_usage_daily.requests + 1
    where ai_usage_daily.requests < p_global_limit
  returning requests into total;
  if total is null then
    update ai_usage set requests = requests - 1
    where user_id = p_user and day = current_date and mode = p_mode;
    return 0;
  end if;
  return claimed;
end;
$$;

-- Upserts, so a reply that finishes after midnight still gets recorded.
create or replace function public.record_ai_tokens(
  p_user uuid, p_mode text, p_input bigint, p_output bigint, p_cache_read bigint
)
returns void
language sql
set search_path = public
as $$
  insert into ai_usage (user_id, day, mode, input_tokens, output_tokens, cache_read_tokens)
  values (p_user, current_date, p_mode,
          coalesce(p_input, 0), coalesce(p_output, 0), coalesce(p_cache_read, 0))
  on conflict (user_id, day, mode) do update
    set input_tokens = ai_usage.input_tokens + excluded.input_tokens,
        output_tokens = ai_usage.output_tokens + excluded.output_tokens,
        cache_read_tokens = ai_usage.cache_read_tokens + excluded.cache_read_tokens;
$$;

revoke execute on function public.claim_ai_request(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_ai_request(uuid, text, integer, integer) to service_role;
