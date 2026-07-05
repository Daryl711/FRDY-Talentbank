# Mango — Career Life Guide

Mango is a persona-based career platform: persona matching with a swipe deck,
an AI career advisor, professional connections, and hiring analytics — all wired
to a shared Supabase backend.

## Who uses what

Mango ships as two surfaces, split by audience:

| Audience              | Mobile (Expo)        | Web (Next.js)        |
| --------------------- | -------------------- | -------------------- |
| **Candidates**        | ✅ Primary experience | ✅ Also available     |
| **Employers**         | —                    | ✅ Web only           |
| **Universities**      | —                    | ✅ Web only           |

- **Candidates** live mostly on **mobile** — swipe deck, advisor, connections,
  and profile — with the same candidate experience also available on **web**.
- **Employers and universities** use the **web portal only**: a hiring/talent
  dashboard with analytics, an applicant pipeline, and candidate management.

## Repository layout

```
apps/
  mobile/   React Native + Expo — the candidate app (also detailed below)
  web/      Next.js 16 — candidate web + the employer/university portal
```

See [`apps/web/README.md`](apps/web/README.md) for the web portal.

## System workflow

Both surfaces talk to one shared Supabase backend (Postgres + Auth), so a
candidate on mobile and an employer on the web portal see the same data.

```
   Candidate (mobile / web)                 Employer · University (web)
   ────────────────────────                 ───────────────────────────
   persona assessment                       post roles
   swipe deck  ─┐                           review applicant pipeline
   advisor      │                           move candidates by stage
   connections  │                           hiring analytics
                ▼                                   ▲
        ┌───────────────────────────────────────────────────┐
        │              Supabase (Postgres + Auth)            │
        │  profiles · roles · swipes · matches · applications │
        │  pgvector matching  ·  triggers  ·  views           │
        └───────────────────────────────────────────────────┘
```

1. A candidate builds a persona and swipes on roles in the app.
2. `pgvector` similarity ranks the deck; a mutual right-swipe fires a DB trigger
   that creates a **match** and surfaces the candidate as an **application**.
3. Employers and universities work those applications from the web dashboard —
   pipeline stages, match scores, and hiring analytics.
4. Either surface runs on built-in **mock data** until Supabase credentials are
   supplied, then switches to live queries automatically.

---

# Mobile app (Expo)

A React Native (Expo) implementation of the candidate experience: persona-based
career matching with a swipe deck, AI career advisor, professional connections,
and profile — wired to a Supabase backend.

## Stack

| Layer         | Tech                                                      |
| ------------- | --------------------------------------------------------- |
| Mobile client | React Native + Expo                                       |
| Styling       | NativeWind (Tailwind for RN)                              |
| Navigation    | React Navigation (bottom tabs)                            |
| Swipe deck    | react-native-deck-swiper + Reanimated                     |
| Backend       | Supabase (Postgres + Auth + Realtime + Storage)           |
| Matching      | pgvector cosine similarity + rule-based fallback          |
| AI advisor    | Anthropic Claude API via Supabase Edge Function (stubbed) |

## Prerequisites 
Make sure to download **Expo Go** in your mobile phone

## Run it

```bash
cd apps/mobile
npm install
npm run start
```

The start script clears Metro's cache before serving, which helps when Expo Go
keeps showing an old compatibility warning after an app or SDK update.

Press `i` (iOS simulator), `a` (Android), or scan the QR with Expo Go.

> The app runs immediately with built-in mock data — no backend needed.
> Add Supabase credentials (below) to make it live.

## Wire up Supabase


