import { rankFor } from '../lib/xp.js'
import XPProgressBar from './XPProgressBar.jsx'
import RankBadge from './RankBadge.jsx'

export default function RankCard({ totalXP }) {
  const { current, next, progress, xpToNext } = rankFor(totalXP)
  return (
    <div
      className="card p-4 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${current.color}22, transparent 70%)` }}
    >
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: current.color }}
      />
      <div className="flex items-center gap-3 mb-3">
        <RankBadge rank={current} size={44} />
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Current Rank</div>
          <div className="text-xl font-extrabold" style={{ color: current.color }}>{current.name}</div>
        </div>
      </div>
      <XPProgressBar
        value={progress}
        color={current.color}
        label={next ? `Next: ${next.name}` : 'Max rank'}
        sub={next ? `${xpToNext.toLocaleString()} XP to go` : 'Legend status'}
      />
    </div>
  )
}
