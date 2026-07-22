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
  create type target_kind  as enum ('company','candidate','role');
  create type conn_status  as enum ('pending','accepted','declined');
  create type work_type    as enum ('Full-time','Hybrid','Remote');
exception when duplicate_object then null; end $$;

-- The swipe deck is job/role-based (one card per open role), so candidates
-- swipe on a role. Add the 'role' target to pre-existing databases whose
-- target_kind was created before this value existed. Adding an enum value is
-- allowed inside the script's transaction; we just never *use* the literal in
-- the same transaction — the functions below compare target_type::text instead,
-- so they create cleanly, and app inserts of 'role' happen later post-commit.
alter type target_kind add value if not exists 'role';

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
  -- Hiring pipeline stage the employer moves the matched candidate through:
  -- Applied -> Screening -> Interview -> Final Round -> Offer -> Hired (or Rejected)
  stage       text not null default 'Applied',
  created_at  timestamptz default now(),
  unique (user_id, company_id)
);

-- Backfill onto matches tables created before the stage column existed.
alter table matches add column if not exists stage text not null default 'Applied';
-- Which role the candidate matched on (the deck is role-based). Nullable so
-- older company-level matches remain valid; cleared if the role is deleted.
alter table matches add column if not exists role_id uuid references roles(id) on delete set null;

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
-- MESSAGES — chat unlocked on a mutual match, OR a peer connection.
-- match_id links company-match chat; connection_id links candidate-to-candidate
-- direct messages. Exactly one of the two is set per row.
-- ----------------------------------------------------------------------------
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid not null references matches(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);

-- Candidate-to-candidate DMs reuse this table via connection_id, so match_id is
-- relaxed to nullable (peer DMs have no company match). The index keeps a
-- conversation's messages ordered and cheap to fetch.
alter table messages add column if not exists connection_id uuid references connections(id) on delete cascade;
alter table messages alter column match_id drop not null;
create index if not exists messages_connection_idx on messages(connection_id, created_at);

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

-- The Resume feature (AI-generated + uploaded) adds these fields. Uploaded
-- resumes still use storage_path; AI-generated ones don't, so the file-only
-- columns are relaxed to nullable.
alter table resumes add column if not exists title       text;
alter table resumes add column if not exists kind        text default 'uploaded';  -- 'ai' | 'uploaded'
alter table resumes add column if not exists for_company text;
alter table resumes add column if not exists size_kb     int;
alter table resumes add column if not exists ats_score   int;
alter table resumes alter column label drop not null;
alter table resumes alter column storage_path drop not null;

-- ============================================================================
-- MUTUAL-MATCH TRIGGER
-- When a user swipes right on a company that has already swiped right on them
-- (company-side swipe stored with target_type='candidate'), create a match.
-- ============================================================================
create or replace function handle_right_swipe() returns trigger as $$
declare reciprocal boolean;
begin
  if new.direction <> 'right' then return new; end if;

  if new.target_type::text = 'company' then
    select exists(
      select 1 from swipes s
      where s.target_id = new.user_id
        and s.target_type::text = 'candidate'
        and s.direction = 'right'
        and s.user_id in (select owner_id from companies where id = new.target_id)
    ) into reciprocal;

    if reciprocal then
      insert into matches(user_id, company_id, score)
      values (new.user_id, new.target_id, 80)
      on conflict do nothing;
    end if;

  elsif new.target_type::text = 'role' then
    -- A candidate applying to a role (right-swipe) creates a match on that
    -- role's company, tagged with the role, so the employer's live Hiring
    -- board picks them up in real time. One match per candidate+company.
    insert into matches(user_id, company_id, role_id, score)
    select new.user_id, r.company_id, r.id, 80
    from roles r
    where r.id = new.target_id
    on conflict (user_id, company_id) do nothing;
  end if;
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists trg_right_swipe on swipes;
create trigger trg_right_swipe after insert on swipes
  for each row execute function handle_right_swipe();

