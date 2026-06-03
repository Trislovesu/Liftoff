import { muscleProgress } from '../lib/xp.js'
import { statusForLevel } from '../data/muscles.js'
import XPProgressBar from './XPProgressBar.jsx'

export default function MuscleCard({ muscle, onClick }) {
  const { need, progress } = muscleProgress(muscle)
  const status = statusForLevel(muscle.level)
  return (
    <button
      onClick={onClick}
      className="card text-left p-4 w-full transition-transform hover:-translate-y-0.5 hover:shadow-glow"
      style={{ borderColor: muscle.level > 0 ? `${status.color}55` : undefined }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{muscle.name}</div>
        <span
          className="chip"
          style={{ color: status.color, borderColor: `${status.color}55`, background: `${status.color}15` }}
        >
          {status.name}
        </span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-[11px] text-white/40">Level</div>
          <div className="text-2xl font-extrabold leading-none">{muscle.level}</div>
        </div>
        <div className="text-[11px] text-white/40 text-right">
          {muscle.xp} / {need} XP
        </div>
      </div>
      <XPProgressBar value={progress} color={status.color} height={6} />
    </button>
  )
}
