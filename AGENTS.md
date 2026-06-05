# Liftit — Project Context

> Read this first if you're a new session picking up this project. Everything you need to be productive is here.

> **MAINTENANCE RULE (do not skip):** Every time you make a code change in this project, update this file in the same commit. Sections to keep current: file map, data model, XP system, bodygraph implementation, "things to NOT do", and the recent-changes note at the bottom. If you add a new file, list it. If you change a behavior the user relies on (XP formula, schema, tier colors, etc.), update the explanation.

## What this is

A gamified, mobile-first workout tracker. Track lifts → level up muscles → climb ranks → beat friends. Currently deployed to GitHub Pages, with a Supabase backend powering accounts, leaderboard, and image storage.

**Live URL:** `https://trislovesu.github.io/liftoff/`
**Repo:** github.com/Trislovesu/liftoff

**Owner / primary user:** Tristan (username preferences: simple, direct, prefers terse answers, dislikes filler).

## Stack

- **Frontend:** React 18 + Vite + Tailwind + Framer Motion + React Router (`HashRouter` because GH Pages)
- **Backend:** Supabase — Postgres (RPC-only access via SECURITY DEFINER functions) + Storage (public bucket)
- **Auth:** custom username + 4–8 digit PIN, SHA-256 hashed client-side with salt `liftit::v1`. No Supabase Auth, no email.
- **Hosting:** GitHub Pages via Actions workflow (`.github/workflows/deploy.yml`). Set `base: './'` in `vite.config.js` and `HashRouter` to avoid SPA 404s.
- **Persistence:** LocalStorage cache (`liftit.local.v1`) for workouts/history/user cache + sessionStorage credential (`liftit.session.v1`) for the current tab session + Supabase for cloud sync. UI updates instantly; cloud catches up via debounced `rpcSaveState` ~1.2s after state changes.

## Critical: external infra the user manages

1. **Supabase project URL + anon key** — loaded from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. For GitHub Pages, set these as repository secrets used by `.github/workflows/deploy.yml`. Local dev can copy `.env.example` to `.env.local`.
2. **Supabase Storage bucket `user-content`** — must exist, public, with policies for anon insert+select (defined in `supabase/schema.sql`).
3. **GitHub Actions workflow permissions** — Settings → Actions → General → Workflow permissions → "Read and write permissions".

If a new session needs to re-run the schema: paste `supabase/schema.sql` into Supabase SQL Editor. If a function signature changes, may need to `drop function if exists public.<fn_name>(...);` first because Postgres won't change return types.

## Folder structure

