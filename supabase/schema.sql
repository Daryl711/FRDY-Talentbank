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
  initials      text generated always as (upper(left(name,1))) stored,
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

-- Avatar initials are just the first letter now (was first-name-initial +
-- first-letter-of-second-word, e.g. "James Harmon" -> "JH"). Generated
-- columns can't have their expression altered in place, so drop and re-add —
-- `stored` recomputes it for every existing row from `name`, no data lost.
-- connections_view (defined further down) selects this column, so Postgres
-- won't drop it without dropping the view first; the view is re-created
-- later in this script (`create or replace view connections_view`), so
-- dropping it here is safe and doesn't need CASCADE.
drop view if exists connections_view;
alter table profiles drop column if exists initials;
alter table profiles add column initials text generated always as (upper(left(name,1))) stored;

-- Backfill columns onto profiles tables created before this column existed.
-- `create table if not exists` above is a no-op on an existing table, so new
-- columns must be added explicitly for the app's profile edits to persist.
alter table profiles add column if not exists experience jsonb default '[]';
-- Education history [{id,school,degree,grade,dates}] — universities + grades the
-- candidate fills in on their profile.
alter table profiles add column if not exists education jsonb default '[]';
-- Animal Persona quiz result (onboarding). animal_trait feeds the employer
-- dashboard's "Animal Trait" column; animal_scores keeps the full breakdown.
alter table profiles add column if not exists animal_trait text;
alter table profiles add column if not exists animal_scores jsonb default '{}';
-- Notification preferences (Settings > Notifications).
alter table profiles add column if not exists notif_matches boolean default true;
alter table profiles add column if not exists notif_messages boolean default true;
alter table profiles add column if not exists notif_updates boolean default true;
-- Whether companies see full profile details (About/Skills/Experience/Education)
-- once matched (Settings > Privacy & Visibility); name/headline/location still show.
alter table profiles add column if not exists profile_visible boolean default true;
-- True only for the 500 synthetic candidates from supabase/seed_demo_data.sql.
-- Lets get_candidate_trajectories() (Trajectory page search) show real,
-- self-created candidates instead of the seeded demo set.
alter table profiles add column if not exists is_demo boolean not null default false;

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

-- Access status for self-serve employer sign-ups. Instant self-serve grants
-- 'approved' on creation; kept as a column so an approval gate can be layered on
-- later without a migration. Existing/seeded companies default to 'approved'.
alter table companies add column if not exists status text default 'approved';

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

-- Richer job-posting detail employers fill in on "Post New Role" (see the
-- LiveRoleForm). Added as nullable columns so pre-existing roles stay valid.
-- responsibilities / requirements are bullet lists; description is free text.
alter table roles add column if not exists description      text;
alter table roles add column if not exists responsibilities text[] default '{}';
alter table roles add column if not exists requirements     text[] default '{}';
alter table roles add column if not exists experience_level text;   -- 'Entry' | 'Mid' | 'Senior' | 'Lead'
alter table roles add column if not exists education        text;   -- e.g. "Bachelor's degree"

-- Lets an employer save a "Post New Role" draft without it going live to
-- candidates. 'Active' | 'Draft' | 'Closed'; existing roles default to Active
-- so nothing already-posted disappears from the swipe deck.
alter table roles add column if not exists status text not null default 'Active';

-- Convenience view joining roles + company info. Dropped first: the new role
-- columns above change what `r.*` expands to, and create-or-replace can't insert
-- columns mid-list. Nothing depends on this view, so a drop is safe.
drop view if exists roles_with_company;
create view roles_with_company as
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

-- Per-application salary the candidate fills in on the job card when they match
-- (right-swipe). Nullable — candidates may leave them blank.
alter table swipes add column if not exists expected_salary   int;
alter table swipes add column if not exists last_drawn_salary int;

