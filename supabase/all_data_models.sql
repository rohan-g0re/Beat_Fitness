-- =====================================================
-- COMBINED MIGRATIONS - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================
-- This combines all 5 migrations for initial setup
-- Run this once to create all tables, policies, and indexes
-- =====================================================

-- =====================================================
-- Migration: 00001_initial_schema
-- Description: Core tables (profiles, routines, days, exercises)
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- Profiles Table
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  equipment jsonb not null default '[]'::jsonb,
  height numeric,
  weight numeric,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked 1:1 with auth.users';
comment on column public.profiles.equipment is 'User''s available equipment (JSON array of strings)';
comment on column public.profiles.height is 'User height in centimeters';
comment on column public.profiles.weight is 'User weight in kilograms';

-- =====================================================
-- Routines Table
-- =====================================================

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.routines is 'User workout routines';

-- =====================================================
-- Routine Days Table
-- =====================================================

create table if not exists public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (routine_id, day_of_week)
);

comment on table public.routine_days is 'Days within a routine (Mon-Sun)';
comment on column public.routine_days.day_of_week is '0=Sun, 1=Mon, ..., 6=Sat';
comment on column public.routine_days.tags is 'Muscle group tags (JSON array)';

-- =====================================================
-- Routine Exercises Table
-- =====================================================

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days(id) on delete cascade,
  name text not null,
  target_sets int,
  target_reps int,
  target_weight numeric,
  notes text,
  sort_order int not null default 0
);

comment on table public.routine_exercises is 'Exercises planned for a routine day';
comment on column public.routine_exercises.sort_order is 'Display order within the day';

-- =====================================================
-- Migration: 00002_workout_sessions
-- Description: Sessions, exercises, and sets tables
-- =====================================================

-- =====================================================
-- Workout Sessions Table
-- =====================================================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete set null,
  routine_day_id uuid references public.routine_days(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  total_duration_sec int,
  strength_score numeric
);

comment on table public.workout_sessions is 'Completed workout sessions';
comment on column public.workout_sessions.strength_score is 'Calculated strength score (volume-based)';

-- =====================================================
-- Workout Exercises Table
-- =====================================================

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

comment on table public.workout_exercises is 'Exercises logged in a session';

-- =====================================================
-- Workout Sets Table
-- =====================================================

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number int not null,
  reps int not null,
  weight numeric,
  rir int check (rir between 0 and 10),
  completed_at timestamptz not null default now()
);

comment on table public.workout_sets is 'Individual sets logged during workouts';
comment on column public.workout_sets.rir is 'Reps in Reserve (0-10)';
comment on column public.workout_sets.completed_at is 'Timestamp for streak/pace calculations';

-- =====================================================
-- Migration: 00003_entitlements
-- Description: User entitlements for monetization
-- =====================================================

-- =====================================================
-- User Entitlements Table
-- =====================================================

create table if not exists public.user_entitlements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  pro boolean not null default false,
  max_routines int not null default 2,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.user_entitlements is 'Subscription entitlements mirrored from RevenueCat';
comment on column public.user_entitlements.pro is 'Pro subscription active';
comment on column public.user_entitlements.max_routines is 'Maximum routines allowed (2 free, 50 pro)';
comment on column public.user_entitlements.expires_at is 'Subscription expiration (null = lifetime)';

-- =====================================================
-- Migration: 00004_rls_policies
-- Description: Row-Level Security policies
-- =====================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.user_entitlements enable row level security;

-- =====================================================
-- Profiles Policies
-- =====================================================

create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- =====================================================
-- User Entitlements Policies
-- =====================================================

create policy "Users can read own entitlements"
  on public.user_entitlements for select
  using (user_id = auth.uid());

create policy "Users can update own entitlements"
  on public.user_entitlements for update
  using (user_id = auth.uid());

create policy "Users can insert own entitlements"
  on public.user_entitlements for insert
  with check (user_id = auth.uid());

-- =====================================================
-- Routines Policies (with capacity check)
-- =====================================================

create policy "Users can read own routines"
  on public.routines for select
  using (user_id = auth.uid());