```
D:\Liftit\
├── .github/workflows/deploy.yml   GH Pages deploy on push to main
├── .env.example                    local env template for Supabase public config
├── index.html                      theme-color #131313 (Kinetic Dark Redux)
├── package.json                    React + Vite + Tailwind + Framer Motion + @supabase/supabase-js
├── tailwind.config.js              Kinetic Dark Redux theme tokens (red accent #ff0033)
├── vite.config.js                  base: './' for GH Pages
├── supabase/schema.sql             v2 schema — RPCs + storage policies, idempotent
└── src/
    ├── main.jsx                    HashRouter + AppProvider
    ├── App.jsx                     route table, auth gate
    ├── index.css                   Tailwind layers + Kinetic Dark Redux primitives + tier-effect keyframes
    ├── assets/bodygraph.png        the actual body image (user-supplied)
    ├── data/
    │   ├── muscles.js              11 muscle groups + red-edition status colors
    │   ├── exerciseLibrary.js      ~75 exercises (Chest, Back, Shoulders, Biceps, Triceps, Forearms, Abs, Quads, Hamstrings, Glutes, Calves)
    │   ├── mockLeaderboard.js      DEAD — leaderboard is real now (kept for ref)
    │   └── subMuscles.js           per-muscle sub-breakdowns (Lower Chest, Lats, etc.)
    ├── lib/
    │   ├── xp.js                   XP / level / rank math + sanity checks
    │   ├── tiers.js                muscle tier ladder (Bronze→Master + Legend) with new color ramp: blue→teal→gold→orange→purple
    │   ├── storage.js              LocalStorage primitives (also exists; legacy)
    │   ├── dates.js                week/day helpers
    │   ├── supabase.js             client + hashPin + ALL rpc* helpers + Realtime broadcast helpers + uploadImage()
    │   ├── gymStatus.js            gym location/status constants + status normalization helpers
    │   ├── exerciseMedia.js        optional cached exercise GIF/media reader; direct browser WorkoutX API calls disabled for key safety
    │   ├── exifDate.js             minimal JPEG EXIF DateTimeOriginal reader + checkPhotoIsRecent()
    │   └── funnyRejects.js         old-photo rejection lines + random compliments + lastTimeNudge()
    ├── store/
    │   └── AppContext.jsx          THE store — useReducer + actions. SINGLE seam between UI and Supabase.
    ├── components/
    │   ├── Avatar.jsx              universal avatar: URL → emoji → initial fallback
    │   ├── ActiveWorkoutLayer.jsx  active workout guard + background progress banner
    │   ├── AppTopBar.jsx           fixed Stitch-style top brand bar with avatar + glowing Z gym status/admin popover + global update alert
    │   ├── BodyHeaderStats.jsx     compact top bar on Body page (avatar, level, 🏋️ workouts, ⚡ weekly XP)
    │   ├── SignupOnboarding.jsx    post-signup animated avatar/emoji + gym/home setup flow
    │   ├── BodygraphTabs.jsx       only [Bodygraph, Gallery] — Leagues/Analytics removed
    │   ├── BodyFigure.jsx          DELETED (replaced by FrontBackBodyMap using image)
    │   ├── FrontBackBodyMap.jsx    THE bodygraph — image + SVG overlay paths. Includes drag-edit mode behind EDIT_MODE flag.
    │   ├── MuscleRankings.jsx      featured muscle card + sub-muscle rows + others list
    │   ├── FeaturedMuscleCard.jsx  big gold rank card
    │   ├── SubMuscleRow.jsx        sub-muscle list row
    │   ├── TierBadge.jsx           hex-shaped rank badge
    │   ├── RankBadge.jsx           round rank badge (used on profile)
    │   ├── RankCard.jsx            profile rank card with progress
    │   ├── MuscleCard.jsx          dashboard muscle preview
    │   ├── StatCard.jsx            dashboard stat tiles
    │   ├── XPProgressBar.jsx       progress bar primitive
    │   ├── BottomNav.jsx           Stitch-style fixed glass dock nav: Home, Log, disabled Body, Ranks, Profile
    │   └── Header.jsx              page header with back button
    └── pages/
        ├── Login.jsx               Stitch red-edition auth screen: LIFTIT hero, glass inputs, signup/login toggle, post-signup avatar prompt
        ├── Dashboard.jsx           Stitch red-edition dashboard: verified username welcome label, weekly weight graph, metric grid with Level/Rank detail sheets, collapsible recent muscles trained, recent lifts, floating start action
        ├── Workouts.jsx            list of saved workouts
        ├── WorkoutBuilder.jsx      Stitch custom-routine flow: routines home → select up to 3 muscles → organized library → editor. NO custom-exercise button.
        ├── WorkoutLogger.jsx       Stitch red-edition active session: timer/status header, completion bar, dense set table cards, FinishModal asks for pump pic.
        ├── WorkoutHistoryDetail.jsx  /history/:id — sets/reps/weight breakdown, XP, completion + pump bonuses
        ├── Body.jsx                bodygraph + rankings + gallery sub-tab
        ├── Gallery.jsx             pump pic feed, upload with EXIF check
        ├── Leaderboard.jsx         avatars, clickable player rows, 3 sort modes: All Time / This Week / Rank (tier-sorted)
        ├── ExerciseAbout.jsx       /exercise/:id — instructions, tips, mistakes
        ├── PublicProfile.jsx       /u/:username public profile view: featured PR, body weight, public routines
        └── Profile.jsx             avatar upload modal (or emoji), verification code modal, body weight, featured PR, level/rank, clickable history, sign out
```

## Data model (Supabase users table → AppContext shape)

The `app_save_state` RPC writes these fields back. The user object in React state is:

