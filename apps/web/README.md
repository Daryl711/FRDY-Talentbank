# Mango — Employer & University Portal (web)

The web companion to the Mango Career OS mobile app. Where the mobile client is
the candidate-facing experience (persona matching + swipe deck), this portal is
the **employer/university dashboard**: hiring analytics, an applicant pipeline,
and candidate management — wired to the same Supabase backend.

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

Open [http://localhost:3000](http://localhost:3000). The dashboard lives at
[/dashboard](http://localhost:3000/dashboard).

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
   which flips the dashboard from mock data to live queries when both vars are
   present.

## How the data flows

`lib/mock.ts` seeds the dashboard today — org name, stat cards, a 6-month
applications/hires trend, the pipeline funnel, and a shortlist of applicants.
`lib/types.ts` defines the shapes (`StatCard`, `Applicant`, `PipelineStage`,
`MonthPoint`), aligned with `supabase/schema.sql` and the mobile app's types.
When Supabase is configured, these same shapes are meant to be filled from live
queries instead.

## Project structure

```
app/
  layout.tsx            root layout, font variables, metadata
  page.tsx              landing page
  dashboard/
    layout.tsx          dashboard shell (sidebar + content)
    page.tsx            hiring overview: stats, trend, pipeline, applicants
  globals.css           Tailwind + Mango color/font tokens
components/
  Sidebar.tsx           dashboard navigation
lib/
  types.ts              portal data types
  mock.ts               mock seed data
  supabase.ts           client + isSupabaseConfigured flag
```

## Status

Scaffolding is in place; the dashboard UI (`app/dashboard/*`, `components/Sidebar.tsx`)
is still being built out against the mock data in `lib/`.