create policy "Users can update own routines"
  on public.routines for update
  using (user_id = auth.uid());

create policy "Users can delete own routines"
  on public.routines for delete
  using (user_id = auth.uid());

create policy "Users can insert routines within cap"
  on public.routines for insert
  with check (
    user_id = auth.uid() 
    and (
      -- Allow if pro or under max_routines limit
      exists (
        select 1 from public.user_entitlements e
        where e.user_id = auth.uid() 
        and (
          e.pro = true 
          or (select count(*) from public.routines where user_id = auth.uid()) < e.max_routines
        )
      )
      -- Or if no entitlement record exists yet (bootstrap: allow up to 2)
      or (
        not exists (select 1 from public.user_entitlements where user_id = auth.uid())
        and (select count(*) from public.routines where user_id = auth.uid()) < 2
      )
    )
  );

-- =====================================================
-- Routine Days Policies
-- =====================================================

create policy "Users can manage own routine days"
  on public.routine_days for all
  using (
    exists (
      select 1 from public.routines r 
      where r.id = routine_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r 
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

-- =====================================================
-- Routine Exercises Policies
-- =====================================================

create policy "Users can manage own routine exercises"
  on public.routine_exercises for all
  using (
    exists (
      select 1 from public.routine_days d 
      join public.routines r on r.id = d.routine_id
      where d.id = routine_day_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routine_days d 
      join public.routines r on r.id = d.routine_id
      where d.id = routine_day_id and r.user_id = auth.uid()
    )
  );

-- =====================================================
-- Workout Sessions Policies
-- =====================================================

create policy "Users can manage own sessions"
  on public.workout_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================================================
-- Workout Exercises Policies
-- =====================================================

create policy "Users can manage own workout exercises"
  on public.workout_exercises for all
  using (
    exists (
      select 1 from public.workout_sessions s 
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s 
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- =====================================================
-- Workout Sets Policies
-- =====================================================

create policy "Users can manage own workout sets"
  on public.workout_sets for all
  using (
    exists (
      select 1 from public.workout_exercises e 
      join public.workout_sessions s on s.id = e.session_id
      where e.id = workout_exercise_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_exercises e 
      join public.workout_sessions s on s.id = e.session_id
      where e.id = workout_exercise_id and s.user_id = auth.uid()
    )
  );

-- =====================================================
-- Migration: 00005_indexes
-- Description: Performance indexes
-- =====================================================

-- Profiles
create index if not exists idx_profiles_email on public.profiles(email);

-- Routines
create index if not exists idx_routines_user_id on public.routines(user_id);
create index if not exists idx_routines_created_at on public.routines(created_at desc);

-- Routine Days
create index if not exists idx_routine_days_routine_id on public.routine_days(routine_id);

-- Routine Exercises
create index if not exists idx_routine_exercises_day_id on public.routine_exercises(routine_day_id);
create index if not exists idx_routine_exercises_sort_order on public.routine_exercises(routine_day_id, sort_order);

-- Workout Sessions (critical for stats queries)
create index if not exists idx_sessions_user_started on public.workout_sessions(user_id, started_at desc);
create index if not exists idx_sessions_ended_at on public.workout_sessions(ended_at) where ended_at is not null;
create index if not exists idx_sessions_routine_id on public.workout_sessions(routine_id) where routine_id is not null;

-- Workout Exercises
create index if not exists idx_workout_exercises_session_id on public.workout_exercises(session_id);

-- Workout Sets (critical for volume calculations)
create index if not exists idx_sets_exercise on public.workout_sets(workout_exercise_id);
create index if not exists idx_sets_completed_at on public.workout_sets(completed_at desc);

-- User Entitlements
create index if not exists idx_entitlements_user_id on public.user_entitlements(user_id);
create index if not exists idx_entitlements_pro on public.user_entitlements(pro) where pro = true;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- You should now see 8 tables in your Supabase dashboard:
-- 1. profiles
-- 2. routines
-- 3. routine_days
-- 4. routine_exercises
-- 5. workout_sessions
-- 6. workout_exercises
-- 7. workout_sets
-- 8. user_entitlements
-- =====================================================