```js
{
  username, totalXP, weeklyXP, weekStart, streak, lastWorkoutDate,
  muscles: [{name, level, xp}],
  personalBests: { [exerciseKey]: { weight, reps } },
  lastSessions:  { [exerciseKey]: { weight, reps, date } },  // drives "last time" hints
  totalWorkouts,            // replaced streak as headline gym stat
  profilePicUrl,            // URL (Supabase storage) OR emoji char OR null
  gymType,                  // 'gym', 'home', or null from signup onboarding
  bodyWeightLbs, bodyWeightUpdatedAt,
  featuredLiftKeys,         // selected Big 3 lifts: bench, squat, deadlift
  featuredPRs,              // per-lift featured PR cards for Bench Press, Squat, Deadlift
  publicWorkouts,           // sanitized public routine snapshots for viewed profiles
  zionMemberCode, zionVerified,
  adminNotice               // e.g. "XP reset by admin"; shown then cleared client-side
}
```

`exerciseKey` is `libraryId || ex.name`.

`pump_photos` table is separate: `{ id, username, image_url, taken_at, caption, xp_bonus, created_at }`.

`gym_status` table is a single-row global status object for Highway Plaza / SunPlaza:
`{ id: 1, locations: [{ key, name, detail, status }], message, updated_by, updated_at }`.
Statuses are `open`, `closing_soon`, `closed`. Admin updates are restricted in SQL to username `tris` with a valid PIN hash. The row is public-read and added to `supabase_realtime`, and admin saves also send a direct Realtime broadcast so connected users receive status changes immediately without refresh. The client logs a console warning if the Realtime channel cannot subscribe.

`app_rate_limits` is an internal SECURITY DEFINER rate-limit bucket table. Public RPCs call `app_rate_limit(...)` server-side; anon/authenticated roles cannot read it or execute helper functions directly.

Public profile viewing uses `app_public_profile(username)` and only returns public-facing fields: rank stats, avatar, body weight/timestamp, featured PR, and `public_workouts`. Full workout history remains local/private.

Admin account management is SQL-only through SECURITY DEFINER RPCs. `tris` can list accounts, soft-disable accounts (`disabled_by_admin = true`, login raises `Account disabled by admin`), and reset XP (`admin_notice = 'XP reset by admin'`). `app_save_state` intentionally preserves reset XP/muscles while that notice is active so stale LocalStorage cannot undo an admin reset.

## XP system (v2 — current)

Per completed set:
```
xp = (10 + weight*0.15 + reps*1.2 + (weight*reps)*0.04 + (50 if PR))
     * (1 + min(1.2, (weight*reps)/1800))
```

Heavy compound sets get up to ~2.2× multiplier. Bodyweight high-rep sets still give meaningful XP.

Per workout:
- Sum of set XP
- + `WORKOUT_COMPLETION_BONUS` (25) — flat bonus per finished workout
- + `PUMP_PIC_BONUS` (75) if a pump pic was attached at finish

Muscle XP from a workout: primary muscle gets 70% of an exercise's XP, secondaries get 15% each.

Profile level curve: `100 * level^1.4`. Muscle level curve: `200 + 50*level`.

Ranks (`RANKS` in `xp.js`): Bronze (0) → Silver (2500) → Gold (7500) → Platinum (15000) → Diamond (30000) → Master (60000) → Legend (100000).

## Muscle tiers (separate from ranks)

In `lib/tiers.js`. Each muscle has its own level → tier mapping (Bronze I → Master III, then Legend). Colors follow strength gradient: gray (untrained) → blue (Bronze) → teal (Silver) → gold (Gold) → orange (Platinum) → purple (Diamond/Master) → red (Legend).

## Bodygraph implementation

- Uses `src/assets/bodygraph.png` (a static muscle-anatomy reference image) as the visual base.
- 30 SVG `<path>` overlay zones positioned with percent coords (viewBox 0–100, `preserveAspectRatio="none"`). Multiple paths can share a muscle name (eg, left+right pec both = "Chest", and "Back" has 4 paths: traps spear + L/R lat wings + center lower-back).
- **Resting state is intentionally subtle** — untrained muscles are invisible, ranked muscles show only a faint tinted outline. Tier glow + animation (`tier-diamond`, `tier-master`, `tier-legend` keyframes in `index.css`) fires *only when that muscle is selected*, not constantly. This was a deliberate change after feedback that the always-on glow was distracting.
- **Built-in overlay editor:** flip `EDIT_MODE = true` in `FrontBackBodyMap.jsx` to use. Supports:
  - **Drag** any overlay to reposition
  - **Arrow keys** nudge selected by 0.5 (Shift = 0.1)
  - **Muscle dropdown** in panel: relabel any overlay's muscle on the fly
  - **🗑 Delete / Delete key** removes the selected overlay (with confirm)
  - **✎ Draw New** enters polygon-draw mode: click points on the body (≥3), pick muscle from dropdown, Enter/✓ Finish closes the path and appends it. Backspace undoes last point, Esc cancels.
  - **In-SVG label tag** shows selected overlay's muscle name floating near its centroid
  - **Copy Paths** exports the final OVERLAYS array (drawn + deleted + relabeled + nudged all baked in)
