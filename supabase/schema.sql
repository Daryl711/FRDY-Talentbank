-- ============================================================================
-- Mango — Career & Life Guide : Supabase schema
-- Run in the Supabase SQL editor (Database -> SQL Editor -> New query).
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists vector;  -- pgvector, for persona-based matching

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_type   as enum ('individual','company');
  create type persona      as enum ('Lion','Eagle','Wolf','Owl','Octopus','Elephant','Cheetah','Fox','Ant','Horse','Dolphin','Peacock');
  create type swipe_dir    as enum ('left','right','save');
  create type target_kind  as enum ('company','candidate');
  create type conn_status  as enum ('pending','accepted','declined');
  create type work_type    as enum ('Full-time','Hybrid','Remote');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- PROFILES (individual users) — 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  user_type     user_type not null default 'individual',
  name          text not null,
  initials      text generated always as (upper(left(name,1)) || upper(coalesce(split_part(name,' ',2),' '))) stored,
  headline      text,
  location      text,
  years_exp     int default 0,
  persona       persona,
  about         text,
  skills        text[] default '{}',
  experience    jsonb default '[]',        -- [{id,title,company,dates,description}]
  profile_score int default 0,
  views         int default 0,
  matches       int default 0,
  embedding     vector(384),               -- persona/profile embedding
  created_at    timestamptz default now()
);

-- Backfill columns onto profiles tables created before this column existed.
-- `create table if not exists` above is a no-op on an existing table, so new
-- columns must be added explicitly for the app's profile edits to persist.
alter table profiles add column if not exists experience jsonb default '[]';
-- Animal Persona quiz result (onboarding). animal_trait feeds the employer
-- dashboard's "Animal Trait" column; animal_scores keeps the full breakdown.
alter table profiles add column if not exists animal_trait text;
alter table profiles add column if not exists animal_scores jsonb default '{}';

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------
create table if not exists companies (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references auth.users(id) on delete set null,
  name        text not null,
  initials    text generated always as (upper(left(name,2))) stored,
  industry    text,
  size        text,        -- '1-10','11-50','51-200','200+'
  stage       text,        -- 'Startup','Scale-up','Established','MNC'
  culture     text[] default '{}',
  location    text,
  employees   text,
  embedding   vector(384),
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- ROLES (job postings)
-- ----------------------------------------------------------------------------
create table if not exists roles (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid references companies(id) on delete cascade,
  title        text not null,
  location     text,
  salary_min   int,
  salary_max   int,
  type         work_type default 'Full-time',
  tags         text[] default '{}',
  perks        text[] default '{}',
  package      text,
  embedding    vector(384),
  created_at   timestamptz default now()
);

-- Convenience view the app reads for the featured list / swipe deck
create or replace view roles_with_company as
  select r.*, c.name as company, c.initials, c.employees, c.location as company_location
  from roles r join companies c on c.id = r.company_id;

-- ----------------------------------------------------------------------------
-- SWIPES — every left/right/save the user makes
-- ----------------------------------------------------------------------------
create table if not exists swipes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_id   uuid not null,
  target_type target_kind not null default 'company',
  direction   swipe_dir not null,
  created_at  timestamptz default now(),
  unique (user_id, target_id, target_type)
);

-- ----------------------------------------------------------------------------
-- MATCHES — created when both sides swipe right (mutual)
-- ----------------------------------------------------------------------------
create table if not exists matches (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid not null references companies(id) on delete cascade,
  score       int,
  created_at  timestamptz default now(),
  unique (user_id, company_id)
);

-- ----------------------------------------------------------------------------
-- CONNECTIONS (professional network)
-- ----------------------------------------------------------------------------
create table if not exists connections (
  id           uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       conn_status not null default 'pending',
  created_at   timestamptz default now(),
  unique (requester_id, addressee_id)
);

