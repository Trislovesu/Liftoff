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
- **Persistence:** LocalStorage cache (`liftit.local.v1`, `liftit.session.v1`) + Supabase for cloud sync. UI updates instantly; cloud catches up via debounced `rpcSaveState` ~1.2s after state changes.

## Critical: external infra the user manages

1. **Supabase project URL + anon key** — hardcoded in `src/lib/supabase.js`. Safe to commit (RLS-locked).
2. **Supabase Storage bucket `user-content`** — must exist, public, with policies for anon insert+select (defined in `supabase/schema.sql`).
3. **GitHub Actions workflow permissions** — Settings → Actions → General → Workflow permissions → "Read and write permissions".

If a new session needs to re-run the schema: paste `supabase/schema.sql` into Supabase SQL Editor. If a function signature changes, may need to `drop function if exists public.<fn_name>(...);` first because Postgres won't change return types.

## Folder structure

```
D:\Liftit\
├── .github/workflows/deploy.yml   GH Pages deploy on push to main
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
    │   ├── supabase.js             client + hashPin + ALL rpc* helpers + uploadImage()
    │   ├── exifDate.js             minimal JPEG EXIF DateTimeOriginal reader + checkPhotoIsRecent()
    │   └── funnyRejects.js         old-photo rejection lines + random compliments + lastTimeNudge()
    ├── store/
    │   └── AppContext.jsx          THE store — useReducer + actions. SINGLE seam between UI and Supabase.
    ├── components/
    │   ├── Avatar.jsx              universal avatar: URL → emoji → initial fallback
    │   ├── BodyHeaderStats.jsx     compact top bar on Body page (avatar, level, 🏋️ workouts, ⚡ weekly XP)
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
    │   ├── BottomNav.jsx           5-tab nav: Home, Workouts, Body, Ranks, Profile
    │   └── Header.jsx              page header with back button
    └── pages/
        ├── Login.jsx               username + PIN, post-signup avatar prompt
        ├── Dashboard.jsx           profile hero, rank card, stats, recent (clickable to /history/:id), top muscles
        ├── Workouts.jsx            list of saved workouts
        ├── WorkoutBuilder.jsx      create/edit. Library picker sorts by selected target muscles. NO custom-exercise button.
        ├── WorkoutLogger.jsx       log sets. Shows last-time nudges. Sanity-checks before finish. FinishModal asks for pump pic.
        ├── WorkoutHistoryDetail.jsx  /history/:id — sets/reps/weight breakdown, XP, completion + pump bonuses
        ├── Body.jsx                bodygraph + rankings + gallery sub-tab
        ├── Gallery.jsx             pump pic feed, upload with EXIF check
        ├── Leaderboard.jsx         avatars, 3 sort modes: All Time / This Week / Rank (tier-sorted)
        ├── ExerciseAbout.jsx       /exercise/:id — instructions, tips, mistakes
        └── Profile.jsx             avatar upload modal (or emoji), level/rank, clickable history, sign out
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
  profilePicUrl             // URL (Supabase storage) OR emoji char OR null
}
```

`exerciseKey` is `libraryId || ex.name`.

`pump_photos` table is separate: `{ id, username, image_url, taken_at, caption, xp_bonus, created_at }`.

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
- **Cards:** `.card` uses charcoal tonal layering, subtle border, backdrop blur, and a minimal inset highlight. Prefer `.card` over raw `bg-bg-800` divs for content containers.
- **Body overlays:** rest = invisible/dim outline only; selected = soft tier-color glow + white stroke. Tier pulse/fire only when selected. **Don't** restore always-on glow.

## Common gotchas

