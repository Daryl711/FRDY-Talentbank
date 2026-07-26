-- ============================================================================
-- DEMO DATA GENERATOR — 50 employers + 500 candidates
--
-- Run this ONCE, after schema.sql and seed.sql, in the Supabase SQL Editor.
-- Safe to re-run: every account is looked up by a deterministic email
-- (employer_demo_NNN@example.com / candidate_demo_NNN@example.com) before it's
-- created, so a second run only fills in whatever didn't finish the first time.
--
-- What this creates:
--   - 50 employer logins (employer_demo_001..050@example.com / DemoEmployer123!)
--     each owning one seeded company (supabase/schema.sql `companies`).
--   - 500 candidate logins (candidate_demo_001..500@example.com / DemoCandidate123!)
--     each with a full profile (supabase/schema.sql `profiles`) and a career-path
--     row (`candidate_trajectories`) powering the employer/university Trajectory
--     page (apps/web/app/employer/trajectory, .../university/trajectory).
--
-- Every candidate is assigned a role family + ladder level (Product, Engineering,
-- Design, Data, Marketing, Sales, Finance, Operations, HR, Strategy — 5 rungs
-- each). Skills, experience, education, and the trajectory prediction (target
-- role, confidence, skills gap, next-role odds) are all derived from that same
-- family/level, not independently randomized — so a candidate's "current skills"
-- and "skills gap" are consistent with each other and with their headline.
--
-- Requires the auth schema (a real Supabase project) — no-ops with a notice on
-- plain Postgres, same guard used by the CelcomDigi employer seed in schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 50 EMPLOYERS
-- ----------------------------------------------------------------------------
do $$
declare
  i int;
  v_email text;
  v_id uuid;
  v_company_id uuid;
  adjectives text[] := array['Summit','Meridian','Atlas','Northwind','Beacon','Cobalt','Verdant','Apex','Stratos','Luminary','Vertex','Crestline','Pinnacle','Horizon','Anchor','Foundry','Catalyst','Nimbus','Ridgeline','Wavelength','Sterling','Cascade','Ironwood','Bluepeak','Solstice'];
  suffixes text[] := array['Capital','Ventures','Partners','Group','Labs','Logistics','Digital','Robotics','Analytics','Dynamics'];
  industries text[] := array['Technology','Finance','Healthcare','Retail','Logistics','Telecommunications','Manufacturing','Energy','Media','Education'];
  sizes text[] := array['1-10','11-50','51-200','201-500','501-2000','2000+'];
  culture_pool text[] := array['Remote-friendly','Fast-paced','Collaborative','Data-driven','Mission-driven','Flat hierarchy','Async-first','Customer-obsessed'];
  locations text[] := array['Kuala Lumpur, MY','Singapore, SG','Jakarta, ID','Bangkok, TH','Manila, PH','Ho Chi Minh City, VN','Hong Kong, HK','Sydney, AU','New York, NY','San Francisco, CA','London, UK','Berlin, DE'];
  v_password text := 'DemoEmployer123!';
  v_name text;
  v_industry text;
  v_size text;
  v_stage text;
  v_location text;
  v_employees int;
  v_culture text[];