-- ----------------------------------------------------------------------------
-- MESSAGES — chat unlocked on a mutual match
-- ----------------------------------------------------------------------------
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid not null references matches(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- RESUMES — versioned, stored in Supabase Storage
-- ----------------------------------------------------------------------------
create table if not exists resumes (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null,
  storage_path text not null,         -- bucket path in Storage
  visibility text default 'matches',  -- 'public' | 'matches' | 'private'
  is_active  boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- MUTUAL-MATCH TRIGGER
-- When a user swipes right on a company that has already swiped right on them
-- (company-side swipe stored with target_type='candidate'), create a match.
-- ============================================================================
create or replace function handle_right_swipe() returns trigger as $$
declare reciprocal boolean;
begin
  if new.direction <> 'right' then return new; end if;

  if new.target_type = 'company' then
    select exists(
      select 1 from swipes s
      where s.target_id = new.user_id
        and s.target_type = 'candidate'
        and s.direction = 'right'
        and s.user_id in (select owner_id from companies where id = new.target_id)
    ) into reciprocal;

    if reciprocal then
      insert into matches(user_id, company_id, score)
      values (new.user_id, new.target_id, 80)
      on conflict do nothing;
    end if;
  end if;
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists trg_right_swipe on swipes;
create trigger trg_right_swipe after insert on swipes
  for each row execute function handle_right_swipe();

-- ============================================================================
-- SWIPE DECK RPC — companies the user hasn't swiped yet, ranked by similarity
-- ============================================================================
create or replace function get_swipe_deck()
returns table (
  id uuid, initials text, name text, role text, location text,
  employees text, match int, tags text[], package text, perks text[]
) language sql security definer as $$
  select
    c.id, c.initials, c.name,
    coalesce((select r.title from roles r where r.company_id = c.id limit 1), 'Open Role') as role,
    c.location, c.employees,
    -- cosine similarity → 0..100 match score (falls back to 75 if no embedding)
    coalesce(round((1 - (c.embedding <=> p.embedding)) * 100)::int, 75) as match,
    coalesce((select r.tags from roles r where r.company_id = c.id limit 1), '{}') as tags,
    coalesce((select r.package from roles r where r.company_id = c.id limit 1), null) as package,
    coalesce((select r.perks from roles r where r.company_id = c.id limit 1), '{}') as perks
  from companies c
  cross join (select embedding from profiles where id = auth.uid()) p
  where c.id not in (
    select target_id from swipes
    where user_id = auth.uid() and target_type = 'company'
  )
  order by match desc
  limit 20;
$$;

-- ============================================================================
-- CONNECTIONS VIEW the app reads (network / requests / discover)
-- ============================================================================
create or replace view connections_view as
  select
    p.id, p.initials, p.name, p.headline as role,
    '#3a6ea5' as color, false as online,
    case
      when cn.status = 'accepted' then 'network'
      when cn.status = 'pending' and cn.addressee_id = auth.uid() then 'requests'
      else 'discover'
    end as kind,
    coalesce(cn.status::text,'discover') as status
  from profiles p
  left join connections cn
    on (cn.requester_id = p.id and cn.addressee_id = auth.uid())
    or (cn.addressee_id = p.id and cn.requester_id = auth.uid())
  where p.id <> auth.uid();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles    enable row level security;
alter table companies   enable row level security;
alter table roles       enable row level security;
alter table swipes      enable row level security;
alter table matches     enable row level security;
alter table connections enable row level security;
alter table messages    enable row level security;
alter table resumes     enable row level security;

-- Policies are dropped first so this whole script can be re-run safely
-- (create policy is not idempotent and errors if the policy already exists).

-- profiles: anyone signed in can read; you edit only your own
drop policy if exists "profiles read"   on profiles;
create policy "profiles read"   on profiles for select to authenticated using (true);
drop policy if exists "profiles write"  on profiles;
create policy "profiles write"  on profiles for update to authenticated using (auth.uid() = id);
drop policy if exists "profiles insert" on profiles;
create policy "profiles insert" on profiles for insert to authenticated with check (auth.uid() = id);

-- companies & roles: readable by all signed-in users
drop policy if exists "companies read" on companies;
create policy "companies read" on companies for select to authenticated using (true);
drop policy if exists "roles read"     on roles;
create policy "roles read"     on roles     for select to authenticated using (true);
drop policy if exists "companies own"  on companies;
create policy "companies own"  on companies for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- swipes: you only see and create your own
drop policy if exists "swipes own" on swipes;
create policy "swipes own" on swipes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- matches: you see matches you're part of
drop policy if exists "matches own" on matches;
create policy "matches own" on matches for select to authenticated using (auth.uid() = user_id);

-- connections: you see rows you're part of; create requests as yourself
drop policy if exists "connections read"   on connections;
create policy "connections read"   on connections for select to authenticated using (auth.uid() in (requester_id, addressee_id));
drop policy if exists "connections create" on connections;
create policy "connections create" on connections for insert to authenticated with check (auth.uid() = requester_id);
drop policy if exists "connections update" on connections;
create policy "connections update" on connections for update to authenticated using (auth.uid() = addressee_id);

-- messages: only participants of the match can read/send
drop policy if exists "messages read" on messages;
create policy "messages read" on messages for select to authenticated
  using (exists (select 1 from matches m where m.id = match_id and m.user_id = auth.uid()));
drop policy if exists "messages send" on messages;
create policy "messages send" on messages for insert to authenticated
  with check (sender_id = auth.uid());

-- resumes: private to the owner
drop policy if exists "resumes own" on resumes;
create policy "resumes own" on resumes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- AUTO-CREATE A PROFILE ROW ON SIGN-UP
-- ============================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public          -- so the unqualified table below resolves
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name',''), 'New User'))
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Never let a profile hiccup abort the auth sign-up itself.
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- SEED DATA (companies + roles) — optional, for a populated deck
-- ============================================================================
insert into companies (id, name, industry, location, employees) values
  ('11111111-1111-1111-1111-111111111111','Summit Advisors','Consulting','Boston, MA','240 emp.'),
  ('22222222-2222-2222-2222-222222222222','Meridian Capital','Fintech','New York, NY','180 emp.'),
  ('33333333-3333-3333-3333-333333333333','Stratos Ventures','SaaS','San Francisco, CA','320 emp.'),
  ('44444444-4444-4444-4444-444444444444','Apex Partners','Operations','Chicago, IL','95 emp.'),
  ('55555555-5555-5555-5555-555555555555','Luminary Group','Strategy','New York, NY','140 emp.')
on conflict do nothing;

insert into roles (company_id, title, salary_min, salary_max, type, tags, package, perks) values
  ('11111111-1111-1111-1111-111111111111','Managing Director',230000,290000,'Full-time','{Strategy,Consulting,Leadership}','$260K','{Partnership,"Travel Budget",Pension}'),
  ('22222222-2222-2222-2222-222222222222','Senior Product Manager',180000,220000,'Hybrid','{Product,Fintech,Strategy}','$200K','{Equity,Remote,Health}'),
  ('33333333-3333-3333-3333-333333333333','VP of Engineering',240000,300000,'Full-time','{Engineering,SaaS,Leadership}','$270K','{Equity,401k,Flexible}'),
  ('44444444-4444-4444-4444-444444444444','Chief of Staff',160000,190000,'Hybrid','{Operations,Strategy}','$175K','{Bonus,Hybrid,Pension}'),
  ('55555555-5555-5555-5555-555555555555','VP Strategy',210000,250000,'Hybrid','{Strategy,Consulting}','$230K','{Equity,Travel,Health}')
on conflict do nothing;
