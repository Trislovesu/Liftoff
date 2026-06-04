export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Quads', 'Hamstrings', 'Glutes', 'Calves'
]

export const MUSCLE_STATUS = [
  { name: 'Untrained', min: 0,  color: '#64748b' },
  { name: 'Beginner',  min: 1,  color: '#ffb3af' },
  { name: 'Active',    min: 4,  color: '#ff5357' },
  { name: 'Strong',    min: 8,  color: '#ff0033' },
  { name: 'Beast',     min: 12, color: '#bf0024' },
  { name: 'Elite',     min: 18, color: '#ffdad8' }
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
