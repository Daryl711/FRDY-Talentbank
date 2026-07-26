# Mango Career Life Guide — System Workflow

This document explains how the Mango app works end to end: how each client
boots, how data flows between the screens/pages and the backend, and how the
core features (persona matching, connections, AI advisor, hiring/university
analytics) are wired together.

Mango ships two clients against **one shared Supabase backend**:

- **Mobile (Expo)** — the candidate experience: persona quiz, swipe deck,
  resume, connections, AI advisor, profile.
- **Web (Next.js)** — the same candidate experience, **plus** an
  employer portal (hiring analytics + pipeline) and a university portal
  (graduate-outcomes analytics), behind one sign-in page.

Both clients are designed to run **out of the box with mock data** and become
**live** the moment Supabase credentials are present — no code changes
required, on either platform.

---

# Part A — Mobile app (Expo)

## A.1 High-level architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Mobile client (Expo)                       │
│                                                                    │
│   App.tsx ─► NavigationContainer ─► AuthGate ─► PersonaGate ─►    │
│                                       ProfileGate ─► BottomTabs   │
│                                                          │        │
│      ┌────────┬────────┬─────────┬─────────┬──────────┐          │
│    Home     Match    Resume   Connect   Advisor    Profile        │
│      │        │        │         │         │          │          │
│      └────────┴────┬───┴─────────┴─────────┴──────────┘          │
│                     ▼                                             │
│           src/data/repo.ts  (single source of truth)              │
│                     │              │                               │
│           isSupabaseConfigured?    │                               │
│              yes │           no │                                  │
└──────────────────┼─────────────┼──────────────────────────────────┘
                   ▼             ▼
          ┌────────────────┐  ┌──────────────────┐
          │    Supabase    │  │  src/data/mock.ts │
          │  Postgres/Auth │  │  (local seed data)│
          │ Realtime/Store │  └──────────────────┘
          └────────────────┘
```

The decision point is `isSupabaseConfigured` in `src/lib/supabase.ts`. It is
`true` only when both `EXPO_PUBLIC_SUPABASE_URL` (starts with `http`) and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` (length > 20) are set in `.env`. Every data
function checks this flag and falls back to mock data on a miss or error.

## A.2 App startup flow

1. **`App.tsx`** is the root component.
2. It loads the custom fonts (Playfair Display, Inter, Space Mono). While
   fonts are loading it renders a blank background screen.
3. Once loaded it wraps the app in `GestureHandlerRootView` (swipe gestures),
   `SafeAreaProvider` (notches), and `NavigationContainer` (dark theme using
   Mango color tokens), then `AuthProvider`.
4. Three nested gates run before the main app is shown:
   - **`AuthGate`** — shows Sign In / Sign Up until a session exists (or the
     user is on mock/offline mode).
   - **`PersonaGate`** — routes to the Animal Persona quiz
     (`PersonaQuizScreen`) if the signed-in candidate hasn't taken it yet.
   - **`ProfileGate`** — prompts profile setup (`ProfileSetupScreen`,
     skippable) once the persona is set.
5. **`BottomTabs`** (`src/navigation/BottomTabs.tsx`) then renders the
   six-tab bottom navigation: **Home, Match, Resume, Connect, Advisor,
   Profile**. Each tab has a custom gold-accented icon button.

## A.3 The data layer (`src/data/repo.ts`)

`repo.ts` is the **single source of truth** for all screen data. Every
function follows the same pattern:

```ts
export async function getX() {
  if (!isSupabaseConfigured) return mock.x;   // offline fallback
  const { data, error } = await supabase...    // live query
  if (error || !data) return mock.x;           // resilient fallback
  return data;
}
```

| Function             | Source (live)                      | Powers                     |
| --------------------- | ----------------------------------- | -------------------------- |
| `getMyProfile()`      | `profiles` (by auth uid)            | Profile screen             |
| `getFeaturedRoles()`  | `roles` (top 10 by match)           | Home featured + mini cards |
| `getSwipeDeck()`      | `get_swipe_deck()` RPC (pgvector)   | Match swipe deck           |
| `recordSwipe()`       | inserts into `swipes`               | Match swipe actions        |
| `getConnections(kind)`| `connections_view`                  | Connect tabs                |
| `askAdvisor()`        | `services/advisor.ts` (canned/stub) | Advisor chat                |

This design means the UI never knows or cares whether it is talking to
Supabase or local mocks — it just `await`s a repo function. The web app's
`lib/*.ts` modules (Part B) mirror this same pattern per portal.

## A.4 Core feature workflows

