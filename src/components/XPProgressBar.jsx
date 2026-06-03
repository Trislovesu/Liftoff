import { motion } from 'framer-motion'

export default function XPProgressBar({ value = 0, label, sub, color = '#7c5cff', height = 8 }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className="w-full">
      {(label || sub) && (
        <div className="flex items-baseline justify-between mb-1.5">
          {label && <span className="text-xs font-semibold text-white/70">{label}</span>}
          {sub && <span className="text-[11px] text-white/40">{sub}</span>}
        </div>
      )}
      <div
        className="w-full bg-white/5 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 12px ${color}66`
          }}
        />
      </div>
    </div>
  )
}
