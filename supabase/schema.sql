-- Liftit schema (v2). Idempotent — safe to re-run.
-- ALSO: in Supabase dashboard → Storage → create a PUBLIC bucket named "user-content".

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

-- v2 columns
alter table public.users add column if not exists total_workouts int not null default 0;
alter table public.users add column if not exists profile_pic_url text;
alter table public.users add column if not exists last_sessions jsonb not null default '{}'::jsonb;

create table if not exists public.pump_photos (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  image_url text not null,
  taken_at timestamptz not null,
  caption text,
  xp_bonus int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists pump_photos_username_idx on public.pump_photos(username, taken_at desc);

create table if not exists public.gym_status (
  id int primary key default 1 check (id = 1),
  locations jsonb not null default '[]'::jsonb,
  message text not null default 'Gym status updated',
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.gym_status (id, locations, message)
values (
  1,
  '[
    {"key":"zion","name":"Highway Plaza","detail":"","status":"open"},
    {"key":"sunplaza","name":"SunPlaza","detail":"","status":"open"}
  ]'::jsonb,
  'Gym status updated'
)
on conflict (id) do nothing;

alter table public.users      enable row level security;
alter table public.pump_photos enable row level security;
alter table public.gym_status  enable row level security;

grant select on public.gym_status to anon, authenticated;
drop policy if exists "gym-status-read" on public.gym_status;
create policy "gym-status-read" on public.gym_status
  for select to anon, authenticated using (id = 1);

do $$
begin
  alter publication supabase_realtime add table public.gym_status;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------- RPC: signup ----------
create or replace function public.app_signup(
  p_username text, p_pin_hash text, p_initial_muscles jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
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
  p_username text, p_pin_hash text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  select * into u from public.users where username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  return to_jsonb(u) - 'pin_hash';
end; $$;

-- ---------- RPC: save state ----------
create or replace function public.app_save_state(
  p_username text, p_pin_hash text, p_state jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
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
    last_sessions      = coalesce(p_state->'lastSessions', last_sessions),
    total_workouts     = coalesce((p_state->>'totalWorkouts')::int, total_workouts),
    profile_pic_url    = coalesce(p_state->>'profilePicUrl', profile_pic_url),
    updated_at         = now()
  where username = lower(trim(p_username))
  returning * into u;
  return to_jsonb(u) - 'pin_hash';
end; $$;

-- ---------- RPC: leaderboard ----------
create or replace function public.app_leaderboard()
returns table (
  username text, total_xp int, weekly_xp int, streak int,
  total_workouts int, profile_pic_url text, muscles jsonb
) language sql security definer set search_path = public as $$
  select username, total_xp, weekly_xp, streak, total_workouts, profile_pic_url, muscles
  from public.users order by total_xp desc limit 100;
$$;

-- ---------- RPC: pump photos ----------
create or replace function public.app_save_pump_photo(
  p_username text, p_pin_hash text, p_image_url text,
  p_taken_at timestamptz, p_caption text, p_xp_bonus int
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users; new_id uuid;
begin
  select * into u from public.users where username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  insert into public.pump_photos (username, image_url, taken_at, caption, xp_bonus)
  values (u.username, p_image_url, p_taken_at, p_caption, coalesce(p_xp_bonus, 0))
  returning id into new_id;
  return jsonb_build_object('id', new_id);
end; $$;

create or replace function public.app_get_pump_photos(p_username text)
returns table (id uuid, image_url text, taken_at timestamptz, caption text, xp_bonus int)
language sql security definer set search_path = public as $$
  select id, image_url, taken_at, caption, xp_bonus
  from public.pump_photos
  where username = lower(trim(p_username))
  order by taken_at desc limit 200;
$$;

-- ---------- RPC: gym status ----------
create or replace function public.app_get_gym_status()
returns jsonb language sql security definer set search_path = public as $$
  select to_jsonb(g) from public.gym_status g where id = 1;
$$;

create or replace function public.app_admin_update_gym_status(
  p_username text, p_pin_hash text, p_status jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users; g public.gym_status;
begin
  select * into u from public.users where username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  if u.username <> 'tris' then raise exception 'Admin only'; end if;

  update public.gym_status set
    locations = coalesce(p_status->'locations', locations),
    message = coalesce(nullif(p_status->>'message', ''), 'Gym status updated'),
    updated_by = u.username,
    updated_at = now()
  where id = 1
  returning * into g;

  return to_jsonb(g);
end; $$;

create or replace function public.app_admin_list_users(
  p_username text, p_pin_hash text
) returns table (
  username text, total_xp int, weekly_xp int, total_workouts int,
  profile_pic_url text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  select * into u from public.users where username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  if u.username <> 'tris' then raise exception 'Admin only'; end if;

  return query
    select u2.username, u2.total_xp, u2.weekly_xp, u2.total_workouts,
           u2.profile_pic_url, u2.created_at
    from public.users u2
    order by u2.created_at desc;
end; $$;

-- Lock + grant
revoke all on public.users from anon, authenticated;
revoke all on public.pump_photos from anon, authenticated;
revoke all on public.gym_status from anon, authenticated;
grant select on public.gym_status to anon, authenticated;
grant execute on function public.app_signup(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_save_state(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_leaderboard() to anon, authenticated;
grant execute on function public.app_save_pump_photo(text, text, text, timestamptz, text, int) to anon, authenticated;
grant execute on function public.app_get_pump_photos(text) to anon, authenticated;
grant execute on function public.app_get_gym_status() to anon, authenticated;
grant execute on function public.app_admin_update_gym_status(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_admin_list_users(text, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ---------- Storage policies for "user-content" bucket ----------
-- Must run AFTER you've created the bucket in Storage → New bucket → name "user-content" → public.
do $$ begin
  if exists (select 1 from storage.buckets where id = 'user-content') then
    -- Allow anon to read & insert (we trust filenames generated client-side)
    drop policy if exists "uc-read"   on storage.objects;
    drop policy if exists "uc-insert" on storage.objects;
    create policy "uc-read"   on storage.objects for select using (bucket_id = 'user-content');
    create policy "uc-insert" on storage.objects for insert with check (bucket_id = 'user-content');
  end if;
end $$;