### A.4.1 Match (swipe-to-match)

This is the heart of the app and mirrors a dating-app swipe loop.

```
User opens Match tab
   │
   ▼
getSwipeDeck() ──► get_swipe_deck() RPC
   │                  • excludes companies already swiped
   │                  • ranks by pgvector cosine similarity
   │                    between profile.embedding & company.embedding
   │                  • similarity → 0..100 "match" score (fallback 75)
   ▼
SwipeDeck renders cards
   │
   ▼  user swipes left / right / save
recordSwipe(targetId, direction)
   │  inserts row into `swipes`
   ▼
DB trigger `trg_right_swipe` fires (handle_right_swipe)
   │  if this is a right-swipe AND the company already
   │  right-swiped this candidate (target_type='candidate')
   ▼
A row is inserted into `matches`  ──► chat becomes possible
```

Key backend objects (`supabase/schema.sql`):

- **`get_swipe_deck()`** — `SECURITY DEFINER` SQL function returning the next
  20 un-swiped companies, ranked by similarity. Cosine distance (`<=>`) is
  converted to a percentage match score.
- **`swipes`** — one row per left/right/save, unique per (user, target, type).
- **`handle_right_swipe()` + `trg_right_swipe`** — the mutual-match trigger.
  Only a reciprocal right-swipe from both sides creates a `matches` row.
- **`matches`** — unlocks the `messages` table (chat) for both participants.

### A.4.2 Home

- `getFeaturedRoles()` pulls the top 10 roles ordered by match score.
- Also surfaces static `trendingSectors` and `careerInsights` (currently mock
  constants re-exported from `repo.ts`).

### A.4.3 Resume

- Upload/manage a resume (stored via Supabase Storage) and cover letters used
  when applying/matching. Mirrored on web by `app/candidate/resume`.

### A.4.4 Connect (professional network)

- `getConnections(kind)` reads the **`connections_view`**, which classifies
  each other user relative to the current user into one of three buckets:
  - `network` — connection `accepted`
  - `requests` — `pending` request addressed **to** you
  - `discover` — everyone else
- The Connect screen has a tab per `kind`.

### A.4.5 Advisor (AI career advisor)

- `askAdvisor(question)` lives in `src/services/advisor.ts`.
- **Prototype:** returns profile-aware **canned** answers after a short
  delay, plus a list of `suggestedQuestions`. No network/API key needed. It
  does **not** currently factor in the Animal Persona result — see the web
  app's advisor (Part B.4.4) for that.
- **Production:** route through a Supabase **Edge Function** that calls the
  Anthropic Claude API server-side (keep the API key off the device):

  ```ts
  const { data } = await supabase.functions.invoke("advisor", {
    body: { question, profileId },
  });
  return data.reply;
  ```

### A.4.6 Profile

- `getMyProfile()` reads the signed-in user's `profiles` row (or `mock.me`).
- Profile fields include the animal persona result, skills, years of
  experience, and a `vector(384)` embedding used for matching.

## A.5 Next steps toward production

- Wire the Edge Function so `askAdvisor()` calls a real model (see A.4.5).
- Enable Realtime on `messages` for live chat after a match (web already
  subscribes to connections/matches — see Part B).
- Generate `embedding` vectors on profile/role create for real matching.
- Add Expo Notifications for interview reminders (the `notifications` table
  already exists — see the data model below).

---

# Part B — Web app (Next.js)

Three portals behind one sign-in page (`app/page.tsx`), sharing the same
Supabase backend as mobile. See `apps/web/README.md` for run instructions.

