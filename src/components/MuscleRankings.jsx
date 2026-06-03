import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { tierForLevel } from '../lib/tiers.js'
import { subMuscleTiers } from '../data/subMuscles.js'
import FeaturedMuscleCard from './FeaturedMuscleCard.jsx'
import SubMuscleRow from './SubMuscleRow.jsx'
import TierBadge from './TierBadge.jsx'

export default function MuscleRankings({ muscles, featuredName, onFeature }) {
  const [expanded, setExpanded] = useState(true)

  const featured = useMemo(
    () => muscles.find(m => m.name === featuredName) || muscles[0],
    [muscles, featuredName]
  )
  const subs = useMemo(
    () => featured ? subMuscleTiers(featured.name, featured.level) : [],
    [featured]
  )
  const others = useMemo(
    () => muscles
      .filter(m => m.name !== featured?.name)
      .sort((a, b) => (b.level - a.level) || (b.xp - a.xp)),
    [muscles, featured]
  )

  if (!featured) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <h2 className="text-lg font-extrabold tracking-tight">Muscle Rankings</h2>
        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[11px] flex items-center justify-center font-bold">
          ?
        </span>
      </div>

      <FeaturedMuscleCard
        muscle={featured}
        expanded={expanded}
        onToggle={() => setExpanded(e => !e)}
      />

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {subs.map(s => (
                <SubMuscleRow key={s.name} sub={s} parentMuscleName={featured.name} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other muscles — tap to feature */}
      <div className="space-y-2 mt-4">
        {others.map(m => {
          const tier = tierForLevel(m.level)
          const isUnranked = tier.isUnranked
          return (
            <button
              key={m.name}
              onClick={() => onFeature?.(m.name)}
              className="w-full text-left rounded-2xl p-3 flex items-center gap-3 border transition-transform active:scale-[0.99]"
              style={{
                background: isUnranked
                  ? 'rgba(255,255,255,0.03)'
                  : `linear-gradient(135deg, ${tier.color}1a, rgba(255,255,255,0.02))`,
                borderColor: isUnranked ? 'rgba(255,255,255,0.06)' : `${tier.color}44`
              }}
            >
              <TierBadge tier={tier} size={36} />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold truncate">{m.name}</div>
                <div
                  className="text-[11px] font-extrabold tracking-widest uppercase mt-0.5"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </div>
              </div>
              <span className="text-white/40 text-xl">›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