begin
  for i in 1..50 loop
    v_email := 'employer_demo_' || lpad(i::text, 3, '0') || '@example.com';

    select id into v_id from auth.users where email = v_email;
    if v_id is null then
      v_id := uuid_generate_v4();

      -- Token columns must be '' (not NULL) — GoTrue scans them into non-null Go
      -- strings on login, and a NULL there makes sign-in 500 (see the CelcomDigi
      -- employer seed above for the same fix).
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token,
        email_change, email_change_token_new
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
        v_email, crypt(v_password, gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', 'Demo Employer ' || i),
        '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_id, v_id::text,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email', now(), now(), now()
      );
    end if;

    v_name := adjectives[1 + ((i - 1) * 7) % 25] || ' ' || suffixes[1 + ((i - 1) * 3) % 10];
    v_industry := industries[1 + (i % 10)];
    v_size := sizes[1 + (i % 6)];
    v_stage := case v_size
      when '1-10' then 'Startup' when '11-50' then 'Small'
      when '51-200' then 'Scale-up' else 'Established' end;
    v_location := locations[1 + (i % 12)];
    v_employees := case v_size
      when '1-10' then 3 + (i % 8)
      when '11-50' then 15 + (i % 35)
      when '51-200' then 60 + (i % 140)
      when '201-500' then 210 + (i % 290)
      when '501-2000' then 550 + (i % 1450)
      else 2100 + (i % 8000)
    end;
    select array_agg(tag) into v_culture from (
      select unnest(culture_pool) as tag order by random() limit 3
    ) s;

    -- Deterministic id (namespace uuid_generate_v5) so re-running never inserts
    -- a duplicate company even if the auth.users lookup above ever races.
    v_company_id := uuid_generate_v5(uuid_ns_url(), 'demo-employer-company-' || i);

    insert into companies (id, owner_id, name, industry, size, stage, culture, location, employees, status)
    values (
      v_company_id, v_id, v_name, v_industry, v_size, v_stage, v_culture, v_location,
      to_char(v_employees, 'FM999,999') || ' emp.', 'approved'
    )
    on conflict (id) do nothing;
  end loop;
exception when undefined_table then
  raise notice 'auth schema not present; skipped demo employer seed';
end $$;