- **`base: './'` + HashRouter** required for GH Pages — don't change.
- **Postgres RPC return-type changes** require `DROP FUNCTION` first.
- **Storage bucket `user-content`** must be PUBLIC, otherwise image URLs 401.
- **HEIC photos** don't have parseable EXIF in our reader → falls back to `file.lastModified`. Works but less trustworthy.
- **PWA-like camera capture** uses `<input type="file" accept="image/*" capture="environment">`. On desktop browsers this just opens a file picker.
- **Workouts and history are PER-USER and stored in LocalStorage**, not in Supabase yet. Only the user profile + pump photos sync. To make workouts follow users across devices, lift them into Supabase later.
- **Mock leaderboard data** (`src/data/mockLeaderboard.js`) is no longer used but kept for reference.

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
| `App.jsx` | Routes. Authed-only routes wrapped in a `status === 'authed'` guard. |
| `store/AppContext.jsx` | The store. Reducer handles `BOOT_UNAUTHED`, `AUTH_SUCCESS`, `LOG_WORKOUT` (computes XP, muscles, lastSessions, totalWorkouts), `SAVE_WORKOUT`, `PATCH_USER`. Exposes `actions = { signup, login, signOut, setProfilePic, saveWorkout, deleteWorkout, logWorkout }`. Debounced cloud sync via `rpcSaveState`. |
| `lib/supabase.js` | Client + `hashPin`, `rpcSignup`, `rpcLogin`, `rpcSaveState`, `rpcLeaderboard`, `rpcSavePumpPhoto`, `rpcGetPumpPhotos`, `uploadImage`. |
| `lib/xp.js` | `RANKS`, `rankFor`, `rankIndex`, `levelFromXP`, `muscleProgress`, `applyMuscleXP`, `xpForSet`, `WORKOUT_COMPLETION_BONUS`, `PUMP_PIC_BONUS`, `sanityCheckSet`. |
| `lib/tiers.js` | `TIERS` + `tierForLevel(level)`. Color ramp matches user's strength legend. |
| `data/muscles.js` | Muscle group names + red-edition status colors used by preview cards. |
| `lib/exifDate.js` | `readPhotoTakenAt` + `checkPhotoIsRecent` (uses funny rejections). |
| `lib/funnyRejects.js` | `funnyOldPhotoReject(ageMs)`, `randomCompliment()`, `lastTimeNudge(weight, reps)`. |
| `components/Avatar.jsx` | `<Avatar user size ring />`. Handles URL vs emoji vs initial. |
| `components/FrontBackBodyMap.jsx` | THE bodygraph. Image + overlays + full editor (drag/draw/delete/relabel) gated behind `EDIT_MODE` constant. |
| `pages/WorkoutLogger.jsx` | Log sets. `FinishModal` asks for pump pic → Supabase storage → +75 XP. |
| `pages/Gallery.jsx` | Pump pic feed + standalone upload. |
| `supabase/schema.sql` | Schema, RPCs, storage policies. Idempotent. |

## Recent changes log

Newest at top. Keep this trimmed to the last ~10 entries — older context is captured in the file map / sections above.

- **Stitch red theme applied:** app styling updated to Stitch's latest red edition, `Kinetic Dark Redux` (`#ff0033` accent, charcoal surfaces, Sora/Geist typography). Shared primitives (`.card`, `.btn-primary`, `.btn-ghost`, `.input`, progress bars, stat cards, bottom nav) and page-level leftovers across login, dashboard/stats overview, gallery, leaderboard, builder modal, and profile modal now inherit the red edition.
- **Overlays fully redrawn:** Tristan used the editor's Draw Mode to retrace every muscle from scratch. New layout has 30 paths total (4 Glutes paths instead of 2, polyline-style shapes instead of bezier curves for most zones). Some muscles missing from the new pass (hamstrings on back, rhomboids) — if needed, redraw via the editor again.
- **Editor v2 (FrontBackBodyMap):** added Draw mode (click points to define a polygon), Delete selected, muscle-relabel dropdown, in-SVG label tag, unified `items` state model in place of separate transforms array. `EDIT_MODE = true` flag at top of the file.
- **Visual polish:** body-map glow toned down (resting = faint outline only, glow + tier effects only when selected). Buttons modernized in `index.css` — glass gradient + white border + inset highlight + soft outer glow. Cards refined with translucent bg + backdrop blur + top-edge highlight.
- **Major feature pass:** ~75-exercise library; XP formula now volume-weighted (`(weight*reps)*0.04` bonus + multiplier up to 2.2×); streak replaced by `totalWorkouts` counter; Leagues/Analytics tabs removed (only Bodygraph + Gallery); Gallery is now a real pump-pic feed with EXIF check + funny rejection messages; profile pictures via Supabase Storage (or emoji default) — post-signup prompt + editable modal in Profile; workout history clickable → `/history/:id` shows full set/rep/weight breakdown; `lastSessions` drives subtle "last time" hint in WorkoutLogger; leaderboard rows use avatar instead of tier letter + new Rank sort tab; tier-glow effects on body map; muscle-group filter in WorkoutBuilder (relevance-sorted library); Custom-exercise button removed; sanity check before workout finish; Supabase schema v2 with `total_workouts`, `profile_pic_url`, `last_sessions` columns + `pump_photos` table + new RPCs.
