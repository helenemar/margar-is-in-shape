-- Enable pgcrypto
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

create table family_groups (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  pin        text not null unique,
  created_at timestamptz not null default now()
);

create table profiles (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references family_groups (id) on delete cascade,
  prenom        text not null,
  avatar_url    text,
  session_token text unique,
  created_at    timestamptz not null default now(),
  unique (group_id, prenom)
);

create type alimentation_enum as enum ('super_healthy', 'ca_va', 'faute');

create table checkins (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles (id) on delete cascade,
  date             date not null,
  alimentation     alimentation_enum not null,
  nb_verres_alcool int not null default 0,
  photo_url        text,
  created_at       timestamptz not null default now(),
  unique (user_id, date)
);

create table activities (
  id            uuid primary key default gen_random_uuid(),
  checkin_id    uuid not null references checkins (id) on delete cascade,
  sport         text not null,
  duree_minutes int not null,
  created_at    timestamptz not null default now()
);

create table activity_participants (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities (id) on delete cascade,
  user_id     uuid not null references profiles (id) on delete cascade,
  unique (activity_id, user_id)
);

create table kudos (
  id         uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references checkins (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (checkin_id, user_id)
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references checkins (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  texte      text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- RLS HELPERS
-- These helpers read the session_token set via
--   SET LOCAL app.session_token = '<token>';
-- before issuing queries with the anon key.
-- All server-side code uses the service role key
-- (bypasses RLS) and enforces access at app level.
-- ─────────────────────────────────────────────

create or replace function current_profile_id()
returns uuid language sql stable security definer as $$
  select id
  from   profiles
  where  session_token = nullif(current_setting('app.session_token', true), '')
  limit  1;
$$;

create or replace function current_group_id()
returns uuid language sql stable security definer as $$
  select group_id
  from   profiles
  where  session_token = nullif(current_setting('app.session_token', true), '')
  limit  1;
$$;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table family_groups        enable row level security;
alter table profiles             enable row level security;
alter table checkins             enable row level security;
alter table activities           enable row level security;
alter table activity_participants enable row level security;
alter table kudos                enable row level security;
alter table comments             enable row level security;

-- family_groups: read own group
create policy "family_groups_select" on family_groups for select
  using (id = current_group_id());

-- profiles: read members of own group
create policy "profiles_select" on profiles for select
  using (group_id = current_group_id());

create policy "profiles_update_own" on profiles for update
  using (id = current_profile_id());

-- checkins: read own group; write own profile only
create policy "checkins_select" on checkins for select
  using (
    user_id in (select id from profiles where group_id = current_group_id())
  );

create policy "checkins_insert" on checkins for insert
  with check (user_id = current_profile_id());

create policy "checkins_update" on checkins for update
  using (user_id = current_profile_id());

create policy "checkins_delete" on checkins for delete
  using (user_id = current_profile_id());

-- activities: follow checkin ownership
create policy "activities_select" on activities for select
  using (
    checkin_id in (
      select c.id from checkins c
      join   profiles p on p.id = c.user_id
      where  p.group_id = current_group_id()
    )
  );

create policy "activities_insert" on activities for insert
  with check (
    checkin_id in (select id from checkins where user_id = current_profile_id())
  );

create policy "activities_delete" on activities for delete
  using (
    checkin_id in (select id from checkins where user_id = current_profile_id())
  );

-- activity_participants: visible within group; own insert
create policy "activity_participants_select" on activity_participants for select
  using (
    activity_id in (
      select a.id from activities a
      join   checkins c on c.id = a.checkin_id
      join   profiles p on p.id = c.user_id
      where  p.group_id = current_group_id()
    )
  );

create policy "activity_participants_insert" on activity_participants for insert
  with check (user_id = current_profile_id());

-- kudos: visible within group; write own, cannot kudo own checkin
create policy "kudos_select" on kudos for select
  using (
    checkin_id in (
      select c.id from checkins c
      join   profiles p on p.id = c.user_id
      where  p.group_id = current_group_id()
    )
  );

create policy "kudos_insert" on kudos for insert
  with check (
    user_id = current_profile_id() and
    checkin_id not in (select id from checkins where user_id = current_profile_id())
  );

create policy "kudos_delete" on kudos for delete
  using (user_id = current_profile_id());

-- comments: visible within group; write own
create policy "comments_select" on comments for select
  using (
    checkin_id in (
      select c.id from checkins c
      join   profiles p on p.id = c.user_id
      where  p.group_id = current_group_id()
    )
  );

create policy "comments_insert" on comments for insert
  with check (user_id = current_profile_id());

create policy "comments_update" on comments for update
  using (user_id = current_profile_id());

create policy "comments_delete" on comments for delete
  using (user_id = current_profile_id());
