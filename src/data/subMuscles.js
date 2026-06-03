import { tierForLevel } from '../lib/tiers.js'

// Sub-muscle breakdown per main muscle group. Used by the rankings list.
// Easy to swap for per-exercise-derived data later — structure is just
// { parent: [subName, ...] }.
export const SUB_MUSCLES = {
  Chest:      ['Upper Chest', 'Mid Chest', 'Lower Chest'],
  Back:       ['Lats', 'Traps', 'Rhomboids', 'Lower Back'],
  Shoulders:  ['Front Delts', 'Side Delts', 'Rear Delts'],
  Biceps:     ['Long Head', 'Short Head'],
  Triceps:    ['Long Head', 'Lateral Head', 'Medial Head'],
  Forearms:   ['Flexors', 'Extensors'],
  Abs:        ['Upper Abs', 'Lower Abs', 'Obliques'],
  Quads:      ['Vastus Lateralis', 'Vastus Medialis', 'Rectus Femoris'],
  Hamstrings: ['Biceps Femoris', 'Semitendinosus'],
  Glutes:     ['Glute Max', 'Glute Med'],
  Calves:     ['Gastrocnemius', 'Soleus']
}

// Deterministic stable offsets so each sub-muscle hovers near the parent level
// but with a little variance — gives that "leaderboard of sub-ranks" feel
// without needing per-sub XP data yet.
const OFFSETS = [0, -1, 1, -2, 2]

export function subMuscleTiers(muscleName, parentLevel) {
  const subs = SUB_MUSCLES[muscleName] || []
  return subs.map((name, i) => {
    const lvl = Math.max(0, parentLevel + (OFFSETS[i] ?? 0))
    return { name, level: lvl, tier: tierForLevel(lvl) }
  })
}