-- ----------------------------------------------------------------------------
-- MATCHES — created when both sides swipe right (mutual)
-- ----------------------------------------------------------------------------
create table if not exists matches (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid not null references companies(id) on delete cascade,
  score       int,
  -- Hiring pipeline stage the employer moves the matched candidate through:
  -- Applied -> Screening -> Shortlisted -> Interview -> Final Round -> Offer -> Hired (or Rejected)
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
-- MATCH STAGE HISTORY — timestamped log of every hiring-stage transition, so a
-- candidate can see *when* their application reached Screening / Interview /
-- Offer, not just the current stage. Seeded on match creation, appended
-- whenever an employer moves matches.stage (see triggers below).
-- ----------------------------------------------------------------------------
create table if not exists match_stage_history (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid not null references matches(id) on delete cascade,
  stage      text not null,
  created_at timestamptz default now()
);
create index if not exists match_stage_history_match_idx on match_stage_history(match_id, created_at);

alter table match_stage_history enable row level security;

drop policy if exists "stage history candidate read" on match_stage_history;
create policy "stage history candidate read" on match_stage_history for select
  using (match_id in (select id from matches where user_id = auth.uid()));

drop policy if exists "stage history employer read" on match_stage_history;
create policy "stage history employer read" on match_stage_history for select
  using (match_id in (
    select id from matches where company_id in (select id from companies where owner_id = auth.uid())
  ));

create or replace function log_match_stage_seed() returns trigger as $$
begin
  insert into match_stage_history(match_id, stage, created_at) values (new.id, new.stage, new.created_at);
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists trg_match_stage_seed on matches;
create trigger trg_match_stage_seed after insert on matches
  for each row execute function log_match_stage_seed();

create or replace function log_match_stage_change() returns trigger as $$
begin
  if new.stage is distinct from old.stage then
    insert into match_stage_history(match_id, stage, created_at) values (new.id, new.stage, now());
  end if;
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists trg_match_stage_change on matches;
create trigger trg_match_stage_change after update on matches
  for each row execute function log_match_stage_change();

-- Backfill history for matches rows that predate the triggers above.
insert into match_stage_history(match_id, stage, created_at)
select m.id, m.stage, m.created_at
from matches m
where not exists (select 1 from match_stage_history h where h.match_id = m.id);

-- ----------------------------------------------------------------------------
-- INTERVIEWS — details an employer sets when moving a candidate from
-- Shortlisted to Interview: when, how (mode), and where (venue/link/number).
-- One row per match; scheduling again (a reschedule) just updates it in place,
-- so there's no history of past times — only the current appointment.
-- ----------------------------------------------------------------------------
create table if not exists interviews (
  id           uuid primary key default uuid_generate_v4(),
  match_id     uuid not null references matches(id) on delete cascade unique,
  scheduled_at timestamptz not null,
  mode         text not null default 'In-Person', -- 'In-Person' | 'Video Call' | 'Phone Call'
  location     text, -- venue address, meeting link, or phone number depending on mode
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table interviews enable row level security;

drop policy if exists "interviews read" on interviews;
create policy "interviews read" on interviews for select to authenticated
  using (
    match_id in (select id from matches where user_id = auth.uid())
    or match_id in (
      select id from matches where company_id in (select id from companies where owner_id = auth.uid())
    )
  );

drop policy if exists "interviews manage" on interviews;
create policy "interviews manage" on interviews for all to authenticated
  using (match_id in (
    select id from matches where company_id in (select id from companies where owner_id = auth.uid())
  ))
  with check (match_id in (
    select id from matches where company_id in (select id from companies where owner_id = auth.uid())
  ));

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
-- NOTIFICATIONS — one row per event a user should be told about: a message
-- (from a connection or a company chat), a connection request/acceptance, a
-- new match, or a hiring-stage change on one of their applications. Populated
-- entirely by triggers on messages/connections/matches below — nothing
-- inserts here directly except those triggers (see RLS: no insert policy for
-- authenticated users). `link` is the route the client opens on click.
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,   -- 'message' | 'connection_request' | 'connection_accepted' | 'match' | 'stage_change'
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz default now()
);
create index if not exists notifications_user_created_idx on notifications(user_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists "notifications read" on notifications;
create policy "notifications read" on notifications for select to authenticated
  using (user_id = auth.uid());

-- Lets the client mark its own notifications read directly (update read_at)
-- without needing an RPC — inserts still only ever come from the triggers below.
drop policy if exists "notifications mark read" on notifications;
create policy "notifications mark read" on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- New message (connection DM or company-match chat) -> notify the other side.
-- Gated on notif_messages (Settings > Notifications > "Messages").
create or replace function notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_sender    text;
  v_wants     boolean;
begin
  if new.connection_id is not null then
    select case when requester_id = new.sender_id then addressee_id else requester_id end
      into v_recipient
    from connections where id = new.connection_id;
  elsif new.match_id is not null then
    select case when m.user_id = new.sender_id then c.owner_id else m.user_id end
      into v_recipient
    from matches m join companies c on c.id = m.company_id
    where m.id = new.match_id;
  end if;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  select coalesce(notif_messages, true) into v_wants from profiles where id = v_recipient;
  if not coalesce(v_wants, true) then
    return new;
  end if;

  select coalesce(nullif(name, ''), 'Someone') into v_sender from profiles where id = new.sender_id;

  insert into notifications (user_id, kind, title, body, link) values (
    v_recipient, 'message', v_sender || ' sent you a message', left(new.body, 140),
    case when new.connection_id is not null then '/candidate/connect' else '/candidate/applications' end
  );
  return new;
exception when others then
  raise warning 'notify_new_message failed: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists on_message_notify on messages;
create trigger on_message_notify after insert on messages
  for each row execute function notify_new_message();

-- Connection requested / accepted -> notify the other side. Not gated by any
-- preference toggle (there's no dedicated "connections" category) so these
-- always fire.
create or replace function notify_connection_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if TG_OP = 'INSERT' then
    select coalesce(nullif(name, ''), 'Someone') into v_name from profiles where id = new.requester_id;
    insert into notifications (user_id, kind, title, link) values (
      new.addressee_id, 'connection_request', v_name || ' wants to connect', '/candidate/connect'
    );
  elsif TG_OP = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted' then
    select coalesce(nullif(name, ''), 'Someone') into v_name from profiles where id = new.addressee_id;
    insert into notifications (user_id, kind, title, link) values (
      new.requester_id, 'connection_accepted', v_name || ' accepted your connection request', '/candidate/connect'
    );
  end if;
  return new;
exception when others then
  raise warning 'notify_connection_event failed: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists on_connection_notify on connections;
create trigger on_connection_notify after insert or update of status on connections
  for each row execute function notify_connection_event();

-- New match (a job application was accepted into a company's pipeline) and
-- hiring-stage changes (Screening/Shortlisted/Interview/.../Hired/Rejected)
-- -> notify the candidate. Gated on notif_matches (Settings > Notifications >
-- "New matches" — "A company matches with you or your application advances a
-- stage.").
create or replace function notify_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company text;
  v_wants   boolean;
begin
  select coalesce(notif_matches, true) into v_wants from profiles where id = new.user_id;
  if not coalesce(v_wants, true) then
    return new;
  end if;

  select coalesce(nullif(name, ''), 'A company') into v_company from companies where id = new.company_id;

  if TG_OP = 'INSERT' then
    insert into notifications (user_id, kind, title, body, link) values (
      new.user_id, 'match', 'You matched with ' || v_company, 'Your application is now in their pipeline.', '/candidate/applications'
    );
  elsif TG_OP = 'UPDATE' and new.stage is distinct from old.stage then
    insert into notifications (user_id, kind, title, link) values (
      new.user_id, 'stage_change', v_company || ' moved your application to ' || new.stage, '/candidate/applications'
    );
  end if;
  return new;
exception when others then
  raise warning 'notify_match_event failed: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists on_match_notify on matches;
create trigger on_match_notify after insert or update of stage on matches
  for each row execute function notify_match_event();

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

-- ----------------------------------------------------------------------------
-- CANDIDATE TRAJECTORIES — one row per candidate: a career-path prediction
-- (target role/salary, confidence, readiness-over-time, ranked next roles,
-- skills gap). Powers the Trajectory page shown to both employer and
-- university viewers (apps/web/app/employer/trajectory, .../university/trajectory).
-- There's no real ML model behind this yet. The 500 seeded demo candidates
-- (supabase/seed_demo_data.sql) get theirs from a rich family/ladder
-- generator; real, self-created candidates get theirs from the simpler
-- generate_candidate_trajectory() trigger below, keyed off their own
-- headline/years_exp/skills and regenerated whenever those change.
-- ----------------------------------------------------------------------------
create table if not exists candidate_trajectories (
  id             uuid primary key default uuid_generate_v4(),
  profile_id     uuid not null unique references profiles(id) on delete cascade,
  current_salary text not null,
  arrow_target   text not null,
  target_role    text not null,
  target_salary  text not null,
  confidence     int not null,
  horizon_months int not null,
  trajectory     jsonb not null,  -- [{label, value}] readiness over time
  next_roles     jsonb not null,  -- [{role, context, pct}] ranked predictions
  skills         jsonb not null,  -- [{name, current, required}] skills gap
  created_at     timestamptz default now()
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
-- Return signature changed (added the detail columns), so drop the old function
-- first — create-or-replace can't alter a function's OUT columns.
drop function if exists get_swipe_deck();
create or replace function get_swipe_deck()
returns table (
  id uuid, initials text, name text, role text, location text,
  employees text, match int, tags text[], package text, perks text[],
  description text, responsibilities text[], requirements text[],
  experience_level text, education text
) language sql security definer as $$
  select
    r.id, c.initials, c.name, r.title as role,
    coalesce(r.location, c.location) as location, c.employees,
    coalesce(round((1 - (c.embedding <=> (
      select embedding from profiles where id = auth.uid()
    ))) * 100)::int, 75) as match,
    coalesce(r.tags, '{}') as tags, r.package, coalesce(r.perks, '{}') as perks,
    r.description, coalesce(r.responsibilities, '{}') as responsibilities,
    coalesce(r.requirements, '{}') as requirements, r.experience_level, r.education
  from roles r
  join companies c on c.id = r.company_id
  where r.status = 'Active'
    and r.id not in (
    select target_id from swipes
    where user_id = auth.uid() and target_type::text = 'role'
  )
  order by match desc, r.created_at desc
  limit 30;
$$;

-- ============================================================================
-- EMPLOYER: matched candidates for the caller's company (Hiring page board)
-- Joins matches -> profiles (matches.user_id FKs auth.users, not profiles, so
-- PostgREST can't auto-embed — hence an RPC). `role` is the job title the
-- candidate applied to (matches.role_id -> roles.title), so the board can show
-- which opening each candidate matched. Only returns rows for owned companies.
-- animal_scores rides along so the employer's Animal Traits page can render a
-- real per-candidate radar breakdown instead of only the headline trait.
-- Return signature changed (added role, then animal_scores), so drop the old
-- function first.
-- ============================================================================
drop function if exists get_company_matches();
create or replace function get_company_matches()
returns table (
  match_id uuid, candidate_id uuid, name text, initials text,
  trait text, score int, stage text, headline text, role text, created_at timestamptz,
  animal_scores jsonb
) language sql security definer as $$
  select
    m.id, p.id, p.name, p.initials,
    p.animal_trait, m.score, m.stage, p.headline, r.title as role, m.created_at,
    p.animal_scores
  from matches m
  join profiles p on p.id = m.user_id
  left join roles r on r.id = m.role_id
  where m.company_id in (select id from companies where owner_id = auth.uid())
  order by m.created_at desc;
$$;

-- ============================================================================
-- EMPLOYER + UNIVERSITY: career-path predictions for the Trajectory page.
-- Paginated + searchable so it stays usable against hundreds of candidates.
-- Excludes candidates who opted out of employer visibility (profile_visible)
-- and the synthetic candidates from supabase/seed_demo_data.sql (is_demo) —
-- so this only ever surfaces real, self-created candidates.
-- `total_count` (a window function) rides along so the client can paginate
-- without a second round trip.
-- ============================================================================
create or replace function get_candidate_trajectories(
  p_search text default null,
  p_limit  int  default 20,
  p_offset int  default 0
)
returns table (
  id             uuid,
  name           text,
  initials       text,
  animal_trait   text,
  headline       text,
  years_exp      int,
  current_salary text,
  arrow_target   text,
  target_role    text,
  target_salary  text,
  confidence     int,
  horizon_months int,
  trajectory     jsonb,
  next_roles     jsonb,
  skills         jsonb,
  total_count    bigint
) language sql security definer as $$
  select
    p.id, p.name, p.initials, p.animal_trait, p.headline, p.years_exp,
    ct.current_salary, ct.arrow_target, ct.target_role, ct.target_salary,
    ct.confidence, ct.horizon_months, ct.trajectory, ct.next_roles, ct.skills,
    count(*) over() as total_count
  from candidate_trajectories ct
  join profiles p on p.id = ct.profile_id
  where coalesce(p.profile_visible, true)
    and not coalesce(p.is_demo, false)
    and (
      p_search is null or btrim(p_search) = '' or
      p.name ilike '%' || p_search || '%' or
      p.headline ilike '%' || p_search || '%'
    )
  order by p.name asc
  limit p_limit offset p_offset;
$$;

-- ============================================================================
-- UNIVERSITY: candidates who list this school in their education history —
-- powers the university Dashboard/Animal Traits/Employability/Course
-- Preferences pages with real data instead of the static demo arrays.
-- education is a jsonb array ([{school,degree,grade,dates}, ...]), so this
-- unnests it per profile to match on school name (substring, case-
-- insensitive — "University of Malaya" and "Universiti Malaya" both refer to
-- the same institution and both appear in seeded data). Unlike
-- get_candidate_trajectories (which excludes the seeded demo pool so the
-- Trajectory search only shows real self-created candidates), this
-- deliberately includes is_demo candidates — for this prototype they *are*
-- "our students," and excluding them would leave the university portal
-- almost empty. Left-joins candidate_trajectories since a candidate may not
-- have a prediction yet.
-- ============================================================================
create or replace function get_university_candidates(p_school text default 'Malaya')
returns table (
  id             uuid,
  name           text,
  initials       text,
  headline       text,
  years_exp      int,
  animal_trait   text,
  animal_scores  jsonb,
  education      jsonb,
  skills         text[],
  confidence     int,
  current_salary text,
  target_salary  text,
  horizon_months int
) language sql security definer as $$
  select
    p.id, p.name, p.initials, p.headline, p.years_exp,
    p.animal_trait, p.animal_scores, p.education, p.skills,
    ct.confidence, ct.current_salary, ct.target_salary, ct.horizon_months
  from profiles p
  left join candidate_trajectories ct on ct.profile_id = p.id
  where p.user_type = 'individual'
    and coalesce(p.profile_visible, true)
    and exists (
      select 1 from jsonb_array_elements(coalesce(p.education, '[]'::jsonb)) e
      where (e ->> 'school') ilike '%' || p_school || '%'
    );
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
-- mutual match. `match_id` is the matches row for that company (one per
-- candidate+company) — the thread the candidate messages the employer on.
-- `expected_salary`/`last_drawn_salary` are the figures the candidate submitted
-- with this specific application (swipes.expected_salary/last_drawn_salary).
-- `hire_stage` is the employer's live pipeline stage (matches.stage); the
-- *_at columns are when the candidate's match_stage_history first reached the
-- underlying stage(s) for that step, powering the per-status date the app
-- shows under Applied/Under Review/Interview/Offer. A left join is safe here
-- (matches has a unique(user_id, company_id)), so it can replace the old
-- correlated-subquery matched/match_id lookups.
-- Return signature changed (added stage + date columns), so drop the old
-- function first: create-or-replace can't alter a function's OUT columns.
drop function if exists get_my_submitted_jobs();
create or replace function get_my_submitted_jobs()
returns table (
  id uuid, initials text, name text, role text, location text,
  employees text, match int, matched boolean, match_id uuid, created_at timestamptz,
  expected_salary int, last_drawn_salary int, hire_stage text,
  review_at timestamptz, interview_at timestamptz, offer_at timestamptz
) language sql security definer as $$
  select
    r.id, c.initials, c.name, r.title as role,
    coalesce(r.location, c.location) as location, c.employees,
    coalesce(round((1 - (c.embedding <=> (
      select embedding from profiles where id = auth.uid()
    ))) * 100)::int, 75) as match,
    (m.id is not null) as matched,
    m.id as match_id,
    s.created_at,
    s.expected_salary, s.last_drawn_salary,
    m.stage as hire_stage,
    (select min(h.created_at) from match_stage_history h where h.match_id = m.id and h.stage in ('Screening', 'Shortlisted')) as review_at,
    (select min(h.created_at) from match_stage_history h where h.match_id = m.id and h.stage in ('Interview', 'Final Round')) as interview_at,
    (select min(h.created_at) from match_stage_history h where h.match_id = m.id and h.stage in ('Offer', 'Hired')) as offer_at
  from swipes s
  join roles r on r.id = s.target_id
  join companies c on c.id = r.company_id
  left join matches m on m.user_id = auth.uid() and m.company_id = c.id
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
alter table candidate_trajectories enable row level security;

-- Policies are dropped first so this whole script can be re-run safely
-- (create policy is not idempotent and errors if the policy already exists).

-- profiles: anyone signed in can read; you edit only your own
drop policy if exists "profiles read"   on profiles;
create policy "profiles read"   on profiles for select to authenticated using (true);
drop policy if exists "profiles write"  on profiles;
create policy "profiles write"  on profiles for update to authenticated using (auth.uid() = id);
drop policy if exists "profiles insert" on profiles;
create policy "profiles insert" on profiles for insert to authenticated with check (auth.uid() = id);

-- candidate trajectories: readable by all signed-in users (employer + university
-- viewers), same openness as "profiles read" above; not directly writable —
-- rows come from the seed/generation script only.
drop policy if exists "candidate trajectories read" on candidate_trajectories;
create policy "candidate trajectories read" on candidate_trajectories for select to authenticated using (true);

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
-- connection the message belongs to. On a company match the two participants
-- are the candidate (matches.user_id) AND the employer who owns the company
-- (companies.owner_id) — so both can read the thread and message each other.
drop policy if exists "messages read" on messages;
create policy "messages read" on messages for select to authenticated
  using (
    exists (
      select 1 from matches m
      join companies co on co.id = m.company_id
      where m.id = match_id
        and (m.user_id = auth.uid() or co.owner_id = auth.uid())
    )
    or exists (
      select 1 from connections c
      where c.id = connection_id and auth.uid() in (c.requester_id, c.addressee_id)
    )
  );
-- Send: the sender must be a participant of the thread. For a company-match
-- message that's the candidate or the company owner; for a peer DM it's either
-- side of the connection. (Previously any authenticated user could insert a
-- match message as long as they set sender_id to themselves — this closes that.)
drop policy if exists "messages send" on messages;
create policy "messages send" on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      (match_id is not null and exists (
        select 1 from matches m
        join companies co on co.id = m.company_id
        where m.id = match_id
          and (m.user_id = auth.uid() or co.owner_id = auth.uid())
      ))
      or (connection_id is not null and exists (
        select 1 from connections c
        where c.id = connection_id and auth.uid() in (c.requester_id, c.addressee_id)
      ))
    )
  );

-- resumes: private to the owner …
drop policy if exists "resumes own" on resumes;
create policy "resumes own" on resumes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- … but an employer may READ the resume metadata of any candidate matched to a
-- company they own, so the Hiring board can show applicants' resumes. Permissive
-- policies are OR'd, so "resumes own" above still fully covers the candidate.
drop policy if exists "resumes employer read" on resumes;
create policy "resumes employer read" on resumes for select to authenticated
  using (exists (
    select 1 from matches m
    join companies co on co.id = m.company_id
    where m.user_id = resumes.user_id and co.owner_id = auth.uid()
  ));

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

-- Employers may READ (list + download) the resume and cover-letter files of any
-- candidate matched to a company they own. The folder's first segment is the
-- candidate's uid (`${uid}/…` and `${uid}/cover-letters/…`), so this covers both.
drop policy if exists "resume files employer read" on storage.objects;
create policy "resume files employer read" on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and exists (
      select 1 from matches m
      join companies co on co.id = m.company_id
      where co.owner_id = auth.uid()
        and (storage.foldername(name))[1] = m.user_id::text
    )
  );

-- ============================================================================
-- AUTO-CREATE A PROFILE ROW ON SIGN-UP
-- ============================================================================
-- Seeds the profile row on sign-up. Employer sign-ups pass user_type='company'
-- plus company_name / company_size in raw_user_meta_data (see signUpEmployer):
-- for those we also mark the profile as a company AND provision the company they
-- own, so they land straight on a live Hiring board. Instant self-serve, so the
-- company is created 'approved'. Candidates omit user_type and default to
-- 'individual' with no company.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public          -- so the unqualified tables below resolve
as $$
declare
  v_name    text := coalesce(nullif(new.raw_user_meta_data->>'name',''), 'New User');
  v_type    text := coalesce(nullif(new.raw_user_meta_data->>'user_type',''), 'individual');
  v_company text := nullif(new.raw_user_meta_data->>'company_name','');
  v_size    text := nullif(new.raw_user_meta_data->>'company_size','');
  v_stage   text := case v_size
                      when '1-10'   then 'Startup'
                      when '11-50'  then 'Small'
                      when '51-200' then 'Scale-up'
                      when '200+'   then 'Established'
                      else null end;
begin
  insert into public.profiles (id, name, user_type)
  values (new.id, v_name, v_type::user_type)
  on conflict (id) do nothing;

  -- Provision the employer's company from the sign-up metadata.
  if v_type = 'company' and v_company is not null then
    insert into public.companies (owner_id, name, size, stage, status)
    values (new.id, v_company, v_size, v_stage, 'approved');
  end if;

  return new;
exception when others then
  -- Never let a profile/company hiccup abort the auth sign-up itself.
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- AUTO-GENERATE A TRAJECTORY PREDICTION FOR REAL CANDIDATES
-- ============================================================================
-- The 500 seeded candidates (supabase/seed_demo_data.sql) get their
-- candidate_trajectories row from a rich family/ladder generator keyed off an
-- assigned career track. Real candidates have no such track, so this derives
-- an equivalent prediction from a generic seniority ladder instead: years of
-- experience (and any seniority prefix already in the headline) decide how
-- many rungs up that ladder the *next* role prediction sits, and confidence
-- blends experience with how complete the profile reads (skills, bio, logged
-- work history) — so editing the profile visibly moves the prediction, the
-- way a real predictive model would react to new signal, not a fixed
-- per-tier constant. Regenerates on every relevant edit. Demo profiles are
-- skipped (is_demo) so this never clobbers the seed script's richer data.
--
-- The Animal Persona quiz (lib/persona.ts) is now compulsory before a
-- candidate ever reaches the main app (OnboardingGate), so animal_trait is a
-- reliable signal on every real candidate by the time this fires — factored
-- in as a small confidence/horizon adjustment per archetype (e.g. Lion/
-- Eagle/Wolf read as leadership-ready — higher confidence, shorter horizon;
-- Ant/Horse read as steady/methodical — smaller boost, slightly longer).
create or replace function generate_candidate_trajectory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Index 1 is deliberately '' (no recognized prefix = base tier).
  v_ladder         text[] := array['', 'Senior ', 'Lead ', 'Director of ', 'VP of ', 'Chief '];
  v_headline       text := coalesce(nullif(trim(new.headline), ''), 'Professional');
  v_base_role      text := coalesce(nullif(trim(new.headline), ''), 'Professional');
  v_current_tier   int := 0;
  v_years_tier     int;
  v_eff_tier       int;
  v_years          int  := coalesce(new.years_exp, 0);
  v_skills         text[] := coalesce(new.skills, '{}');
  v_skill_count    int := coalesce(array_length(v_skills, 1), 0);
  v_exp_count      int := jsonb_array_length(coalesce(new.experience, '[]'::jsonb));
  v_has_about      boolean := nullif(trim(coalesce(new.about, '')), '') is not null;
  -- Per-archetype confidence/horizon nudge (see lib/persona.ts ANIMALS for the
  -- full description of each trait). Leadership/vision-flavored traits read as
  -- more advancement-ready; steady/methodical ones get a smaller, slower boost.
  v_trait_conf_adj int := case new.animal_trait
    when 'Lion'    then 5   when 'Eagle'  then 4   when 'Wolf'   then 4
    when 'Cheetah' then 4   when 'Peacock' then 3  when 'Owl'    then 3
    when 'Fox'     then 3   when 'Dolphin' then 2  when 'Octopus' then 2
    when 'Elephant' then 2  when 'Ant'    then 2   when 'Horse'  then 1
    else 0
  end;
  v_trait_horizon_adj int := case new.animal_trait
    when 'Cheetah' then -3  when 'Lion'   then -2  when 'Peacock' then -1
    when 'Eagle'   then -1  when 'Wolf'   then -1  when 'Octopus' then -1
    when 'Elephant' then 1  when 'Ant'    then 1   when 'Horse'  then 1
    else 0
  end;
  v_confidence     int;
  v_horizon        int;
  v_base           int;
  v_step           int;
  v_current_salary int;
  v_target_salary  int;
  v_target_role    text;
  v_next_role      text;
  v_trajectory     jsonb;
  v_next_roles     jsonb;
  v_skills_gap     jsonb;
  i int;
begin
  if new.user_type <> 'individual' or coalesce(new.is_demo, false) then
    return new;
  end if;

  -- Strip a recognized seniority prefix off the headline (longest/most-senior
  -- first) so the ladder always climbs from the candidate's actual base role
  -- — e.g. "Lead Designer" -> base "Designer", current tier 2.
  for i in reverse array_upper(v_ladder, 1)..2 loop
    if v_headline ilike v_ladder[i] || '%' then
      v_base_role := regexp_replace(v_headline, '^' || v_ladder[i], '', 'i');
      v_current_tier := i - 1;
      exit;
    end if;
  end loop;

  -- Years of experience predicts a tier too; take whichever signal points
  -- further up the ladder so the prediction never reads as a step down.
  v_years_tier := case
    when v_years >= 15 then 4
    when v_years >= 10 then 3
    when v_years >= 6  then 2
    when v_years >= 3  then 1
    else 0
  end;
  v_eff_tier := greatest(v_current_tier, v_years_tier);
  v_target_role := v_ladder[least(6, v_eff_tier + 2)] || v_base_role;
  v_next_role   := v_ladder[least(6, v_eff_tier + 3)] || v_base_role;

  -- Confidence blends experience with profile completeness — more skills, a
  -- written bio, and logged work history all read as more signal to predict
  -- from, not just a flat constant per tier.
  v_confidence := least(97, 48
    + least(24, v_years * 2)
    + least(16, v_skill_count * 2)
    + least(9, v_exp_count * 3)
    + (case when v_has_about then 5 else 0 end)
    + v_trait_conf_adj);
  v_horizon := greatest(6, 26 - v_years * 2 + v_trait_horizon_adj);

  v_current_salary := 42000 + v_years * 6000 + least(20000, v_skill_count * 1500);
  v_target_salary := v_current_salary + 18000 + v_years * 3000;

  v_base := greatest(40, v_confidence - 28);
  v_step := greatest(1, (v_confidence - v_base) / 4);
  v_trajectory := jsonb_build_array(
    jsonb_build_object('label', 'Now', 'value', v_base),
    jsonb_build_object('label', '6mo', 'value', least(99, v_base + v_step)),
    jsonb_build_object('label', '12mo', 'value', least(99, v_base + v_step * 2)),
    jsonb_build_object('label', '18mo', 'value', least(99, v_base + v_step * 3)),
    jsonb_build_object('label', '24mo', 'value', least(99, v_confidence))
  );

  v_next_roles := jsonb_build_array(
    jsonb_build_object('role', v_target_role, 'context', 'Based on your profile', 'pct', v_confidence),
    jsonb_build_object('role', v_next_role, 'context', 'Longer horizon', 'pct', greatest(15, v_confidence - 30)),
    jsonb_build_object(
      'role', v_base_role, 'pct', greatest(10, v_confidence - 45),
      'context', case when new.animal_trait is not null then 'Matches your ' || new.animal_trait || ' profile' else 'Lateral move' end
    )
  );

  v_skills_gap := '[]'::jsonb;
  for i in 1..least(4, v_skill_count) loop
    v_skills_gap := v_skills_gap || jsonb_build_array(jsonb_build_object(
      'name', v_skills[i],
      'current', greatest(35, 90 - i * 12),
      'required', least(96, 60 + v_eff_tier * 9 + i * 3)
    ));
  end loop;
  if jsonb_array_length(v_skills_gap) = 0 then
    v_skills_gap := jsonb_build_array(jsonb_build_object('name', 'Core Skills', 'current', 45, 'required', 60 + v_eff_tier * 9));
  end if;

  insert into candidate_trajectories (
    profile_id, current_salary, arrow_target, target_role, target_salary,
    confidence, horizon_months, trajectory, next_roles, skills
  ) values (
    new.id,
    '$' || round(v_current_salary / 1000.0)::text || 'K',
    coalesce((regexp_match(v_target_role, '(\S+)$'))[1], v_target_role),
    v_target_role,
    '$' || round(v_target_salary / 1000.0)::text || 'K',
    v_confidence, v_horizon, v_trajectory, v_next_roles, v_skills_gap
  )
  on conflict (profile_id) do update set
    current_salary = excluded.current_salary,
    arrow_target   = excluded.arrow_target,
    target_role    = excluded.target_role,
    target_salary  = excluded.target_salary,
    confidence     = excluded.confidence,
    horizon_months = excluded.horizon_months,
    trajectory     = excluded.trajectory,
    next_roles     = excluded.next_roles,
    skills         = excluded.skills;

  return new;
exception when others then
  -- Never let a trajectory hiccup abort the candidate's profile save.
  raise warning 'generate_candidate_trajectory failed: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists on_profile_trajectory on profiles;
create trigger on_profile_trajectory
  after insert or update of headline, years_exp, skills, about, experience, animal_trait on profiles
  for each row execute function generate_candidate_trajectory();

-- Backfill: the trigger above only fires on future inserts/edits, so any real
-- candidate who signed up before this trigger existed still has no
-- candidate_trajectories row. `set headline = headline` is a no-op update that
-- still fires "update of headline", reusing the trigger instead of duplicating
-- its generation logic here.
do $$
begin
  update profiles set headline = headline
  where user_type = 'individual'
    and not coalesce(is_demo, false)
    and id not in (select profile_id from candidate_trajectories);
exception when undefined_table then
  raise notice 'profiles/candidate_trajectories not present; skipped trajectory backfill';
end $$;

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
-- UNIVERSITI MALAYA — fixed demo credentials
-- Creates a login (admin@um.edu.my / UniversitiMalaya123!) for the university
-- portal's demo sign-in (apps/web/app/page.tsx DEMO_CREDS.university). Unlike
-- the CelcomDigi employer above, the university dashboard (lib/university.ts)
-- is static demo data, not keyed off this account — so this block only needs
-- to make the login itself succeed, no company/profile wiring required.
-- Same GoTrue quirks apply: bcrypt password via pgcrypto, empty (not NULL)
-- token columns, and a matching auth.identities row for the email provider.
-- ============================================================================
do $$
declare
  uni_id uuid;
begin
  select id into uni_id from auth.users where email = 'admin@um.edu.my';

  if uni_id is null then
    uni_id := uuid_generate_v4();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token,
      email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uni_id, 'authenticated', 'authenticated',
      'admin@um.edu.my', crypt('UniversitiMalaya123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Universiti Malaya Admin"}'::jsonb,
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uni_id, uni_id::text,
      jsonb_build_object('sub', uni_id::text, 'email', 'admin@um.edu.my'),
      'email', now(), now(), now()
    );
  else
    -- Re-assert the password/confirmation so the fixed credentials keep
    -- working after a re-run, same as the CelcomDigi repair path above.
    update auth.users set
      encrypted_password     = crypt('UniversitiMalaya123!', gen_salt('bf')),
      email_confirmed_at     = coalesce(email_confirmed_at, now()),
      confirmation_token     = coalesce(confirmation_token, ''),
      recovery_token         = coalesce(recovery_token, ''),
      email_change           = coalesce(email_change, ''),
      email_change_token_new = coalesce(email_change_token_new, '')
    where id = uni_id;

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    )
    select gen_random_uuid(), uni_id, uni_id::text,
           jsonb_build_object('sub', uni_id::text, 'email', 'admin@um.edu.my'),
           'email', now(), now(), now()
    where not exists (
      select 1 from auth.identities
      where provider = 'email' and provider_id = uni_id::text
    );
  end if;
exception when undefined_table then
  raise notice 'auth schema not present; skipped Universiti Malaya seed';
end $$;

-- ============================================================================
-- REALTIME — stream row changes to subscribed clients. The mobile app listens
-- on `connections` (live Requests badge when someone adds you) and `messages`
-- (live chat); the employer web board listens on `matches` so a new mutual
-- match with CelcomDigi shows up on the Hiring pipeline instantly; the
-- candidate notification bell listens on `notifications` for a live badge and
-- feed. RLS still applies, so each client only receives rows it may read.
-- Guarded so re-running the script (or a non-Supabase Postgres) is a no-op.
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
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
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
