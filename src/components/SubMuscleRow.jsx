import TierBadge from './TierBadge.jsx'

// One row in the expandable sub-muscle list. Small "icon" on the left is a
// neutral chip with the parent muscle initials — replaceable with a mini body
// thumbnail later if needed.
export default function SubMuscleRow({ sub, parentMuscleName }) {
  const isUnranked = sub.tier.isUnranked
  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3 border"
      style={{
        background: isUnranked
          ? 'rgba(255,255,255,0.03)'
          : `linear-gradient(135deg, ${sub.tier.color}1a, rgba(255,255,255,0.02))`,
        borderColor: isUnranked ? 'rgba(255,255,255,0.06)' : `${sub.tier.color}44`
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-extrabold text-white/70">
        {parentMuscleName.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold truncate text-[15px]">{sub.name}</div>
        <div
          className="text-[11px] font-extrabold tracking-widest uppercase mt-0.5"
          style={{ color: sub.tier.color }}
        >
          {sub.tier.label}
        </div>
      </div>
      <TierBadge tier={sub.tier} size={34} />
    </div>
  )
}
