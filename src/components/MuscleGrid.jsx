import { statusForLevel } from '../data/muscles.js'
import { muscleProgress } from '../lib/xp.js'

export default function MuscleGrid({ muscles, selectedName, onSelect, recentMuscles = new Set() }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {muscles.map(m => {
        const status = statusForLevel(m.level)
        const { progress } = muscleProgress(m)
        const isSelected = selectedName === m.name
        const isRecent = recentMuscles.has(m.name)
        return (
          <button
            key={m.name}
            onClick={() => onSelect(m.name)}
            className={`relative card p-2.5 text-left overflow-hidden transition-transform ${isSelected ? 'shadow-glow' : ''}`}
            style={{
              borderColor: isSelected ? status.color : (m.level > 0 ? `${status.color}55` : undefined),
              background: m.level > 0
                ? `linear-gradient(135deg, ${status.color}22, rgba(255,255,255,0.02))`
                : undefined
            }}
          >
            {isRecent && (
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full muscle-pulse"
                style={{ background: status.color, boxShadow: `0 0 6px ${status.color}` }}
              />
            )}
            <div className="text-[11px] font-bold truncate">{m.name}</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <div className="text-xl font-extrabold leading-none" style={{ color: status.color }}>{m.level}</div>
              <div className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">Lv</div>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, progress * 100)}%`,
                  background: status.color,
                  boxShadow: `0 0 6px ${status.color}aa`
                }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