## B.1 High-level architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         Web client (Next.js)                       │
│                                                                     │
│   app/page.tsx — sign-in, pick Candidate / Employer / University   │
│              │                                                     │
│   ┌──────────┼──────────────────┬──────────────────────┐          │
│   ▼                             ▼                        ▼         │
│ /candidate/*                /employer/*              /university/* │
│ CandidateGuard               EmployerGuard             (auth via    │
│ + OnboardingGate             + sidebar shell             sign-in    │
│ (quiz-first)                                              only)     │
│   │                             │                        │         │
│   └─────────────┬───────────────┴────────────┬───────────┘         │
│                 ▼                            ▼                     │
│         lib/candidate.ts   lib/employer.ts   lib/university.ts     │
│                 │              │                  │                │
│           isSupabaseConfigured? (same flag, same pattern as mobile)│
└──────────────────┼──────────────────────────────────────────────────┘
                   ▼
            Supabase (Postgres + Auth) — same project as mobile
```

## B.2 Portal routing & guards

| Portal     | Layout                                             | Guard                                                          |
| ---------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Candidate  | `components/candidate/OnboardingGate.tsx`           | `CandidateGuard` (session) → `OnboardingGate` (forces the Animal Persona quiz, then optional profile setup, before showing the sidebar) |
| Employer   | `app/employer/layout.tsx`                           | `EmployerGuard` (session)                                        |
| University | `app/university/layout.tsx`                         | none beyond sign-in (demo-credential portal)                     |

Each portal's sidebar (`components/{candidate,employer,university}/*Sidebar.tsx`)
is a fixed, always-visible column at `lg` screen width and up, and an
off-canvas drawer (hamburger toggle + backdrop) below it — so all three
portals are usable from phone width up.

## B.3 The data layer (`lib/*.ts`)

Same pattern as mobile's `repo.ts`, split one module per portal:

- **`lib/candidate.ts`** — profile, swipe deck, applications, resume,
  connections, AI advisor.
- **`lib/employer.ts`** — company, roles, matched candidates, hiring
  pipeline.
- **`lib/university.ts`** — cohort candidates, trajectory/employability
  rollups.
- **`lib/persona.ts`** — the 12 animal archetypes + quiz, ported from
  mobile's `src/data/persona.ts` so both surfaces agree.
- **`lib/traitAnalytics.ts`** — shared trait-breakdown math used by both the
  employer and university Animal Traits pages.

## B.4 Core feature workflows

### B.4.1 Candidate portal

Mirrors the mobile candidate experience: Home, Job Match (swipe deck),
Applications, Resume, Connect, Advisor, Profile — same `matches`/`swipes`
tables, same `get_swipe_deck()` RPC.

**Connect / Discover search:** the Discover tab covers every other candidate
in the system, so unlike Network/Requests (small, already-fetched lists
filtered client-side), typing a search term there queries
`connections_view` server-side (`name`/`role` `ilike`, debounced, limited
result count) instead of relying on whatever page happened to load first.

### B.4.2 Employer portal

`/employer` (dashboard), `/employer/traits` (Animal Traits), `/trajectory`
(ML-predicted career trajectory), `/hiring` (Kanban applicant pipeline),
`/rate` (hiring-rate analytics). All pull the employer's owned `companies`
row and its matched candidates (`get_company_matches()`). Gating differs by
page: the dashboard and Hiring board go live as soon as the signed-in user
owns a company — even with zero matches yet, showing a live "no applicants"
empty state — while Animal Traits only goes live once there's at least one
profiled candidate, falling back to mock data otherwise (mirrors the
university portal below, so an employer with a company but no traffic yet
still sees a realistic trait distribution instead of an empty page).

### B.4.3 University portal

`/university` (dashboard), `/university/traits`, `/trajectory`,
`/employability`, `/preferences`. Reads a cohort of candidates via
`get_university_candidates(school)` (defaults to "Malaya" — see
`lib/university.ts`), gated on **whether any live candidates exist** rather
than account ownership (universities don't own a row the way employers own a
company) — no live data falls back to mock.

### B.4.4 Advisor (AI career advisor) — persona-aware

`app/candidate/advisor` + `lib/candidate.ts` (`getAdvisorSnapshot` /
`askAdvisor`). Same "canned, no network call" prototype design as mobile,
but the web version additionally factors in:

- The candidate's **Animal Persona** result (`profiles.animal_trait`) and its
  archetype metadata (title, description, tags) from `lib/persona.ts`.
- A **trait-specific tactic map** (`TRAIT_TIPS`) — one search/interview/
  negotiation tip per archetype — that flavors answers about role fit, salary,
  and a dedicated "what does my animal trait mean for my job search"
  question.
- The candidate's own **profile bio** (`profiles.about`), quoted back
  (truncated) in the persona answer so it reads as grounded in their actual
  profile rather than a generic archetype blurb.

Suggested-question chips persist for the whole conversation (not just before
the first message), so the candidate can keep tapping one while composing a
follow-up.

### B.4.5 Trajectory predictions (employer + university)

`get_candidate_trajectories()` and the `candidate_trajectories` table power
an ML-style prediction (target role, confidence, skills gap, next-role odds)
shown on both the employer and university Trajectory pages, generated
per-candidate by the `generate_candidate_trajectory()` trigger
(`on_profile_trajectory`, fires on profile edits that affect it).

## B.5 Next steps toward production

- Same Edge Function wiring as mobile (A.5) to make the advisor call a real
  model — the persona/profile grounding already built into
  `askAdvisor()`/`getAdvisorSnapshot()` would just become the prompt context.
- Surface the `notifications` table in the UI (currently only
  `NotificationBell` reads unread counts).

---

# Part C — Backend data model (Supabase)

Defined in `supabase/schema.sql` (seed data in `supabase/seed.sql` and
`supabase/seed_demo_data.sql`). Shared by both clients.

| Table / object            | Purpose                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| `profiles`                 | Individual users, 1:1 with `auth.users`; embedding, `animal_trait` + `animal_scores`, `is_demo` flag |
| `companies`                | Employer profiles, owned by a user; embedding, `status` (self-serve access gate) |
| `roles`                    | Job postings under a company                                             |
| `swipes`                   | Every left/right/save action                                             |
| `matches`                  | Mutual right-swipes; gates chat                                          |
| `match_stage_history`      | Audit trail of a match's pipeline-stage changes (Hiring board)           |
| `interviews`               | Scheduled interviews tied to a match                                     |
| `connections`              | Network requests (pending/accepted/declined)                             |
| `messages`                 | Chat, unlocked per match or accepted connection                          |
| `notifications`            | In-app notifications (new message, connection event, match stage change) |
| `resumes`                  | Versioned resumes, stored in Supabase Storage                            |
| `candidate_trajectories`   | Predicted target role, confidence, skills gap, next-role odds            |
| `roles_with_company`       | View joining roles + company info                                        |
| `connections_view`         | View bucketing users into network/requests/discover                      |

**Automation via triggers:**

- `on_auth_user_created` → `handle_new_user()` auto-creates a `profiles` row
  on sign-up.
- `trg_right_swipe` → `handle_right_swipe()` auto-creates a `match` on a
  mutual right-swipe.
- `on_profile_trajectory` → `generate_candidate_trajectory()` (re)computes
  the candidate's trajectory prediction when profile fields that feed it
  change.
- `on_message_notify` / `on_connection_notify` / `on_match_notify` → insert a
  `notifications` row so `NotificationBell` (web) can surface it live.
- `trg_match_stage_seed` / `trg_match_stage_change` → keep `match_stage_history`
  in sync with a match's `stage` for the Hiring board's audit trail.

**Key `SECURITY DEFINER` RPCs:** `get_swipe_deck()`, `get_company_matches()`,
`get_candidate_trajectories()`, `get_university_candidates(school)`,
`get_my_submitted_jobs()` — each scoped to `auth.uid()` so RLS stays simple.

**Security:** Row Level Security (RLS) is enabled on every table. Users can
only read/write their own swipes, matches, resumes, and connection rows;
profiles, companies and roles are readable by any authenticated user.
Matching/deck/trajectory logic runs in `SECURITY DEFINER` functions scoped to
`auth.uid()`.

---

# Part D — Configuration / environment workflow

```
Mobile: .env.example ──copy──► .env
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...

Web:                          apps/web/.env.local
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
        │
        ▼
lib/supabase.ts (or src/lib/supabase.ts) computes isSupabaseConfigured
        │
        ├─ false ► client uses its own mock data module  (runs offline)
        └─ true  ► every screen/page switches to live Supabase queries
```

To go live (either client):

1. Run `supabase/schema.sql`, then `supabase/seed.sql`, in the Supabase SQL
   editor. Optionally run `supabase/seed_demo_data.sql` for 50 demo employers
   + 500 demo candidates (safe to re-run — see the header comment in that
   file for the animal-trait backfill it also runs).
2. Copy the matching env file for the client you're running and fill in the
   Supabase URL + anon key (see above).
3. Restart the client (Expo clears Metro's cache on start; Next.js just needs
   a dev-server restart to pick up `.env.local`).

---

# Part E — End-to-end summary

1. Either client boots → resolves fonts/theme → mounts its navigation
   (bottom tabs on mobile, portal sidebar on web).
2. Each screen/page calls its data-layer function (`repo.ts` on mobile,
   `lib/*.ts` per portal on web).
3. That function checks `isSupabaseConfigured`:
   - **No** → returns local mock data (instant prototype, works offline).
   - **Yes** → queries Supabase, with mock data as an error fallback.
4. Matching ranks companies by pgvector similarity; swipes are recorded; a DB
   trigger creates a match on mutual interest, which unlocks chat and (on
   the employer/university side) trajectory predictions and pipeline
   tracking.
5. Connections, profile, notifications, and the AI advisor (persona-aware on
   web) all follow the same configured-or-fallback pattern.

The result is a single Supabase backend behind two independently-runnable
clients, both of which demo instantly on mock data and scale to a live,
secured backend by adding the same two environment variables.
