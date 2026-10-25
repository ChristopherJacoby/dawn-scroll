-- Premium subscriptions, one row per user, written only by the server
-- (Stripe checkout and webhooks, with the service role). Users can read
-- their own row. Access rules live in src/lib/premium.

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  -- Stripe's subscription status; 'none' before any checkout completes.
  status text not null default 'none',
  plan text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscriptions_status_valid check (status in (
    'none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid',
    'incomplete', 'incomplete_expired', 'paused'
  )),
  constraint subscriptions_plan_valid check (plan is null or plan in ('monthly', 'annual'))
);

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

create policy "Users can read their own subscription"
on public.subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);