-- ----------------------------------------------------------------------------
-- 500 CANDIDATES
--
-- Postgres note: `ladder`/`skills_pool` are declared as one 1-D array PER
-- FAMILY (ladder0..ladder9, skills0..skills9) rather than a single 2-D array.
-- A true 2-D array can't be sliced down to a 1-D row (`arr[i][1:n]` mixes a
-- scalar index with a slice, which reinterprets BOTH dimensions as slices per
-- Postgres's array-slicing rules, silently returning a 1×n 2-D array instead
-- of the 1-D array the rest of this block expects) — so each family gets its
-- own real 1-D array, selected per-candidate via the CASE below.
-- ----------------------------------------------------------------------------
do $$
declare
  i int;
  j int;
  v_email text;
  v_id uuid;
  -- Sizes are coprime primes (31, 29): indexing each pool by `i % size` means
  -- the (first, last) pair only fully repeats every 31*29 = 899 candidates,
  -- so all 500 generated names stay distinct instead of cycling every 30.
  first_names text[] := array['James','Sophia','Marcus','Eleanor','Victoria','Daniel','Priya','Wei','Aisha','Lucas','Mei','Arjun','Isabella','Ethan','Nadia','Omar','Grace','Ravi','Chloe','Hassan','Amara','Felix','Yuki','Zoe','Kai','Layla','Noah','Mira','Diego','Ingrid','Sara'];
  last_names text[] := array['Harmon','Whitfield','Laurent','Chen','Voss','Rahman','Patel','Zhang','Osei','Reyes','Tanaka','Sharma','Novak','Kim','Haddad','Silva','Ibrahim','Nakamura','Fischer','Adeyemi','Larsson','Petrov','Nguyen','Costa','Abara','Lindqvist','Suzuki','Okafor','Moreau'];
  locations text[] := array['Kuala Lumpur, MY','Singapore, SG','Jakarta, ID','Bangkok, TH','Manila, PH','Ho Chi Minh City, VN','Hong Kong, HK','Sydney, AU','New York, NY','San Francisco, CA','London, UK','Berlin, DE'];
  schools text[] := array['National University of Singapore','University of Malaya','Nanyang Technological University','Universiti Teknologi Malaysia','National Taiwan University','University of Hong Kong','University of Melbourne','UC Berkeley','MIT','Imperial College London','Technical University of Munich','Seoul National University'];
  traits text[] := array['Lion','Eagle','Wolf','Owl','Octopus','Elephant','Cheetah','Fox','Ant','Horse','Dolphin','Peacock'];
  contexts text[] := array['Series B–D SaaS','Enterprise Tech','Growth-stage','Startup (2yr+)','Public Company','Scale-up','MNC'];
  family_names text[] := array['Product','Engineering','Design','Data','Marketing','Sales','Finance','Operations','HR','Strategy'];
  degrees text[] := array['BBA, Business Administration','BSc Computer Science','BFA, Design','BSc Statistics','BA, Marketing','BBA, Business Administration','BSc Finance','BSc Industrial Engineering','BA, Human Resources','BA, Economics'];

  -- One ladder + skill pool per family (see note above on why these aren't 2-D).
  ladder0 text[] := array['Associate Product Manager','Product Manager','Senior Product Manager','Director of Product','VP of Product'];
  ladder1 text[] := array['Software Engineer','Senior Software Engineer','Staff Software Engineer','Engineering Manager','VP of Engineering'];
  ladder2 text[] := array['Junior Designer','Product Designer','Senior Product Designer','Design Lead','Head of Design'];
  ladder3 text[] := array['Data Analyst','Data Scientist','Senior Data Scientist','Data Science Manager','Head of Data'];
  ladder4 text[] := array['Marketing Coordinator','Marketing Manager','Senior Marketing Manager','Director of Marketing','VP of Marketing'];
  ladder5 text[] := array['Sales Development Rep','Account Executive','Senior Account Executive','Sales Manager','VP of Sales'];
  ladder6 text[] := array['Financial Analyst','Finance Manager','Senior Finance Manager','Director of Finance','VP of Finance'];
  ladder7 text[] := array['Operations Coordinator','Operations Manager','Senior Operations Manager','Director of Operations','VP of Operations'];
  ladder8 text[] := array['HR Coordinator','HR Business Partner','Senior HRBP','Director of HR','VP of People'];
  ladder9 text[] := array['Strategy Analyst','Strategy Manager','Senior Strategy Manager','Director of Strategy','Chief Strategy Officer'];

  skills0 text[] := array['Roadmapping','User Research','Prioritization','Stakeholder Mgmt','Executive Presence','P&L Management'];
  skills1 text[] := array['Coding','System Design','Code Review','Architecture','Team Scaling','Org Design'];
  skills2 text[] := array['Wireframing','Prototyping','Design Systems','User Testing','Design Leadership','Cross-team Influence'];
  skills3 text[] := array['SQL','Statistics','Experimentation','ML Modeling','Data Strategy','Team Leadership'];
  skills4 text[] := array['Copywriting','Campaign Mgmt','SEO/SEM','Brand Strategy','Budget Ownership','Executive Comms'];
  skills5 text[] := array['Prospecting','Negotiation','Account Mgmt','Territory Planning','Sales Strategy','Team Leadership'];
  skills6 text[] := array['Financial Modeling','Budgeting','Forecasting','Reporting','Capital Allocation','Board Communication'];
  skills7 text[] := array['Process Design','Vendor Mgmt','Logistics','Resource Planning','Change Management','Executive Presence'];
  skills8 text[] := array['Recruiting','Onboarding','Employee Relations','Comp & Benefits','Org Design','Culture Leadership'];
  skills9 text[] := array['Market Analysis','Competitive Intel','Business Cases','Corp Development','Capital Allocation','Board Communication'];

  v_password text := 'DemoCandidate123!';
  v_fam int;
  v_lvl int;
  v_ladder text[];
  v_skill_pool text[];
  v_name text;
  v_headline text;
  v_target_role text;
  v_years int;
  v_score int;
  v_confidence int;
  v_horizon int;
  v_current_salary int;
  v_target_salary int;
  v_skill_count int;
  v_skills text[];
  v_experience jsonb;
  v_education jsonb;
  v_about text;
  v_trait text;
  v_trajectory jsonb;
  v_next_roles jsonb;
  v_skills_gap jsonb;
  v_gap_start int;
  v_curr_company text;
  v_prev_company text;
  v_base int;
  v_step int;
begin
  for i in 1..500 loop
    v_email := 'candidate_demo_' || lpad(i::text, 3, '0') || '@example.com';

    select id into v_id from auth.users where email = v_email;
    if v_id is not null then
      continue; -- already seeded on a previous run
    end if;

    v_id := uuid_generate_v4();
    v_name := first_names[1 + (i - 1) % 31] || ' ' || last_names[1 + (i - 1) % 29];

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token,
      email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', v_name),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', now(), now(), now()
    );

    -- Career family (0-9) + ladder level (0-3, weighted toward junior) drive
    -- every other field below, so headline/skills/target-role/skills-gap all
    -- agree with each other.
    v_fam := i % 10;
    v_ladder := case v_fam
      when 0 then ladder0 when 1 then ladder1 when 2 then ladder2 when 3 then ladder3 when 4 then ladder4
      when 5 then ladder5 when 6 then ladder6 when 7 then ladder7 when 8 then ladder8 else ladder9 end;
    v_skill_pool := case v_fam
      when 0 then skills0 when 1 then skills1 when 2 then skills2 when 3 then skills3 when 4 then skills4
      when 5 then skills5 when 6 then skills6 when 7 then skills7 when 8 then skills8 else skills9 end;

    v_lvl := least(3, floor(random() * random() * 4)::int);
    v_years := (v_lvl * 4) + 1 + floor(random() * 3)::int;
    v_headline := v_ladder[v_lvl + 1];
    v_target_role := v_ladder[v_lvl + 2];
    -- Random, not `traits[1 + (i % 12)]` — that shared the exact same 12-slot
    -- index expression as `schools[1 + (i % 12)]` below, so trait was a
    -- perfect 1:1 function of school (every "University of Malaya" candidate
    -- landed on "Eagle", every single time). Invisible browsing all 500, but
    -- glaring once a view filters down to one school, like the university
    -- portal's Animal Traits page.
    v_trait := traits[1 + floor(random() * 12)::int];

    v_score := least(99, 60 + v_lvl * 8 + floor(random() * 10)::int);
    v_confidence := least(97, 58 + v_lvl * 9 + floor(random() * 12)::int);
    v_horizon := case v_lvl when 0 then 24 when 1 then 20 when 2 then 16 else 12 end;

    v_current_salary := 45000 + v_lvl * 35000 + floor(random() * 15000)::int;
    v_target_salary := v_current_salary + 25000 + v_lvl * 15000 + floor(random() * 20000)::int;

    -- Current skills: a growing prefix of the family's skill pool.
    v_skill_count := least(6, v_lvl + 3);
    v_skills := v_skill_pool[1:v_skill_count];

    v_curr_company := 'Company ' || (1 + (i % 200))::text;
    v_experience := jsonb_build_array(jsonb_build_object(
      'id', 'exp' || i || '_1',
      'title', v_headline,
      'company', v_curr_company,
      'dates', (2026 - (v_years / 2))::text || ' — Present',
      'description', v_headline || ' focused on ' || v_skills[1] || ' and ' || v_skills[v_skill_count] || '.'
    ));
    if v_lvl > 0 then
      v_prev_company := 'Company ' || (1 + ((i + 37) % 200))::text;
      v_experience := v_experience || jsonb_build_array(jsonb_build_object(
        'id', 'exp' || i || '_2',
        'title', v_ladder[v_lvl],
        'company', v_prev_company,
        'dates', (2026 - v_years)::text || ' — ' || (2026 - (v_years / 2))::text,
        'description', 'Grew into the ' || v_headline || ' role by delivering on ' || v_skills[1] || '.'
      ));
    end if;

    v_education := jsonb_build_array(jsonb_build_object(
      'id', 'edu' || i,
      'school', schools[1 + (i % 12)],
      'degree', degrees[v_fam + 1],
      'grade', 'CGPA ' || (3.0 + (random() * 0.9))::numeric(2, 1)::text,
      'dates', (2026 - v_years - 4)::text || ' — ' || (2026 - v_years)::text
    ));

    v_about := v_name || ' is a ' || v_headline || ' with ' || v_years || ' years of experience in '
      || family_names[v_fam + 1] || ', focused on ' || v_skills[1] || '.';

    -- Readiness-over-time curve, rising toward the confidence score.
    v_base := greatest(50, v_confidence - 20 - v_lvl * 3);
    v_step := greatest(1, (v_confidence - v_base) / 4);
    v_trajectory := jsonb_build_array(
      jsonb_build_object('label', 'Now', 'value', v_base),
      jsonb_build_object('label', '6mo', 'value', least(99, v_base + v_step)),
      jsonb_build_object('label', '12mo', 'value', least(99, v_base + v_step * 2)),
      jsonb_build_object('label', '18mo', 'value', least(99, v_base + v_step * 3)),
      jsonb_build_object('label', '24mo', 'value', least(99, v_confidence))
    );

    v_next_roles := jsonb_build_array(
      jsonb_build_object('role', v_target_role, 'context', contexts[1 + (i % 7)], 'pct', v_confidence),
      jsonb_build_object('role', v_ladder[least(5, v_lvl + 3)], 'context', contexts[1 + ((i + 2) % 7)], 'pct', greatest(30, v_confidence - 15)),
      jsonb_build_object('role', v_ladder[5], 'context', contexts[1 + ((i + 4) % 7)], 'pct', greatest(15, v_confidence - 40))
    );

    -- Skills gap: the 4 skills just ahead of what the candidate already has.
    v_gap_start := least(3, v_lvl + 1);
    v_skills_gap := '[]'::jsonb;
    for j in v_gap_start..(v_gap_start + 3) loop
      v_skills_gap := v_skills_gap || jsonb_build_array(jsonb_build_object(
        'name', v_skill_pool[j],
        'current', greatest(30, 50 + v_lvl * 6 - (j * 4) + floor(random() * 10)::int),
        'required', least(98, 65 + v_lvl * 6 + (j * 3) + floor(random() * 10)::int)
      ));
    end loop;

    -- The on_auth_user_created trigger already inserted a bare
    -- (id, name, user_type) row for this user — upsert over it with the full
    -- synthetic profile rather than relying on a plain insert, which would
    -- silently no-op against that row.
    insert into profiles (
      id, user_type, name, headline, location, years_exp, about, skills,
      experience, education, profile_score, views, matches,
      animal_trait, animal_scores, profile_visible, is_demo
    ) values (
      v_id, 'individual', v_name, v_headline, locations[1 + (i % 12)], v_years, v_about, v_skills,
      v_experience, v_education, v_score, floor(random() * 500)::int, floor(random() * 40)::int,
      v_trait, jsonb_build_object(v_trait, 8 + floor(random() * 4)::int), true, true
    )
    on conflict (id) do update set
      headline        = excluded.headline,
      location        = excluded.location,
      years_exp       = excluded.years_exp,
      about           = excluded.about,
      skills          = excluded.skills,
      experience      = excluded.experience,
      education       = excluded.education,
      profile_score   = excluded.profile_score,
      views           = excluded.views,
      matches         = excluded.matches,
      animal_trait    = excluded.animal_trait,
      animal_scores   = excluded.animal_scores,
      profile_visible = excluded.profile_visible,
      is_demo         = excluded.is_demo;

    insert into candidate_trajectories (
      profile_id, current_salary, arrow_target, target_role, target_salary,
      confidence, horizon_months, trajectory, next_roles, skills
    ) values (
      v_id,
      '$' || round(v_current_salary / 1000.0)::text || 'K',
      coalesce((regexp_match(v_target_role, '(\S+)$'))[1], v_target_role),
      v_target_role,
      '$' || round(v_target_salary / 1000.0)::text || 'K',
      v_confidence, v_horizon, v_trajectory, v_next_roles, v_skills_gap
    )
    on conflict (profile_id) do nothing;
  end loop;
exception when undefined_table then
  raise notice 'auth schema not present; skipped demo candidate seed';
end $$;

-- ----------------------------------------------------------------------------
-- BACKFILL: the candidate loop above skips any account that already exists
-- (`continue` right after the auth.users lookup), so fixing the trait-vs-
-- school correlation bug in the generator only affects candidates seeded from
-- here on — it does nothing for a database that already ran the old version
-- of this script. This re-randomizes animal_trait (and its matching
-- animal_scores) for every already-seeded demo candidate so an existing
-- database picks up the fix too. Only touches is_demo rows — never a real
-- candidate's own quiz result.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
  v_trait text;
  traits text[] := array['Lion','Eagle','Wolf','Owl','Octopus','Elephant','Cheetah','Fox','Ant','Horse','Dolphin','Peacock'];
begin
  for r in select id from profiles where is_demo loop
    v_trait := traits[1 + floor(random() * 12)::int];
    update profiles
       set animal_trait = v_trait,
           animal_scores = jsonb_build_object(v_trait, 8 + floor(random() * 4)::int)
     where id = r.id;
  end loop;
exception when undefined_table then
  raise notice 'profiles not present; skipped animal-trait backfill';
end $$;