1. Copy `.env.example` to `.env` and fill in (create a .env file if it doesn't exist):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://edzchzjupgmvjwnazrty.supabase.co/rest/v1/
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_u7NLPBamKOm9aPFynTGMKw_JsCYipma
   ```
2. Restart Expo. `src/data/repo.ts` detects the credentials and switches every
   screen from mock data to live Supabase queries automatically.

## How the data flows

`src/data/repo.ts` is the single source of truth. Each function tries Supabase
when configured and falls back to `src/data/mock.ts` otherwise:

- `getFeaturedRoles()` → Home featured + mini role cards
- `getSwipeDeck()` → Match deck, ranked by `get_swipe_deck()` (pgvector)
- `recordSwipe()` → inserts into `swipes`; a DB trigger creates a `match` on mutual right-swipes
- `getConnections(kind)` → Connect tabs, reading `connections_view`
- `askAdvisor()` (in `services/advisor.ts`) → canned now; swap for the Edge Function

## Project structure

Paths below are relative to `apps/mobile/`.

```
App.tsx                  font loading + navigation root
global.css               tailwind directives
tailwind.config.js       Mango color + font tokens
src/
  theme/colors.ts        tokens for LinearGradient / icon tints
  lib/supabase.ts        client + isSupabaseConfigured flag
  data/                  types, mock seed, repo (Supabase + fallback)
  services/advisor.ts    AI advisor (Edge Function wiring documented)
  components/ui.tsx       ScreenBg, Avatar, Card, GoldButton, Pill, etc.
  navigation/BottomTabs.tsx
  screens/               Home, Match, Connect, Advisor, Profile
supabase/schema.sql      full backend schema
```

## Next steps toward production

- Add Supabase Auth screens (sign-up flow + persona assessment write).
- Enable Realtime on `messages` for live chat after a match.
- Generate `embedding` vectors on profile/role create for real matching.
- Add Expo Notifications for interview reminders.

---

# Web app (Next.js)

The candidate web experience **and** the employer/university portal — a
hiring/talent dashboard with analytics, an applicant pipeline, and candidate
management. See [`apps/web/README.md`](apps/web/README.md) for full detail.

## Stack

| Layer     | Tech                                              |
| --------- | ------------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19                |
| Styling   | Tailwind CSS v4                                    |
| Charts    | Recharts                                           |
| Icons     | lucide-react                                       |
| Fonts     | Playfair Display, Inter, Space Mono (`next/font`)  |
| Backend   | Supabase (Postgres + Auth), with mock fallback    |


## Prerequisites

- **Node.js 20+** and npm.

## Run it

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000); the dashboard lives at
[/dashboard](http://localhost:3000/dashboard). Other scripts: `npm run build`,
`npm run start` (serve the production build), `npm run lint`.

> The portal runs immediately with built-in mock data — no backend needed.

## Wire up Supabase

Create `apps/web/.env.local` and restart the dev server:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

`lib/supabase.ts` exposes `isSupabaseConfigured`, which flips the dashboard from
mock data (`lib/mock.ts`) to live queries when both vars are present.

# Deployment
## Mobile App

The mobile app is an Expo project, so it deploys through **EAS Build** — Expo's
cloud build service. You don't compile the app on your own machine; EAS builds
it on Expo's servers and hands back a downloadable artifact. For the prototype we
build a standalone Android **`.apk`** that can be sideloaded onto a phone for
demos.

**One-time setup:**

```bash
npm install -g eas-cli    # install the EAS command-line tool
eas login                 # sign in to your Expo account
cd apps/mobile
eas build:configure       # generates apps/mobile/eas.json with build profiles
```

`eas build:configure` creates `eas.json`, which defines the build profiles the
next command references. It only needs to be run once.

**Build the APK:**

```bash
eas build --platform android --profile preview
```

- `--platform android` → produces an Android artifact.
- `--profile preview` → an internal-distribution profile that outputs an
  installable **`.apk`** (ideal for sideloading and demos), as opposed to a
  `production` profile that would output an `.aab` for the Play Store.

The build runs in the cloud; when it finishes, EAS prints a URL to download the
`.apk`. No iOS build is configured for the prototype — on iOS, development runs
through Expo Go (see **Run it** above).

## Web App

The web app is a standard Next.js 16 project, so it deploys to any host that
runs Node. The native target is **Vercel** (auto-detects Next.js, handles the
build, and redeploys on every push).

**Deploy on Vercel:**

1. Import the repo into Vercel and set the **Root Directory** to `apps/web`
   (this is a monorepo, so Vercel needs to know which app to build).
2. Add the Supabase environment variables under **Settings → Environment
   Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
   Without these, the portal still deploys and runs on built-in mock data.
3. Deploy. Vercel runs `npm run build` and serves the app; pushes to the branch
   trigger automatic redeploys.

**Self-host anywhere else** (any Node 20+ server):

```bash
cd apps/web
npm install
npm run build     # production build
npm run start     # serve on port 3000
```

Set the same `NEXT_PUBLIC_SUPABASE_*` vars in the environment before building to
switch from mock data to live Supabase queries.