-- Per-user reading preferences. One row per user, created lazily on first
-- save; the app falls back to defaults (and localStorage) when absent.

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reading_mode text not null default 'light',
  font_scale smallint not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_settings_reading_mode_valid check (
    reading_mode in ('light', 'sepia', 'dark')
  ),
  constraint user_settings_font_scale_range check (
    font_scale between 80 and 140
  )
);

create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

grant select, insert, update on public.user_settings to authenticated;
grant all on public.user_settings to service_role;

create policy "Users can read their own settings"
on public.user_settings
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own settings"
on public.user_settings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own settings"
on public.user_settings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

comment on table public.user_settings is 'Per-user reading preferences (mode, font scale); absent row means defaults.';
