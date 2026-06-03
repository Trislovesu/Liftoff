// Pure XP / level / rank math. All numbers tweakable in one place.

export const RANKS = [
  { name: 'Bronze',   min: 0,      color: '#cd7f32', glow: 'rgba(205,127,50,0.4)' },
  { name: 'Silver',   min: 2500,   color: '#c0c0c0', glow: 'rgba(192,192,192,0.4)' },
  { name: 'Gold',     min: 7500,   color: '#ffcc4d', glow: 'rgba(255,204,77,0.5)' },
  { name: 'Platinum', min: 15000,  color: '#c5d0e6', glow: 'rgba(197,208,230,0.5)' },
  { name: 'Diamond',  min: 30000,  color: '#7ee8ff', glow: 'rgba(126,232,255,0.55)' },
  { name: 'Master',   min: 60000,  color: '#b388ff', glow: 'rgba(179,136,255,0.55)' },
  { name: 'Legend',   min: 100000, color: '#ff5e7a', glow: 'rgba(255,94,122,0.6)' }
]

export function rankFor(totalXP) {
  let current = RANKS[0]
  let next = null
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXP >= RANKS[i].min) {
      current = RANKS[i]
      next = RANKS[i + 1] ?? null
    }
  }
  const xpIntoRank = totalXP - current.min
  const xpForNext = next ? next.min - current.min : 0
  const progress = next ? Math.min(1, xpIntoRank / xpForNext) : 1
  const xpToNext = next ? next.min - totalXP : 0
  return { current, next, progress, xpToNext }
}

// Profile level: smooth curve. level n requires sum_{i=1..n} 100*i^1.4 XP.
export function levelFromXP(totalXP) {
  let level = 1
  let accum = 0
  while (true) {
    const need = Math.round(100 * Math.pow(level, 1.4))
    if (accum + need > totalXP) {
      return {
        level,
        xpIntoLevel: totalXP - accum,
        xpForLevel: need,
        progress: (totalXP - accum) / need
      }
    }
    accum += need
    level += 1
    if (level > 999) return { level, xpIntoLevel: 0, xpForLevel: 1, progress: 1 }
  }
}

// Muscle level curve: each muscle level needs 200 + 50*level XP.
export function muscleXPForLevel(level) { return 200 + 50 * level }
export function muscleProgress(muscle) {
  const need = muscleXPForLevel(muscle.level)
  return { need, progress: Math.min(1, muscle.xp / need) }
}
export function applyMuscleXP(muscle, gained) {
  let xp = muscle.xp + gained
  let level = muscle.level
  let need = muscleXPForLevel(level)
  while (xp >= need) {
    xp -= need
    level += 1
    need = muscleXPForLevel(level)
  }
  return { ...muscle, xp, level }
}

// XP per set:
//   baseSetXP  = 10
//   weightBonus = weight * 0.1
//   repBonus   = reps * 1
//   prBonus    = 50 if new PR
//   streakBonus = currentStreak * 5  (added once per workout below)
export function xpForSet({ reps, weight, isPR }) {
  if (!reps) return 0
  const base = 10
  const w = Math.max(0, Number(weight) || 0) * 0.1
  const r = Math.max(0, Number(reps) || 0) * 1
  const pr = isPR ? 50 : 0
  return Math.round(base + w + r + pr)
}

export function workoutStreakBonus(streak) {
  return Math.max(0, streak) * 5
}
