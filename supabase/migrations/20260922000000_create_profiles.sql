-- User profiles: one row per auth user, created automatically on signup.
-- Users can read and update only their own row; there is no public read.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_display_name_length check (
    display_name is null or char_length(btrim(display_name)) between 1 and 60
  ),
  constraint profiles_avatar_url_format check (
    avatar_url is null or avatar_url ~ '^https://'
  )
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;
-- service_role bypasses RLS; the grant is still required for table access.
grant all on public.profiles to service_role;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Insert is trigger-only (security definer below); no client insert policy.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

comment on table public.profiles is 'Per-user profile; auto-created by trigger on auth.users insert.';