- There's also `DEBUG_OVERLAYS` flag for static red-hitbox visualization without the editor panel.
- Internal model: the editor stores everything in a single `items` array (`{ muscle, d, transform }`), not separate arrays for transforms/drafts/deletes. Cleaner state, easier export.

## Pump pic flow

1. WorkoutLogger.FinishModal or Gallery upload → `<input type="file" capture="environment">`
2. `checkPhotoIsRecent(file)` in `lib/exifDate.js` reads JPEG EXIF DateTimeOriginal, falls back to `file.lastModified`.
3. If photo > 2 hours old → reject with a random funny line from `funnyRejects.js`.
4. If ok → `uploadImage(file, 'pumps', username)` → public URL.
5. `rpcSavePumpPhoto` writes a row to `pump_photos`.
6. Finish modal adds +75 XP bonus; finalized in reducer's `LOG_WORKOUT` action.

## Things to NOT do unless asked

- Don't add streaks back. Replaced with `totalWorkouts`.
- Don't add fake currencies (gems, coins, diamonds, loot). Stick to fitness stats.
- Don't add AI workout generation. Manual lift logging only.
- Don't add custom exercise creation in the builder — only library exercises (muscle mapping depends on it).
- Don't add payments.
- Don't put paid/secret third-party API keys in Vite/browser code. Anything named `VITE_*` is public in the built site; use a server/proxy first.
- Don't expose full local workout history publicly. Only routines explicitly marked Public in the builder should appear on viewed profiles.
- Don't hard-code Zion Fitness House database validation yet. For now, the verified badge accepts any 5 digit numeric member code for testing.
- Don't redesign the bodygraph from scratch. The image is the visual source of truth; we only adjust overlays.
- Don't change unrelated pages when asked to fix one thing.

## Style notes / preferences

- Tristan likes short, direct answers — no filler, no recaps, no "I'm now going to…" prefaces.
- No emojis in code unless they're already used or it's user-facing UI text where they fit.
- Kinetic Dark Redux theme from Stitch: deep charcoal surfaces (`#0a0a0a`, `#131313`, `#1a1a1a`) with primary red accent `#ff0033`.
- Typography uses Sora for bold/headline/metric moments and Geist for body/UI text, loaded in `index.html`.
- Mobile-first. The "viewport" is a single column max-w-md mx-auto.
- Persisted user data must never break across deploys. Use `JSON.parse` try/catch + null fallback in storage helpers.

## Visual design conventions (current)

- **Buttons:** Kinetic Dark Redux — primary is solid red with subtle red glow; ghost is charcoal with red stroke. Defined in `src/index.css` under `.btn-primary` / `.btn-ghost`.
- **Cards:** `.card` is the general charcoal card. `.glass-card` and `.glass-input` are the Stitch screenshot primitives for the redesigned screens.
- **Navigation:** Authed pages use fixed `AppTopBar` plus the fixed glass `BottomNav`. Page content starts below the top bar through `App.jsx` padding.
- **Body overlays:** rest = invisible/dim outline only; selected = soft tier-color glow + white stroke. Tier pulse/fire only when selected. **Don't** restore always-on glow.

## Common gotchas

