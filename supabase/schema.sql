-- Liftit schema. Run this once in Supabase SQL Editor.
-- All access goes through SECURITY DEFINER RPCs which validate the PIN hash.
-- The anon key can ONLY call these functions; the users table itself is locked.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  pin_hash text not null,
  total_xp int not null default 0,
  weekly_xp int not null default 0,
  week_start timestamptz not null default now(),
  streak int not null default 0,
  last_workout_date date,
  muscles jsonb not null default '[]'::jsonb,
  personal_bests jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
-- no policies = anon cannot read/write the table directly.

-- ---------- RPC: signup ----------
create or replace function public.app_signup(
  p_username text,
  p_pin_hash text,
  p_initial_muscles jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  if length(trim(p_username)) < 2 or length(trim(p_username)) > 20 then
    raise exception 'Username must be 2-20 characters';
  end if;
  if p_pin_hash is null or length(p_pin_hash) < 16 then
    raise exception 'Invalid PIN';
  end if;
  insert into public.users (username, pin_hash, muscles)
  values (lower(trim(p_username)), p_pin_hash, coalesce(p_initial_muscles, '[]'::jsonb))
  returning * into u;
  return to_jsonb(u) - 'pin_hash';
exception when unique_violation then
  raise exception 'Username already taken';
end; $$;

-- ---------- RPC: login ----------
create or replace function public.app_login(
  p_username text,
  p_pin_hash text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  select * into u from public.users where username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  return to_jsonb(u) - 'pin_hash';
end; $$;

-- ---------- RPC: save state ----------
create or replace function public.app_save_state(
  p_username text,
  p_pin_hash text,
  p_state jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  select * into u from public.users where username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  update public.users set
    total_xp           = coalesce((p_state->>'totalXP')::int, total_xp),
    weekly_xp          = coalesce((p_state->>'weeklyXP')::int, weekly_xp),
    week_start         = coalesce((p_state->>'weekStart')::timestamptz, week_start),
    streak             = coalesce((p_state->>'streak')::int, streak),
    last_workout_date  = nullif(p_state->>'lastWorkoutDate','')::date,
    muscles            = coalesce(p_state->'muscles', muscles),
    personal_bests     = coalesce(p_state->'personalBests', personal_bests),
    updated_at         = now()
  where username = lower(trim(p_username))
  returning * into u;
  return to_jsonb(u) - 'pin_hash';
end; $$;

-- ---------- RPC: leaderboard ----------
create or replace function public.app_leaderboard()
returns table (
  username text,
  total_xp int,
  weekly_xp int,
  streak int,
  muscles jsonb
) language sql security definer set search_path = public as $$
  select username, total_xp, weekly_xp, streak, muscles
  from public.users
  order by total_xp desc
  limit 100;
$$;

-- Lock down: only allow anon to execute the four RPCs, nothing else.
revoke all on public.users from anon, authenticated;
grant execute on function public.app_signup(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_save_state(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_leaderboard() to anon, authenticated;
