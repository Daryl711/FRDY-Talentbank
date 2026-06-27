-- ============================================================================
-- Mango — content seed data (companies + roles for the swipe deck)
-- ----------------------------------------------------------------------------
-- Run AFTER schema.sql, in the Supabase SQL Editor (or `supabase db reset`).
--
-- Safe to re-run: every row has a fixed UUID and uses `on conflict do nothing`,
-- so this is idempotent and never creates duplicates.
--
-- This seeds ONLY content tables (companies, roles) — they have no dependency on
-- auth.users. User-owned data (profiles, swipes, matches, connections, messages)
-- is intentionally NOT seeded: it must come from real signed-in users so the
-- foreign keys to auth.users(id) and the row-level-security policies hold.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------
insert into companies (id, name, industry, size, stage, culture, location, employees) values
  ('11111111-1111-1111-1111-111111111111','Summit Advisors','Consulting','200+','Established','{Strategic,"High Performance",Mentorship}','Boston, MA','240 emp.'),
  ('22222222-2222-2222-2222-222222222222','Meridian Capital','Fintech','51-200','Scale-up','{"Fast Paced",Data-Driven,Ownership}','New York, NY','180 emp.'),
  ('33333333-3333-3333-3333-333333333333','Stratos Ventures','SaaS','200+','Established','{Innovative,Flexible,Collaborative}','San Francisco, CA','320 emp.'),
  ('44444444-4444-4444-4444-444444444444','Apex Partners','Operations','51-200','Scale-up','{Pragmatic,Supportive,Hybrid}','Chicago, IL','95 emp.'),
  ('55555555-5555-5555-5555-555555555555','Luminary Group','Strategy','51-200','Established','{Analytical,"Client First",Polished}','New York, NY','140 emp.'),
  ('66666666-6666-6666-6666-666666666666','Northwind Labs','AI / ML','11-50','Startup','{"Research Driven",Curious,"Move Fast"}','Seattle, WA','42 emp.'),
  ('77777777-7777-7777-7777-777777777777','Atlas Logistics','Supply Chain','200+','MNC','{Reliable,Global,Structured}','Atlanta, GA','410 emp.'),
  ('88888888-8888-8888-8888-888888888888','Verdant Health','HealthTech','51-200','Scale-up','{Mission-Driven,Empathetic,Rigorous}','Austin, TX','160 emp.'),
  ('99999999-9999-9999-9999-999999999999','Beacon Digital','MarTech','11-50','Startup','{Creative,Autonomous,Remote}','Denver, CO','58 emp.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Cobalt Robotics','Hardware','51-200','Scale-up','{Builders,Hands-On,Ambitious}','San Jose, CA','120 emp.')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- ROLES  (explicit ids so this stays idempotent across re-runs)
-- ----------------------------------------------------------------------------
insert into roles (id, company_id, title, location, salary_min, salary_max, type, tags, package, perks) values
  ('a0000001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Managing Director','Boston, MA',230000,290000,'Full-time','{Strategy,Consulting,Leadership}','$260K','{Partnership,"Travel Budget",Pension}'),
  ('a0000002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Engagement Manager','Boston, MA',150000,185000,'Hybrid','{Consulting,"Project Mgmt",Strategy}','$170K','{Bonus,"Learning Budget",Health}'),
  ('a0000003-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','Senior Product Manager','New York, NY',180000,220000,'Hybrid','{Product,Fintech,Strategy}','$200K','{Equity,Remote,Health}'),
  ('a0000004-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','Quantitative Analyst','New York, NY',160000,210000,'Full-time','{Data,Finance,Python}','$185K','{Equity,Bonus,Gym}'),
  ('a0000005-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333','VP of Engineering','San Francisco, CA',240000,300000,'Full-time','{Engineering,SaaS,Leadership}','$270K','{Equity,401k,Flexible}'),
  ('a0000006-0000-0000-0000-000000000006','33333333-3333-3333-3333-333333333333','Staff Software Engineer','Remote',190000,240000,'Remote','{Engineering,Backend,SaaS}','$215K','{Equity,Remote,"Home Office"}'),
  ('a0000007-0000-0000-0000-000000000007','44444444-4444-4444-4444-444444444444','Chief of Staff','Chicago, IL',160000,190000,'Hybrid','{Operations,Strategy}','$175K','{Bonus,Hybrid,Pension}'),
  ('a0000008-0000-0000-0000-000000000008','55555555-5555-5555-5555-555555555555','VP Strategy','New York, NY',210000,250000,'Hybrid','{Strategy,Consulting}','$230K','{Equity,Travel,Health}'),
  ('a0000009-0000-0000-0000-000000000009','66666666-6666-6666-6666-666666666666','Machine Learning Engineer','Seattle, WA',185000,235000,'Hybrid','{ML,Python,Research}','$210K','{Equity,"Compute Budget",Flexible}'),
  ('a000000a-0000-0000-0000-00000000000a','66666666-6666-6666-6666-666666666666','Founding Product Designer','Remote',150000,190000,'Remote','{Design,Product,"0 to 1"}','$170K','{Equity,Remote,"Latest Gear"}'),
  ('a000000b-0000-0000-0000-00000000000b','77777777-7777-7777-7777-777777777777','Director of Operations','Atlanta, GA',170000,210000,'Full-time','{Operations,Logistics,Leadership}','$190K','{Bonus,401k,Relocation}'),
  ('a000000c-0000-0000-0000-00000000000c','88888888-8888-8888-8888-888888888888','Senior Product Manager, Clinical','Austin, TX',165000,205000,'Hybrid','{Product,Healthcare,Strategy}','$185K','{Equity,Health,"Wellness Stipend"}'),
  ('a000000d-0000-0000-0000-00000000000d','99999999-9999-9999-9999-999999999999','Growth Marketing Lead','Remote',130000,165000,'Remote','{Marketing,Growth,Analytics}','$150K','{Equity,Remote,Flexible}'),
  ('a000000e-0000-0000-0000-00000000000e','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Robotics Software Engineer','San Jose, CA',175000,225000,'Full-time','{Robotics,C++,Embedded}','$200K','{Equity,401k,"Free Lunch"}')
on conflict (id) do nothing;
