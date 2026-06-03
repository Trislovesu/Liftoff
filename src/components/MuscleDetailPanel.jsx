import { motion, AnimatePresence } from 'framer-motion'
import { muscleProgress, muscleXPForLevel } from '../lib/xp.js'
import { statusForLevel } from '../data/muscles.js'
import MuscleProgressBar from './MuscleProgressBar.jsx'

function relativeTime(iso) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'Just now'
  const h = diff / 3600000
  if (h < 1) return 'Just now'
  if (h < 24) return `${Math.floor(h)}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return 'A while ago'
}

function strongestExercise(history, muscleName) {
  let best = null
  for (const h of history) {
    for (const ex of h.exercises || []) {
      if (ex.primaryMuscle === muscleName) {
        if (!best || ex.xp > best.xp) best = ex
      }
    }
  }
  return best
}

function motivation(muscle, progress, daysSince, weeklyGain) {
  const name = muscle.name
  if (muscle.level === 0) return `${name} is untrained — give it some attention.`
  if (progress > 0.85) return `${name} is close to Level ${muscle.level + 1}!`
  if (daysSince != null && daysSince >= 7) return `${name} needs more volume this week.`
  if (weeklyGain > 0) return `${name} is on the rise — keep stacking sets.`
  return `Solid progress on ${name} — keep stacking sets.`
}

export default function MuscleDetailPanel({ muscle, lastTrained, weeklyGain, history }) {
  if (!muscle) return null
  const { need, progress } = muscleProgress(muscle)
  const status = statusForLevel(muscle.level)
  const xpToNext = Math.max(0, need - muscle.xp)
  const daysSince = lastTrained
    ? Math.floor((Date.now() - new Date(lastTrained).getTime()) / 86400000)
    : null
  const strongest = strongestExercise(history, muscle.name)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={muscle.name}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
        className="card-grad p-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${status.color}22, transparent 70%)`,
          borderColor: `${status.color}55`
        }}
      >
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: status.color }}
        />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Selected</div>
            <div className="text-2xl font-extrabold leading-tight">{muscle.name}</div>
          </div>
          <span
            className="chip"
            style={{ color: status.color, borderColor: `${status.color}55`, background: `${status.color}18` }}
          >
            {status.name}
          </span>
        </div>

        <div className="flex items-end gap-4 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Level</div>
            <div className="text-4xl font-extrabold leading-none" style={{ color: status.color }}>
              {muscle.level}
            </div>
          </div>
          <div className="flex-1">
            <MuscleProgressBar muscle={muscle} height={12} showLabel={false} />
            <div className="flex justify-between text-[11px] text-white/50 mt-1.5">
              <span>{muscle.xp} XP</span>
              <span>{xpToNext} XP to Lv {muscle.level + 1}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Mini label="Last Trained" value={relativeTime(lastTrained)} />
          <Mini label="This Week" value={`+${weeklyGain || 0} XP`} />
        </div>

        {strongest && (
          <div className="card p-3 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">⭐</div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Strongest Lift</div>
              <div className="text-sm font-semibold truncate">{strongest.name}</div>
            </div>
            <div className="text-xp font-bold text-sm">+{strongest.xp} XP</div>
          </div>
        )}

        <div
          className="text-sm italic text-white/70 border-l-2 pl-3"
          style={{ borderColor: status.color }}
        >
          “{motivation(muscle, progress, daysSince, weeklyGain || 0)}”
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function Mini({ label, value }) {
  return (
    <div className="card p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">{label}</div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
    </div>
  )
}