-- ============================================================================
-- SWIPE DECK RPC — companies the user hasn't swiped yet, ranked by similarity
-- ============================================================================
-- Role-based deck: one card per open job the candidate hasn't swiped yet. `id`
-- is the role id (what recordSwipe stores), `name` is the company and `role`
-- the job title, so each opening shows as its own card. A scalar subquery (not
-- a cross join) reads the caller's embedding, so a candidate with no profile
-- row still gets a deck (match falls back to 75) instead of an empty one.
create or replace function get_swipe_deck()
returns table (
  id uuid, initials text, name text, role text, location text,
  employees text, match int, tags text[], package text, perks text[]
) language sql security definer as $$
  select
    r.id, c.initials, c.name, r.title as role,
    coalesce(r.location, c.location) as location, c.employees,
    coalesce(round((1 - (c.embedding <=> (
      select embedding from profiles where id = auth.uid()
    ))) * 100)::int, 75) as match,
    coalesce(r.tags, '{}') as tags, r.package, coalesce(r.perks, '{}') as perks
  from roles r
  join companies c on c.id = r.company_id
  where r.id not in (
    select target_id from swipes
    where user_id = auth.uid() and target_type::text = 'role'
  )
  order by match desc, r.created_at desc
  limit 30;
$$;

-- ============================================================================
-- EMPLOYER: matched candidates for the caller's company (Hiring page board)
-- Joins matches -> profiles (matches.user_id FKs auth.users, not profiles, so
-- PostgREST can't auto-embed — hence an RPC). Only returns rows for companies
-- the caller owns.
-- ============================================================================
create or replace function get_company_matches()
returns table (
  match_id uuid, candidate_id uuid, name text, initials text,
  trait text, score int, stage text, headline text, created_at timestamptz
) language sql security definer as $$
  select
    m.id, p.id, p.name, p.initials,
    p.animal_trait, m.score, m.stage, p.headline, m.created_at
  from matches m
  join profiles p on p.id = m.user_id
  where m.company_id in (select id from companies where owner_id = auth.uid())
  order by m.created_at desc;
$$;

-- ============================================================================
-- CANDIDATE: jobs the caller has applied to (right-swiped), newest first.
-- swipes.target_id holds a company id but has no declared FK, so PostgREST can't
-- auto-embed — hence an RPC. security definer + explicit auth.uid() filter keeps
-- each candidate scoped to their own submissions. `matched` flags the ones that
-- became a mutual match.
-- ============================================================================
-- Role-based: the jobs the candidate applied to (right-swiped a role), newest
-- first. `id` is the role id; `matched` flags roles whose company became a
-- mutual match.
create or replace function get_my_submitted_jobs()
returns table (
  id uuid, initials text, name text, role text, location text,
  employees text, match int, matched boolean, created_at timestamptz
) language sql security definer as $$
  select
    r.id, c.initials, c.name, r.title as role,
    coalesce(r.location, c.location) as location, c.employees,
    coalesce(round((1 - (c.embedding <=> (
      select embedding from profiles where id = auth.uid()
    ))) * 100)::int, 75) as match,
    exists(select 1 from matches m where m.user_id = auth.uid() and m.company_id = c.id) as matched,
    s.created_at
  from swipes s
  join roles r on r.id = s.target_id
  join companies c on c.id = r.company_id
  where s.user_id = auth.uid()
    and s.target_type::text = 'role'
    and s.direction = 'right'
  order by s.created_at desc;
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
    coalesce(cn.status::text,'discover') as status,
    cn.id as connection_id,
    cn.requester_id = auth.uid() as outgoing
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
-- Company owners can post/edit/remove roles for the companies they own. This is
-- what lets the employer dashboard add new job openings. Permissive policies are
-- OR'd, so "roles read" above still lets everyone read every role.
drop policy if exists "roles manage"   on roles;
create policy "roles manage"   on roles     for all to authenticated
  using (company_id in (select id from companies where owner_id = auth.uid()))
  with check (company_id in (select id from companies where owner_id = auth.uid()));
drop policy if exists "companies own"  on companies;
create policy "companies own"  on companies for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- swipes: you only see and create your own
drop policy if exists "swipes own" on swipes;
create policy "swipes own" on swipes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- matches: candidates see their own; company owners see + manage (move the
-- hiring stage of) matches for the companies they own.
drop policy if exists "matches own" on matches;
create policy "matches own" on matches for select to authenticated using (auth.uid() = user_id);
drop policy if exists "matches company read" on matches;
create policy "matches company read" on matches for select to authenticated
  using (company_id in (select id from companies where owner_id = auth.uid()));
drop policy if exists "matches company update" on matches;
create policy "matches company update" on matches for update to authenticated
  using (company_id in (select id from companies where owner_id = auth.uid()))
  with check (company_id in (select id from companies where owner_id = auth.uid()));

-- connections: you see rows you're part of; create requests as yourself
drop policy if exists "connections read"   on connections;
create policy "connections read"   on connections for select to authenticated using (auth.uid() in (requester_id, addressee_id));
drop policy if exists "connections create" on connections;
create policy "connections create" on connections for insert to authenticated with check (auth.uid() = requester_id);
drop policy if exists "connections update" on connections;
create policy "connections update" on connections for update to authenticated using (auth.uid() = addressee_id);

-- messages: readable/sendable by participants of the company match OR the peer
-- connection the message belongs to.
drop policy if exists "messages read" on messages;
create policy "messages read" on messages for select to authenticated
  using (
    exists (select 1 from matches m where m.id = match_id and m.user_id = auth.uid())
    or exists (
      select 1 from connections c
      where c.id = connection_id and auth.uid() in (c.requester_id, c.addressee_id)
    )
  );
drop policy if exists "messages send" on messages;
create policy "messages send" on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      connection_id is null
      or exists (
        select 1 from connections c
        where c.id = connection_id and auth.uid() in (c.requester_id, c.addressee_id)
      )
    )
  );

