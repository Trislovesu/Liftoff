// Muscle tier system: each muscle level maps to a ranked tier (Bronze→Legend)
// with three sub-ranks (I, II, III). Mirrors the RPG/competitive feel of the
// reference screen. Lives next to xp.js but is self-contained so it can be
// swapped without touching the XP curve.

export const TIERS = [
  { name: 'Bronze',   color: '#cd7f32' },
  { name: 'Silver',   color: '#c0c0c0' },
  { name: 'Gold',     color: '#ffcc4d' },
  { name: 'Platinum', color: '#c5d0e6' },
  { name: 'Diamond',  color: '#7ee8ff' },
  { name: 'Master',   color: '#b388ff' }
]

const LEGEND = { name: 'Legend', color: '#ff5e7a' }
const UNRANKED_COLOR = '#5b6478'

// Levels 1–18 → six tiers × three sub-ranks (Bronze I → Master III).
// Levels 19+ → Legend (no sub-rank).
export function tierForLevel(level) {
  if (!level || level <= 0) {
    return { name: 'Unranked', sub: '', label: 'Unranked', color: UNRANKED_COLOR, isUnranked: true }
  }
  if (level >= 19) {
    return { name: LEGEND.name, sub: '', label: LEGEND.name, color: LEGEND.color, isUnranked: false }
  }
  const tierIdx = Math.floor((level - 1) / 3)
  const subIdx = (level - 1) % 3
  const tier = TIERS[tierIdx]
  const sub = ['I', 'II', 'III'][subIdx]
  return { name: tier.name, sub, label: `${tier.name} ${sub}`, color: tier.color, isUnranked: false }
}
