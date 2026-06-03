import { tierForLevel } from '../lib/tiers.js'
import TierBadge from './TierBadge.jsx'

// Big rank card for the currently featured muscle. Background gradient is
// driven by the muscle's tier color, so a Gold muscle gets the gold look.
export default function FeaturedMuscleCard({ muscle, expanded, onToggle }) {
  if (!muscle) return null
  const tier = tierForLevel(muscle.level)
  return (
    <button
      onClick={onToggle}
      className="w-full text-left rounded-2xl p-4 border relative overflow-hidden shadow-card transition-transform active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, ${tier.color}55, ${tier.color}22 55%, rgba(0,0,0,0.25))`,
        borderColor: `${tier.color}99`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 24px ${tier.color}33`
      }}
    >
      <div
        className="absolute -top-14 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: tier.color, opacity: 0.3 }}
      />
      <div className="relative flex items-center gap-3">
        <TierBadge tier={tier} size={44} showSub={false} />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-lg leading-none">{muscle.name}</div>
          <div
            className="text-sm font-extrabold mt-1.5 tracking-widest uppercase"
            style={{ color: tier.color, textShadow: `0 0 12px ${tier.color}88` }}
          >
            {tier.label}
          </div>
        </div>
        <span
          className="text-2xl text-white/70 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}
        >⌃</span>
      </div>
    </button>
  )
}
