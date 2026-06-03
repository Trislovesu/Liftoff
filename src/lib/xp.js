// Pure XP / level / rank math.

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
  let current = RANKS[0]; let next = null
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXP >= RANKS[i].min) { current = RANKS[i]; next = RANKS[i + 1] ?? null }
  }
  const xpIntoRank = totalXP - current.min
  const xpForNext = next ? next.min - current.min : 0
  const progress = next ? Math.min(1, xpIntoRank / xpForNext) : 1
  const xpToNext = next ? next.min - totalXP : 0
  return { current, next, progress, xpToNext }
}

export function rankIndex(totalXP) {
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) if (totalXP >= RANKS[i].min) idx = i
  return idx
}

export function levelFromXP(totalXP) {
  let level = 1, accum = 0
  while (true) {
    const need = Math.round(100 * Math.pow(level, 1.4))
    if (accum + need > totalXP) {
      return { level, xpIntoLevel: totalXP - accum, xpForLevel: need, progress: (totalXP - accum) / need }
    }
    accum += need; level += 1
    if (level > 999) return { level, xpIntoLevel: 0, xpForLevel: 1, progress: 1 }
  }
}

export function muscleXPForLevel(level) { return 200 + 50 * level }
export function muscleProgress(muscle) {
  const need = muscleXPForLevel(muscle.level)
  return { need, progress: Math.min(1, muscle.xp / need) }
}
export function applyMuscleXP(muscle, gained) {
  let xp = muscle.xp + gained, level = muscle.level
  let need = muscleXPForLevel(level)
  while (xp >= need) { xp -= need; level += 1; need = muscleXPForLevel(level) }
  return { ...muscle, xp, level }
}

// XP per set — heavier + higher reps now scale much more aggressively via a
// volume multiplier on top of the flat bonuses.
//   base       = 10
//   weightBon  = weight * 0.15
//   repBon     = reps   * 1.2
//   volumeBon  = (weight * reps) * 0.04
//   prBon      = 50 if PR
//   multiplier = 1 + min(1.2, volume/1800)   // up to 2.2× for huge sets
export function xpForSet({ reps, weight, isPR }) {
  if (!reps) return 0
  const w = Math.max(0, Number(weight) || 0)
  const r = Math.max(0, Number(reps)   || 0)
  const volume = w * r
  const base       = 10
  const weightBon  = w * 0.15
  const repBon     = r * 1.2
  const volumeBon  = volume * 0.04
  const prBon      = isPR ? 50 : 0
  const multiplier = 1 + Math.min(1.2, volume / 1800)
  return Math.round((base + weightBon + repBon + volumeBon + prBon) * multiplier)
}

// Flat bonus per completed workout (replaces streak bonus).
export const WORKOUT_COMPLETION_BONUS = 25
// Bonus for posting a pump pic at finish.
export const PUMP_PIC_BONUS = 75

// Soft realism check — flag obviously unrealistic sets. Returns array of warnings.
export function sanityCheckSet({ reps, weight }) {
  const w = Number(weight) || 0
  const r = Number(reps) || 0
  const warn = []
  if (w > 1500) warn.push(`${w} lbs? Be honest, gym shark.`)
  if (r > 200)  warn.push(`${r} reps in one set? Really?`)
  if (w < 0 || r < 0) warn.push(`Negative numbers won't fly.`)
  return warn
}