-- resumes: private to the owner
drop policy if exists "resumes own" on resumes;
create policy "resumes own" on resumes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- STORAGE — uploaded resume files live in a private "resumes" bucket. Each
-- user's files are namespaced under a folder named after their auth uid
-- (see uploadResume in repo.ts: `${uid}/${timestamp}_${filename}`), so the
-- policies below scope every user to read/write only their own folder.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resume files own" on storage.objects;
create policy "resume files own" on storage.objects for all to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

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
-- CelcomDigi is the only seeded employer — candidates' swipe deck
-- (get_swipe_deck) reads the companies table, so keeping just CelcomDigi here
-- means candidates only ever see CelcomDigi roles.
insert into companies (id, name, industry, location, employees) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','CelcomDigi','Telecommunications','Kuala Lumpur, MY','12,000 emp.')
on conflict do nothing;

-- Remove the earlier demo companies (Summit/Meridian/Stratos/Apex/Luminary) so
-- they no longer surface in the candidate deck. Cascades to their roles and any
-- matches (both FK on delete cascade). Safe to re-run.
delete from companies where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

insert into roles (company_id, title, salary_min, salary_max, type, tags, package, perks) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Senior Product Manager, Digital',90000,130000,'Hybrid','{Product,Telco,Digital}','$110K','{Medical,Hybrid,Bonus}')
on conflict do nothing;

-- More CelcomDigi openings — tech + corporate. These carry explicit ids so the
-- insert is idempotent (`on conflict (id) do nothing`), unlike the seed above
-- which would duplicate on re-run. All point at the CelcomDigi company id.
insert into roles (id, company_id, title, location, salary_min, salary_max, type, tags, package, perks) values
  ('cccc1111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Software Developer','Kuala Lumpur, MY',72000,102000,'Hybrid','{Engineering,"Full-Stack",Telco}','$85K','{Medical,Hybrid,"Learning Budget"}'),
  ('cccc2222-2222-2222-2222-222222222222','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Backend Developer','Kuala Lumpur, MY',84000,118000,'Hybrid','{Engineering,Backend,Cloud}','$95K','{Medical,Remote,Bonus}'),
  ('cccc3333-3333-3333-3333-333333333333','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','AI Engineer','Kuala Lumpur, MY',105000,150000,'Hybrid','{AI,"Machine Learning",Engineering}','$125K','{Equity,Medical,"Learning Budget"}'),
  ('cccc4444-4444-4444-4444-444444444444','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Corporate Strategy Manager','Kuala Lumpur, MY',115000,155000,'Full-time','{Strategy,Corporate,Leadership}','$130K','{Bonus,Medical,Pension}'),
  ('cccc5555-5555-5555-5555-555555555555','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Finance Business Partner','Kuala Lumpur, MY',90000,120000,'Hybrid','{Finance,Corporate,Analytics}','$105K','{Medical,Hybrid,Bonus}'),
  ('cccc6666-6666-6666-6666-666666666666','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Human Resources Manager','Kuala Lumpur, MY',85000,115000,'Hybrid','{"Human Resources",Corporate,People}','$100K','{Medical,Hybrid,Wellness}')
