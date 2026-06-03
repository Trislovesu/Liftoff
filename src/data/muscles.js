export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Quads', 'Hamstrings', 'Glutes', 'Calves'
]

export const MUSCLE_STATUS = [
  { name: 'Untrained', min: 0,  color: '#64748b' },
  { name: 'Beginner',  min: 1,  color: '#38e1b0' },
  { name: 'Active',    min: 4,  color: '#7c5cff' },
  { name: 'Strong',    min: 8,  color: '#ffcc4d' },
  { name: 'Beast',     min: 12, color: '#ff8a3d' },
  { name: 'Elite',     min: 18, color: '#ff5e7a' }
]

export function statusForLevel(level) {
  let s = MUSCLE_STATUS[0]
  for (const r of MUSCLE_STATUS) if (level >= r.min) s = r
  return s
}

export function createInitialMuscles() {
  return MUSCLE_GROUPS.map(name => ({
    name,
    level: 0,
    xp: 0
  }))
}
