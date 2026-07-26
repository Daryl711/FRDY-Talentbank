# Mango — Web (candidate + employer + university portals)

The web companion to the Mango Career OS mobile app. Where the mobile client is
the candidate-facing experience (persona matching + swipe deck), this app ships
**three portals** behind one sign-in page:

- **Candidate** — the same persona-matching experience as mobile (job match
  swipe deck, applications, resume, connections, AI advisor, profile), also
  available on web.
- **Employer** — hiring dashboard, animal-trait breakdown, trajectory
  predictions, an applicant pipeline (Hiring board), and hiring-rate analytics.
- **University** — graduate-outcomes dashboard, animal-trait breakdown,
  trajectory predictions, employability analytics, and course preferences.

All three are wired to the same Supabase backend as the mobile app.

## Stack

| Layer     | Tech                                              |
| --------- | ------------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19                |
| Styling   | Tailwind CSS v4                                   |
| Charts    | Recharts                                          |
| Icons     | lucide-react                                      |
| Fonts     | Playfair Display, Inter, Space Mono (`next/font`) |
| Backend   | Supabase (Postgres + Auth), with mock fallback    |

> ⚠️ This is Next.js **16**, which has breaking changes from earlier versions.
> See `AGENTS.md` — read the guides in `node_modules/next/dist/docs/` before
> writing code.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — that's the sign-in page,
which lets you pick an account type (Candidate / Employer / University) and
either sign in or try a no-signup demo path. After sign-in you land on:

- `/candidate` — candidate home (also `/candidate/match`, `/applications`,
  `/resume`, `/connect`, `/advisor`, `/profile`)
- `/employer` — employer dashboard (also `/employer/traits`, `/trajectory`,
  `/hiring`, `/rate`)
- `/university` — university dashboard (also `/university/traits`,
  `/trajectory`, `/employability`, `/preferences`)

Other scripts: `npm run build`, `npm run start` (serve the production build),
`npm run lint`.

> The portal runs immediately with built-in mock data — no backend needed.
> Add Supabase credentials (below) to make it live.

## Wire up Supabase

1. Create `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
2. Restart the dev server. `lib/supabase.ts` exposes `isSupabaseConfigured`,
   which flips every page from mock data to live queries when both vars are
   present.

Demo logins (seeded by `supabase/schema.sql` / `supabase/seed_demo_data.sql`):
employer `employer@celcomdigi.com` / `CelcomDigi123!`, university
`admin@um.edu.my` / `UniversitiMalaya123!`. Candidates sign up for real, or use
the "Try it now" no-signup path on the sign-in page.

## How the data flows

Each portal has its own data module in `lib/` that follows the same pattern as
the mobile app's `repo.ts`: every function tries a live Supabase query first
and falls back to mock data (or an empty/demo result) when Supabase isn't
configured or the query errors.

- `lib/candidate.ts` — profile, swipe deck, applications, resume, connections
  (network / requests / discover, with server-side search on discover), and
  the AI advisor (`getAdvisorSnapshot` / `askAdvisor`) — grounded in the
  candidate's actual profile stats **and** their Animal Persona result
  (`lib/persona.ts`), not just a canned script.
- `lib/employer.ts` — company, roles, matched candidates, hiring pipeline.
- `lib/university.ts` — cohort candidates, trajectory/employability rollups.
- `lib/traitAnalytics.ts` — shared animal-trait breakdown math used by both
  the employer and university Animal Traits pages.
- `lib/persona.ts` — the 12 animal archetypes (emoji, title, description,
  tags) and the quiz that assigns one to a candidate — ported from the mobile
  app's `src/data/persona.ts` so both surfaces agree.
- `lib/supabase.ts` — client + `isSupabaseConfigured` flag.

## Project structure

```
app/
  page.tsx                    sign-in / account-type picker
  reset_password/page.tsx     password reset (Supabase recovery link)
  candidate/
    layout.tsx                CandidateGuard + OnboardingGate (quiz-first)
    page.tsx                  home · match/ applications/ resume/ connect/
                               advisor/ profile/ onboarding/ quiz/
  employer/
    layout.tsx                EmployerGuard + sidebar shell
    page.tsx                  dashboard · traits/ trajectory/ hiring/ rate/
  university/
    layout.tsx                sidebar shell
    page.tsx                  dashboard · traits/ trajectory/ employability/
                               preferences/
  globals.css                 Tailwind + Mango color/font tokens
components/
  ui.tsx                      Panel, PageHeader, StatTile (shared)
  candidate/  employer/  university/   per-portal sidebar + widgets
  MatchChat.tsx, TraitDonut.tsx, TraitRadar.tsx, TrajectoryChart.tsx, …
lib/
  candidate.ts  employer.ts  university.ts   per-portal data layer
  persona.ts                  animal-trait archetypes + quiz
  traitAnalytics.ts           shared trait-breakdown math
  types.ts                    shared portal data shapes
  supabase.ts                 client + isSupabaseConfigured flag
```

Each portal's sidebar (`components/{candidate,employer,university}/*Sidebar.tsx`)
collapses into an off-canvas drawer with a hamburger toggle below the `lg`
breakpoint, so all three portals are usable from phone width up.