on conflict (id) do nothing;

-- ============================================================================
-- CELCOMDIGI EMPLOYER — fixed demo credentials + company ownership
-- Creates a login (employer@celcomdigi.com / CelcomDigi123!) and makes it the
-- owner of the seeded CelcomDigi company. Ownership is what wires the employer
-- portal's live Hiring board to real data: getMyCompany() and the
-- get_company_matches() RPC both key off `owner_id = auth.uid()`, so once this
-- user owns CelcomDigi they see — and can move through the pipeline — every
-- candidate that mutually matches CelcomDigi's role, in real time.
--
-- Seeding an auth user from SQL: GoTrue authenticates against auth.users, so we
-- insert a bcrypt-hashed password (pgcrypto) with email already confirmed, plus
-- the matching auth.identities row the email provider needs. Guarded to run once
-- and wrapped so a plain (non-Supabase) Postgres without an auth schema is a
-- no-op rather than an error.
-- ============================================================================
create extension if not exists pgcrypto;

do $$
declare
  emp_id uuid;
begin
  -- Reuse the existing login if this seed has already run.
  select id into emp_id from auth.users where email = 'employer@celcomdigi.com';

  if emp_id is null then
    emp_id := uuid_generate_v4();

    -- The token columns must be '' (not NULL): GoTrue scans them into non-null
    -- Go strings on every login, so a NULL there makes sign-in 500 with
    -- "Database error querying schema" (which the JS client surfaces as `{}`).
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token,
      email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', emp_id, 'authenticated', 'authenticated',
      'employer@celcomdigi.com', crypt('CelcomDigi123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"CelcomDigi Talent"}'::jsonb,
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), emp_id, emp_id::text,
      jsonb_build_object('sub', emp_id::text, 'email', 'employer@celcomdigi.com'),
      'email', now(), now(), now()
    );
  else
    -- Repair a row from an earlier seed that left the token columns NULL (the
    -- cause of the login 500). Also re-assert the password/confirmation so the
    -- fixed credentials are guaranteed to work after a re-run.
    update auth.users set
      encrypted_password     = crypt('CelcomDigi123!', gen_salt('bf')),
      email_confirmed_at     = coalesce(email_confirmed_at, now()),
      confirmation_token     = coalesce(confirmation_token, ''),
      recovery_token         = coalesce(recovery_token, ''),
      email_change           = coalesce(email_change, ''),
      email_change_token_new = coalesce(email_change_token_new, '')
    where id = emp_id;

    -- Ensure the email identity exists (older seeds that failed mid-block may
    -- have rolled it back).
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    )
    select gen_random_uuid(), emp_id, emp_id::text,
           jsonb_build_object('sub', emp_id::text, 'email', 'employer@celcomdigi.com'),
           'email', now(), now(), now()
    where not exists (
      select 1 from auth.identities
      where provider = 'email' and provider_id = emp_id::text
    );
  end if;

  -- Hand CelcomDigi to this employer so the live board resolves to it.
  update companies
     set owner_id = emp_id
   where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
exception when undefined_table then
  -- No auth schema (plain Postgres) — nothing to seed.
  raise notice 'auth schema not present; skipped CelcomDigi employer seed';
end $$;

-- ============================================================================
-- REALTIME — stream row changes to subscribed clients. The mobile app listens
-- on `connections` (live Requests badge when someone adds you) and `messages`
-- (live chat); the employer web board listens on `matches` so a new mutual
-- match with CelcomDigi shows up on the Hiring pipeline instantly. RLS still
-- applies, so each client only receives rows it may read. Guarded so re-running
-- the script (or a non-Supabase Postgres) is a no-op.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'connections'
  ) then
    alter publication supabase_realtime add table connections;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table matches;
  end if;
exception when undefined_object then
  -- No supabase_realtime publication (plain Postgres) — nothing to enable.
  null;
end $$;

-- ============================================================================
-- Refresh the PostgREST schema cache so the API reflects any DDL above (new
-- columns/tables/functions) immediately, instead of waiting on an auto-reload.
-- ============================================================================
notify pgrst, 'reload schema';
