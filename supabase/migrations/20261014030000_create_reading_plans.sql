-- Reading plans: a public catalog (plans → days → readings) plus per-user
-- enrollment and progress.

create table public.reading_plans (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  duration_days smallint not null,
  created_at timestamptz not null default now(),

  constraint reading_plans_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint reading_plans_duration_positive check (duration_days > 0)
);

create table public.reading_plan_days (
  plan_id bigint not null references public.reading_plans(id) on delete cascade,
  day_number smallint not null,

  primary key (plan_id, day_number),
  constraint reading_plan_days_day_positive check (day_number > 0)
);

-- A day's readings, each a chapter range within one book.
create table public.reading_plan_readings (
  plan_id bigint not null,
  day_number smallint not null,
  position smallint not null,
  book_id bigint not null references public.books(id) on delete restrict,
  start_chapter smallint not null,
  end_chapter smallint not null,

  primary key (plan_id, day_number, position),
  foreign key (plan_id, day_number)
    references public.reading_plan_days (plan_id, day_number) on delete cascade,
  constraint reading_plan_readings_chapter_range check (
    start_chapter > 0 and end_chapter >= start_chapter
  )
);

create index reading_plan_readings_book_idx on public.reading_plan_readings (book_id);

-- The catalog is public and read-only; it's maintained by migrations.
alter table public.reading_plans enable row level security;
alter table public.reading_plan_days enable row level security;
alter table public.reading_plan_readings enable row level security;

grant select on public.reading_plans, public.reading_plan_days, public.reading_plan_readings
  to anon, authenticated;
grant all on public.reading_plans, public.reading_plan_days, public.reading_plan_readings
  to service_role;

create policy "Anyone can read reading plans"
on public.reading_plans for select to anon, authenticated using (true);
create policy "Anyone can read reading plan days"
on public.reading_plan_days for select to anon, authenticated using (true);
create policy "Anyone can read reading plan readings"
on public.reading_plan_readings for select to anon, authenticated using (true);

-- Enrollment: a user is following a plan. Leaving deletes their progress.
create table public.user_reading_plans (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id bigint not null references public.reading_plans(id) on delete cascade,
  started_at timestamptz not null default now(),

  primary key (user_id, plan_id)
);

create index user_reading_plans_plan_idx on public.user_reading_plans (plan_id);

-- Progress: a row means that day is complete (no "completed" flag to
-- disagree with it). Requires enrollment, and the day must exist.
create table public.user_reading_progress (
  user_id uuid not null default auth.uid(),
  plan_id bigint not null,
  day_number smallint not null,
  completed_at timestamptz not null default now(),

  primary key (user_id, plan_id, day_number),
  foreign key (user_id, plan_id)
    references public.user_reading_plans (user_id, plan_id) on delete cascade,
  foreign key (plan_id, day_number)
    references public.reading_plan_days (plan_id, day_number) on delete cascade
);

create index user_reading_progress_plan_day_idx on public.user_reading_progress (plan_id, day_number);

alter table public.user_reading_plans enable row level security;
alter table public.user_reading_progress enable row level security;

-- Clients choose only the plan (and day); user_id and timestamps are
-- server-assigned. Nothing is updatable.
grant select, delete on public.user_reading_plans, public.user_reading_progress to authenticated;
grant insert (plan_id) on public.user_reading_plans to authenticated;
grant insert (plan_id, day_number) on public.user_reading_progress to authenticated;
grant all on public.user_reading_plans, public.user_reading_progress to service_role;

create policy "Users can read their own plan enrollments"
on public.user_reading_plans for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can enroll themselves in plans"
on public.user_reading_plans for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can leave their own plans"
on public.user_reading_plans for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own reading progress"
on public.user_reading_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can record their own reading progress"
on public.user_reading_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can undo their own reading progress"
on public.user_reading_progress for delete to authenticated
using ((select auth.uid()) = user_id);

comment on table public.reading_plans is 'Public reading plan catalog; seeded by migrations.';
comment on table public.user_reading_progress is 'Completed plan days per user; a row means the day is done.';
