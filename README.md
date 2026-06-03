# Liftit

A gamified, mobile-first workout tracker. Track lifts → level up muscles → climb ranks → beat your friends. Built with React + Vite + Tailwind + Framer Motion. State persists to LocalStorage so progress survives reloads.

> _"Duolingo / ranked game progression, but for gym workouts."_

## Setup

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Build for production:
```bash
npm run build
npm run preview
```

## Folder structure

```
src/
  App.jsx                  # Router + layout shell
  main.jsx                 # ReactDOM entry, wraps AppProvider
  index.css                # Tailwind + design tokens (.card, .btn, etc.)

  data/
    muscles.js             # Muscle groups, status tiers (Beginner → Elite)
    exerciseLibrary.js     # Built-in exercises + "About" content
    mockLeaderboard.js     # Mock friends for the leaderboard

  lib/
    xp.js                  # XP math, level curve, rank thresholds
    storage.js             # LocalStorage load/save
    dates.js               # Streak / week helpers

  store/
    AppContext.jsx         # Single source of truth (reducer + actions)
                           # Swap LocalStorage for an API by replacing this file.

  components/
    XPProgressBar.jsx
    StatCard.jsx
    RankCard.jsx
    RankBadge.jsx
    MuscleCard.jsx
    BottomNav.jsx
    Header.jsx

  pages/
    Dashboard.jsx          # Profile, rank, streak, recent, muscles
    Workouts.jsx           # List of user workouts
    WorkoutBuilder.jsx     # Create / edit workout (+ library picker)
    WorkoutLogger.jsx      # Log sets/reps/weight, awards XP on finish
    BodyMap.jsx            # Front/back silhouette with glowing muscles
    Leaderboard.jsx        # Mock ranked list (Total XP / Weekly XP)
    ExerciseAbout.jsx      # Instructions / form tips / mistakes
    Profile.jsx            # Edit name, history, reset
```

## XP system

Per completed set:

```
xp = 10 (base) + weight*0.1 + reps*1 + (50 if new PR)
```

Per workout:

```
total = sum(set xp) + streak * 5
```

XP is added to:
- **Profile total XP** → drives Level (curve: `100 * level^1.4`) and Rank (Bronze → Legend).
- **Targeted muscles** → primary muscle gets 70% of an exercise's XP, secondaries get 15% each. Each muscle has its own level (`200 + 50*level` per level), with status tiers Untrained → Elite.
- **Weekly XP** → drives the weekly leaderboard. Auto-resets each Monday.
- **Streak** → +1 day if logged the day after the previous one, resets otherwise.

All numbers live in `src/lib/xp.js` and `src/data/muscles.js` — tweak in one place.

## Replacing mock data with a real backend

The whole app reads/writes through `useApp()` from `src/store/AppContext.jsx`. To plug in a backend later:

1. Replace `loadState` / `saveState` (in `lib/storage.js`) with API calls, **or**
2. Swap the reducer cases inside `AppContext.jsx` for async API calls.

The component layer doesn't import LocalStorage directly — it only knows about `state` and `actions`.

For the leaderboard, replace `MOCK_LEADERBOARD` in `src/data/mockLeaderboard.js` with a fetch — the `me` row is already merged at render time in `pages/Leaderboard.jsx`.

## What's intentionally NOT here yet

- Auth / accounts
- Real backend / friends
- AI workout generation
- Payments

These can layer on top of the current shape without rewriting the UI.
