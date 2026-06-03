// Muscle tier system. Tier names stay traditional (so the rankings cards
// can read "GOLD I", "SILVER III"), but colors now follow the strength
// gradient: gray → blue → teal → gold → orange → purple → red.

export const TIERS = [
  { name: 'Bronze',   color: '#4dabf7' }, // beginner — blue
  { name: 'Silver',   color: '#38e1b0' }, // active   — teal
  { name: 'Gold',     color: '#ffcc4d' }, // strong   — gold
  { name: 'Platinum', color: '#ff8a3d' }, // powerful — orange
  { name: 'Diamond',  color: '#b388ff' }, // elite    — purple
  { name: 'Master',   color: '#d68aff' }  // ascended — brighter purple
]

const LEGEND = { name: 'Legend', color: '#ff5e7a' } // beyond — red
const UNRANKED_COLOR = '#6b7385'

// Levels 1–18 → six tiers × three sub-ranks (Bronze I → Master III).
// Levels 19+ → Legend.
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