- **`base: './'` + HashRouter** required for GH Pages — don't change.
- **Postgres RPC return-type changes** require `DROP FUNCTION` first.
- **Storage bucket `user-content`** must be PUBLIC, otherwise image URLs 401.
- **Storage inserts are intentionally constrained** by `supabase/schema.sql` to `avatars/<username>/<uuid>.<image-ext>` and `pumps/<username>/<uuid>.<image-ext>`, image MIME types only, max 5MB. Re-run the schema after changing upload behavior.
- **HEIC photos** don't have parseable EXIF in our reader → falls back to `file.lastModified`. Works but less trustworthy.
- **PWA-like camera capture** uses `<input type="file" accept="image/*" capture="environment">`. On desktop browsers this just opens a file picker.
- **Workouts and history are PER-USER and stored in LocalStorage**, not in Supabase yet. Only the user profile + pump photos sync. To make workouts follow users across devices, lift them into Supabase later.
- **Public routines are snapshots**, not full synced workout history. `publicWorkouts` is derived from local routines where `isPublic` is true and saved on the user row for profile viewing.
- **Mock leaderboard data** (`src/data/mockLeaderboard.js`) is no longer used but kept for reference.
- **Exercise GIF/media cache** is optional. `src/lib/exerciseMedia.js` reads `liftit.exerciseMedia.v1` only; direct WorkoutX browser calls were removed because Vite-exposed API keys are public.

## Quick commands

```powershell
# Run dev server
cd D:\Liftit
npm run dev

# Push
git add .
git commit -m "..."
git push

# Re-run schema after editing supabase/schema.sql:
# paste it into Supabase → SQL Editor → Run. If a function returns table:
# drop function if exists public.<fn>(...);
```

## What's NOT built yet (logical next moves)

- Photo verification — confirm it's actually the user (deferred from the pump pic feature).
- Workouts + history syncing to Supabase (currently per-device per-user via LocalStorage).
- Friend system (currently anyone with an account shows in leaderboard).
- Push notifications for streak reminders / friend activity.
- Visual rank-up celebration when a muscle / profile hits a new tier.

## File-by-file summary of what each major file does

| File | Purpose |
|---|---|
| `App.jsx` | Routes. Authed-only routes wrapped in a `status === 'authed'` guard; includes Dianna-only login intro before entering the app. |
| `store/AppContext.jsx` | The store. Reducer handles `BOOT_UNAUTHED`, `AUTH_SUCCESS`, Dianna login intro state, `LOG_WORKOUT` (computes XP, muscles, lastSessions, totalWorkouts, Big 3 featured PRs), active workout state, `SAVE_WORKOUT`, `PATCH_USER`. Exposes `actions = { signup, login, signOut, setProfilePic, setBodyWeight, setFeaturedLiftKeys, setZionMemberCode, clearAdminNotice, saveWorkout, deleteWorkout, logWorkout, startActiveWorkout, patchActiveWorkout, endActiveWorkout }`. Debounced cloud sync via `rpcSaveState`. |
| `lib/supabase.js` | Client + `hashPin`, RPC helpers, gym-status and leaderboard realtime subscription/broadcast helpers, and `uploadImage`. |
| `lib/gymStatus.js` | Global gym-status location constants, default status, status colors, and normalizer. |
| `lib/exerciseMedia.js` | Optional exercise media cache reader, keyed by exercise name in LocalStorage. No direct paid API calls from the browser. |
| `lib/xp.js` | `RANKS`, `rankFor`, `rankIndex`, `levelFromXP`, `muscleProgress`, `applyMuscleXP`, `xpForSet`, `WORKOUT_COMPLETION_BONUS`, `PUMP_PIC_BONUS`, `sanityCheckSet`. |
| `lib/tiers.js` | `TIERS` + `tierForLevel(level)`. Color ramp matches user's strength legend. |
| `data/muscles.js` | Muscle group names + red-edition status colors used by preview cards. |
| `lib/exifDate.js` | `readPhotoTakenAt` + `checkPhotoIsRecent` (uses funny rejections). |
| `lib/funnyRejects.js` | `funnyOldPhotoReject(ageMs)`, `randomCompliment()`, `lastTimeNudge(weight, reps)`. |
| `components/Avatar.jsx` | `<Avatar user size ring />`. Handles URL vs emoji vs initial. |
| `components/ActiveWorkoutLayer.jsx` | Global active-workout guard. Prompts once before leaving an active logger, can run workout in background, and shows a top progress banner that returns to the logger. |
| `components/VerifiedName.jsx` | Username + glowing verified tick shown when `zionVerified` is true. |
| `components/AppTopBar.jsx` | Fixed top brand bar matching the Stitch red screenshots; glowing Z opens gym status. Admin controls and account list appear only for `tris`; admin update messages appear as a themed on-screen alert outside the Z panel. |
| `components/SignupOnboarding.jsx` | Animated post-signup flow: upload photo or choose emoji, then choose Gym/Home training setup. |
| `components/FrontBackBodyMap.jsx` | THE bodygraph. Image + overlays + full editor (drag/draw/delete/relabel) gated behind `EDIT_MODE` constant. |
| `pages/Dashboard.jsx` | Home dashboard. Weekly Progress charts weekly lifted weight volume, Level and Rank metric cards open minimal themed detail sheets, Recent Muscles Trained is a collapsible list derived from latest `muscleGain`, and the old pro-advice card is removed. |
| `pages/WorkoutBuilder.jsx` | Custom routine flow from Stitch: home/search, create-new muscle selection up to 3, organized library, routine editor with Add from library, and Public/Private profile visibility toggle. |
| `pages/WorkoutLogger.jsx` | Log sets. `FinishModal` asks for pump pic → Supabase storage → +75 XP. |
| `pages/Gallery.jsx` | Pump pic feed + standalone upload. |
| `pages/PublicProfile.jsx` | Public player profile for `/u/:username`; shows body weight recency, featured PR, and public routine snapshots. |
| `.env.example` | Template for required Vite Supabase env vars. |
| `supabase/schema.sql` | Schema, RPCs, rate-limit helpers, storage policies. Idempotent. |

