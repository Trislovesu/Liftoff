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
alter table public.users add column if not exists gym_type text;
alter table public.users add column if not exists body_weight_lbs int;
alter table public.users add column if not exists body_weight_updated_at timestamptz;
alter table public.users add column if not exists featured_workout_id text;
alter table public.users add column if not exists featured_pr jsonb;
alter table public.users add column if not exists public_workouts jsonb not null default '[]'::jsonb;
alter table public.users add column if not exists zion_member_code text;
alter table public.users add column if not exists zion_verified boolean not null default false;
alter table public.users add column if not exists disabled_by_admin boolean not null default false;
alter table public.users add column if not exists admin_notice text;

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

create table if not exists public.app_rate_limits (
  bucket text primary key,
  hits int not null default 1,
  window_start timestamptz not null default now()
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
alter table public.app_rate_limits enable row level security;

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

create or replace function public.app_client_ip()
returns text language plpgsql stable security definer set search_path = public as $$
declare headers jsonb; ip text;
begin
  begin
    headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    headers := '{}'::jsonb;
  end;
  ip := split_part(coalesce(
    headers->>'cf-connecting-ip',
    headers->>'x-real-ip',
    headers->>'x-forwarded-for',
    'unknown'
  ), ',', 1);
  return lower(trim(ip));
end; $$;

create or replace function public.app_rate_limit(
  p_bucket text, p_limit int, p_window_seconds int
) returns void language plpgsql security definer set search_path = public as $$
declare current_hits int;
begin
  insert into public.app_rate_limits (bucket, hits, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update set
    hits = case
      when public.app_rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else public.app_rate_limits.hits + 1
    end,
    window_start = case
      when public.app_rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else public.app_rate_limits.window_start
    end
  returning hits into current_hits;

  if current_hits > p_limit then
    raise exception 'Too many requests. Please wait and try again.';
  end if;
end; $$;

-- ---------- RPC: signup ----------
create or replace function public.app_signup(
  p_username text, p_pin_hash text, p_initial_muscles jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  perform public.app_rate_limit('signup:ip:' || public.app_client_ip(), 8, 900);
  perform public.app_rate_limit('signup:user:' || lower(trim(p_username)), 3, 3600);
  if length(trim(p_username)) < 2 or length(trim(p_username)) > 20 then
    raise exception 'Username must be 2-20 characters';
  end if;
  if lower(trim(p_username)) !~ '^[a-z0-9_]{2,20}$' then
    raise exception 'Username can only use letters, numbers, and underscores';
  end if;
  if p_pin_hash is null or length(p_pin_hash) < 16 then
    raise exception 'Invalid PIN';
  end if;
  if jsonb_typeof(coalesce(p_initial_muscles, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_initial_muscles, '[]'::jsonb)) > 20 then
    raise exception 'Invalid muscle data';
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
  perform public.app_rate_limit('login:ip:' || public.app_client_ip(), 30, 900);
  perform public.app_rate_limit('login:user:' || lower(trim(p_username)), 12, 900);
  select * into u from public.users where public.users.username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.disabled_by_admin then raise exception 'Account disabled by admin'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  return to_jsonb(u) - 'pin_hash';
end; $$;

-- ---------- RPC: save state ----------
create or replace function public.app_save_state(
  p_username text, p_pin_hash text, p_state jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  perform public.app_rate_limit('save:' || lower(trim(p_username)), 120, 900);
  if octet_length(coalesce(p_state::text, '')) > 50000 then
    raise exception 'State payload is too large';
  end if;
  if jsonb_typeof(coalesce(p_state->'muscles', '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_state->'muscles', '[]'::jsonb)) > 20 then
    raise exception 'Invalid muscle data';
  end if;
  select * into u from public.users u0 where u0.username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.disabled_by_admin then raise exception 'Account disabled by admin'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  update public.users set
    total_xp           = case
      when admin_notice = 'XP reset by admin' then total_xp
      else least(5000000, greatest(0, coalesce((p_state->>'totalXP')::int, total_xp)))
    end,
    weekly_xp          = case
      when admin_notice = 'XP reset by admin' then weekly_xp
      else least(500000, greatest(0, coalesce((p_state->>'weeklyXP')::int, weekly_xp)))
    end,
    week_start         = coalesce((p_state->>'weekStart')::timestamptz, week_start),
    streak             = coalesce((p_state->>'streak')::int, streak),
    last_workout_date  = nullif(p_state->>'lastWorkoutDate','')::date,
    muscles            = case
      when admin_notice = 'XP reset by admin' then muscles
      else coalesce(p_state->'muscles', muscles)
    end,
    personal_bests     = coalesce(p_state->'personalBests', personal_bests),
    last_sessions      = coalesce(p_state->'lastSessions', last_sessions),
    total_workouts     = least(10000, greatest(0, coalesce((p_state->>'totalWorkouts')::int, total_workouts))),
    profile_pic_url    = nullif(left(coalesce(p_state->>'profilePicUrl', profile_pic_url), 500), ''),
    gym_type           = coalesce(nullif(p_state->>'gymType', ''), gym_type),
    body_weight_lbs    = case
      when p_state ? 'bodyWeightLbs' then least(999, greatest(0, nullif(p_state->>'bodyWeightLbs', '')::int))
      else body_weight_lbs
    end,
    body_weight_updated_at = case
      when p_state ? 'bodyWeightUpdatedAt' then nullif(p_state->>'bodyWeightUpdatedAt', '')::timestamptz
      else body_weight_updated_at
    end,
    featured_workout_id = nullif(left(coalesce(p_state->>'featuredWorkoutId', featured_workout_id), 80), ''),
    featured_pr        = coalesce(p_state->'featuredPRs', p_state->'featuredPR', featured_pr),
    public_workouts    = case
      when jsonb_typeof(coalesce(p_state->'publicWorkouts', '[]'::jsonb)) = 'array'
       and jsonb_array_length(coalesce(p_state->'publicWorkouts', '[]'::jsonb)) <= 30
      then coalesce(p_state->'publicWorkouts', public_workouts)
      else public_workouts
    end,
    zion_member_code = case
      when p_state ? 'zionMemberCode' and coalesce(p_state->>'zionMemberCode', '') ~ '^[0-9]{5}$' then p_state->>'zionMemberCode'
      else zion_member_code
    end,
    zion_verified = case
      when p_state ? 'zionMemberCode' and coalesce(p_state->>'zionMemberCode', '') ~ '^[0-9]{5}$' then true
      else zion_verified
    end,
    admin_notice = case
      when p_state ? 'adminNotice' then nullif(p_state->>'adminNotice', '')
      else admin_notice
    end,
    updated_at         = now()
  where username = lower(trim(p_username))
  returning * into u;
  return to_jsonb(u) - 'pin_hash';
end; $$;

-- ---------- RPC: leaderboard ----------
create or replace function public.app_leaderboard()
returns table (
  username text, total_xp int, weekly_xp int, streak int,
  total_workouts int, profile_pic_url text, muscles jsonb, zion_verified boolean
) language sql security definer set search_path = public as $$
  select username, total_xp, weekly_xp, streak, total_workouts, profile_pic_url, muscles, zion_verified
  from public.users where disabled_by_admin = false order by total_xp desc limit 100;
$$;

create or replace function public.app_public_profile(p_username text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'username', username,
    'total_xp', total_xp,
    'weekly_xp', weekly_xp,
    'total_workouts', total_workouts,
    'profile_pic_url', profile_pic_url,
    'muscles', muscles,
    'body_weight_lbs', body_weight_lbs,
    'body_weight_updated_at', body_weight_updated_at,
    'featured_workout_id', featured_workout_id,
    'featured_pr', featured_pr,
    'public_workouts', public_workouts,
    'zion_verified', zion_verified
  )
  from public.users
  where username = lower(trim(p_username));
$$;

-- ---------- RPC: pump photos ----------
create or replace function public.app_save_pump_photo(
  p_username text, p_pin_hash text, p_image_url text,
  p_taken_at timestamptz, p_caption text, p_xp_bonus int
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users; new_id uuid;
begin
  perform public.app_rate_limit('pump:' || lower(trim(p_username)), 30, 3600);
  select * into u from public.users u0 where u0.username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  if p_image_url not like '%/storage/v1/object/public/user-content/pumps/' || u.username || '/%' then
    raise exception 'Invalid pump photo URL';
  end if;
  if p_xp_bonus < 0 or p_xp_bonus > 75 then
    raise exception 'Invalid pump photo bonus';
  end if;
  insert into public.pump_photos (username, image_url, taken_at, caption, xp_bonus)
  values (u.username, left(p_image_url, 500), p_taken_at, left(coalesce(p_caption, ''), 160), coalesce(p_xp_bonus, 0))
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
  perform public.app_rate_limit('admin-status:' || lower(trim(p_username)), 30, 900);
  select * into u from public.users u0 where u0.username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  if u.username <> 'tris' then raise exception 'Admin only'; end if;

  if jsonb_typeof(coalesce(p_status->'locations', '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_status->'locations', '[]'::jsonb)) > 2 then
    raise exception 'Invalid gym status';
  end if;

  update public.gym_status set
    locations = coalesce(p_status->'locations', locations),
    message = coalesce(nullif(left(p_status->>'message', 160), ''), 'Gym status updated'),
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
  profile_pic_url text, created_at timestamptz, zion_verified boolean, disabled_by_admin boolean
) language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  perform public.app_rate_limit('admin-users:' || lower(trim(p_username)), 20, 900);
  select * into u from public.users u0 where u0.username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  if u.username <> 'tris' then raise exception 'Admin only'; end if;

  return query
    select u2.username, u2.total_xp, u2.weekly_xp, u2.total_workouts,
           u2.profile_pic_url, u2.created_at, u2.zion_verified, u2.disabled_by_admin
    from public.users u2
    order by u2.created_at desc;
end; $$;

create or replace function public.app_admin_disable_user(
  p_username text, p_pin_hash text, p_target_username text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users; target public.users;
begin
  perform public.app_rate_limit('admin-disable:' || lower(trim(p_username)), 20, 900);
  select * into u from public.users u0 where u0.username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  if u.username <> 'tris' then raise exception 'Admin only'; end if;
  if lower(trim(p_target_username)) = 'tris' then raise exception 'Cannot disable admin'; end if;

  update public.users set
    disabled_by_admin = true,
    admin_notice = 'Account disabled by admin',
    updated_at = now()
  where public.users.username = lower(trim(p_target_username))
  returning * into target;
  if target.id is null then raise exception 'Target user not found'; end if;
  return jsonb_build_object('username', target.username, 'disabled_by_admin', target.disabled_by_admin);
end; $$;

create or replace function public.app_admin_reset_user_xp(
  p_username text, p_pin_hash text, p_target_username text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare u public.users; target public.users;
begin
  perform public.app_rate_limit('admin-reset-xp:' || lower(trim(p_username)), 20, 900);
  select * into u from public.users u0 where u0.username = lower(trim(p_username));
  if u.id is null then raise exception 'User not found'; end if;
  if u.pin_hash <> p_pin_hash then raise exception 'Invalid PIN'; end if;
  if u.username <> 'tris' then raise exception 'Admin only'; end if;

  update public.users set
    total_xp = 0,
    weekly_xp = 0,
    muscles = (
      select coalesce(jsonb_agg(jsonb_set(jsonb_set(m.value, '{level}', '0'::jsonb), '{xp}', '0'::jsonb)), '[]'::jsonb)
      from jsonb_array_elements(public.users.muscles) as m(value)
    ),
    featured_pr = null,
    admin_notice = 'XP reset by admin',
    updated_at = now()
  where public.users.username = lower(trim(p_target_username))
  returning * into target;
  if target.id is null then raise exception 'Target user not found'; end if;
  return jsonb_build_object('username', target.username, 'total_xp', target.total_xp, 'weekly_xp', target.weekly_xp);
end; $$;

-- Lock + grant
revoke all on public.users from anon, authenticated;
revoke all on public.pump_photos from anon, authenticated;
revoke all on public.gym_status from anon, authenticated;
revoke all on public.app_rate_limits from anon, authenticated;
grant select on public.gym_status to anon, authenticated;
revoke execute on function public.app_client_ip() from public, anon, authenticated;
revoke execute on function public.app_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.app_signup(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_save_state(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_leaderboard() to anon, authenticated;
grant execute on function public.app_public_profile(text) to anon, authenticated;
grant execute on function public.app_save_pump_photo(text, text, text, timestamptz, text, int) to anon, authenticated;
grant execute on function public.app_get_pump_photos(text) to anon, authenticated;
grant execute on function public.app_get_gym_status() to anon, authenticated;
grant execute on function public.app_admin_update_gym_status(text, text, jsonb) to anon, authenticated;
grant execute on function public.app_admin_list_users(text, text) to anon, authenticated;
grant execute on function public.app_admin_disable_user(text, text, text) to anon, authenticated;
grant execute on function public.app_admin_reset_user_xp(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ---------- Storage policies for "user-content" bucket ----------
-- Must run AFTER you've created the bucket in Storage → New bucket → name "user-content" → public.
do $$ begin
  if exists (select 1 from storage.buckets where id = 'user-content') then
    drop policy if exists "uc-read"   on storage.objects;
    drop policy if exists "uc-insert" on storage.objects;
    create policy "uc-read"   on storage.objects for select using (bucket_id = 'user-content');
    create policy "uc-insert" on storage.objects for insert with check (
      bucket_id = 'user-content'
      and (storage.foldername(name))[1] in ('avatars', 'pumps')
      and (storage.foldername(name))[2] ~ '^[a-z0-9_-]{2,32}$'
      and lower(name) ~ '^((avatars)|(pumps))/[a-z0-9_-]{2,32}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic)$'
      and coalesce((metadata->>'size')::bigint, 0) <= 5242880
      and coalesce(metadata->>'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')
    );
  end if;
end $$;