## Recent changes log

Newest at top. Keep this trimmed to the last ~10 entries — older context is captured in the file map / sections above.

- **Big 3 PRs + active workout background:** featured PRs are now limited to Bench Press, Squat, and Deadlift, and users can show all three. Active workouts prompt once when leaving the logger; choosing background shows a top progress banner with elapsed time and set progress that jumps back into the workout. Gym status alerts are now solid animated boxes. Admin account list SQL was qualified to avoid ambiguous `username` references.
- **Admin + verified + dashboard cleanup:** admin panel now shows RPC errors, lists account rows, can soft-disable users and reset XP. Disabled users get `Account disabled by admin` on login; reset users see `XP reset by admin`, and stale local sync cannot restore reset XP. Signup onboarding and Profile now accept an optional 5 digit Zion Fitness House code and show a glowing verified tick beside usernames. Dashboard replaced Muscle Fatigue with a collapsible Recent Muscles Trained section and removed the pro-advice panel.
- **Public profiles + PR upgrades:** leaderboard rows now open `/u/:username` public profiles. Users can set body weight during onboarding and edit it in Profile with a timestamp. Routine builder has a Public/Private toggle; only public routine snapshots show on viewed profiles. Users can choose a featured routine, and the next logged top set for that routine becomes the profile PR card with `NEW`/heavier-than-last-time tags and intensity-based border animation. Workout logger weight/reps inputs now use numeric text fields without spinner controls. Gym status alerts auto-dismiss after 5 seconds.
- **Security/env hardening:** Supabase URL/anon key moved out of source into Vite env vars and GitHub Actions secrets. Added CSP in `index.html`, broadened `.gitignore` for env files, added `.env.example`, moved `pin_hash` session storage from LocalStorage to sessionStorage, disabled direct browser WorkoutX API calls, made gym-status broadcasts refresh from the database instead of trusting client payloads, and added Supabase RPC rate limits + stricter image storage policies.
- **Dianna custom profile:** created Supabase user `dianna` with PIN `6767` and heart avatar. Logging in as Dianna triggers a one-time smooth themed intro with a heart and the text `hello my beatiful helper`, then carries her into the app normally. Intro is login-only, not shown on refresh/boot, and does not affect other users.
- **Polish/onboarding/fatigue pass:** Weekly Progress now charts weekly lifted weight volume instead of XP. Added global transition polish and route fade-ins. New signups go through animated avatar/emoji selection followed by Gym/Home setup (`gym_type` in Supabase). Leaderboard refreshes live through Realtime broadcast after cloud sync. Dashboard `Muscle Rankings` became `Muscle Fatigue`, calculated from recent logged muscle work with a 42-72 hour recovery decay and tap-for-estimate detail sheet. Bottom Body tab is disabled/gray for now.
- **Gym update alert:** admin `Update message` no longer appears inside the Z status dropdown. When a new gym status message is pushed, users see a dismissible themed alert on the main screen; message seen-state is separate from opening the Z panel, and incoming messages close the panel so the alert is visible. The Z button still shows the small red unread indicator.
- **Realtime gym status + leaner dashboard:** gym status now subscribes to Supabase Realtime and admin saves broadcast directly to connected users without refresh; subscription/broadcast failures warn in the browser console. Dashboard welcome keeps only the small welcome label; the large rotating motivation sentence was removed. Level detail sheet keeps only `Next milestone` and `Milestone XP needed` boxes; milestones are every 50 levels up to 500.
- **Dashboard stat detail sheets:** Level and Rank cards are now the only clickable metric cards. Level opens a clean path-to-500 sheet with current level progress and milestone XP. Rank opens the full rank ladder with current-rank indicator and XP to next rank. Workouts and Weekly XP remain non-interactive.
- **Workout library flow + status copy cleanup:** gym status popover now shows a bigger `Zion Fitness Status` label with no availability heading; location cards show `Highway Plaza` and `SunPlaza` only. WorkoutBuilder now follows the Stitch custom-routine flow: routine home first, Create New Routine reveals up-to-3 muscle selection, Next opens an organized library, and the editor only shows routine name plus `Add from library`. Added optional `exerciseMedia.js` cache for WorkoutX-style exercise GIF thumbnails with local fallback.
- **Cleanup + gym status/admin:** log cards and inputs made rounder; dashboard welcome now uses username + daily motivation; top-right bell replaced by glowing `Z` gym status popover for Zion Fitness House / Highway Plaza and SunPlaza; `tris` gets an admin-only panel to change status and view accounts; profile history is collapsed by default; dashboard advice card uses latest pump pic when available; schema adds `gym_status` + admin RPCs.
- **Stitch screenshot redesign pass:** Login, Dashboard, WorkoutLogger, AppTopBar, BottomNav, and core screenshot primitives now mirror the red-edition Stitch screens structurally: LIFTIT hero auth, fixed top brand bar, glass metric cards, dashboard line chart, recent lift rows, floating start button, active-session timer/completion header, dense set tables, and fixed finish CTA.
- **Stitch red theme applied:** app styling updated to Stitch's latest red edition, `Kinetic Dark Redux` (`#ff0033` accent, charcoal surfaces, Sora/Geist typography). Shared primitives (`.card`, `.btn-primary`, `.btn-ghost`, `.input`, progress bars, stat cards, bottom nav) and page-level leftovers across login, dashboard/stats overview, gallery, leaderboard, builder modal, and profile modal now inherit the red edition.
- **Overlays fully redrawn:** Tristan used the editor's Draw Mode to retrace every muscle from scratch. New layout has 30 paths total (4 Glutes paths instead of 2, polyline-style shapes instead of bezier curves for most zones). Some muscles missing from the new pass (hamstrings on back, rhomboids) — if needed, redraw via the editor again.
- **Editor v2 (FrontBackBodyMap):** added Draw mode (click points to define a polygon), Delete selected, muscle-relabel dropdown, in-SVG label tag, unified `items` state model in place of separate transforms array. `EDIT_MODE = true` flag at top of the file.
- **Visual polish:** body-map glow toned down (resting = faint outline only, glow + tier effects only when selected). Buttons modernized in `index.css` — glass gradient + white border + inset highlight + soft outer glow. Cards refined with translucent bg + backdrop blur + top-edge highlight.
- **Major feature pass:** ~75-exercise library; XP formula now volume-weighted (`(weight*reps)*0.04` bonus + multiplier up to 2.2×); streak replaced by `totalWorkouts` counter; Leagues/Analytics tabs removed (only Bodygraph + Gallery); Gallery is now a real pump-pic feed with EXIF check + funny rejection messages; profile pictures via Supabase Storage (or emoji default) — post-signup prompt + editable modal in Profile; workout history clickable → `/history/:id` shows full set/rep/weight breakdown; `lastSessions` drives subtle "last time" hint in WorkoutLogger; leaderboard rows use avatar instead of tier letter + new Rank sort tab; tier-glow effects on body map; muscle-group filter in WorkoutBuilder (relevance-sorted library); Custom-exercise button removed; sanity check before workout finish; Supabase schema v2 with `total_workouts`, `profile_pic_url`, `last_sessions` columns + `pump_photos` table + new RPCs.
