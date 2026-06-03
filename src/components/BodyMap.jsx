import { useState } from 'react'
import { motion } from 'framer-motion'
import MuscleZone from './MuscleZone.jsx'

// Zone definitions per view. Each entry: { muscle, shape }.
// Shapes are placed inside a viewBox of 240×580.
function frontZones() {
  return [
    { muscle: 'Shoulders', shape: <ellipse cx="78"  cy="118" rx="22" ry="20" /> },
    { muscle: 'Shoulders', shape: <ellipse cx="162" cy="118" rx="22" ry="20" /> },
    { muscle: 'Chest',
      shape: <path d="M 84,118 Q 100,108 120,108 Q 140,108 156,118 L 158,172 Q 140,180 120,178 Q 100,180 82,172 Z" /> },
    { muscle: 'Biceps',  shape: <ellipse cx="58"  cy="172" rx="14" ry="26" /> },
    { muscle: 'Biceps',  shape: <ellipse cx="182" cy="172" rx="14" ry="26" /> },
    { muscle: 'Forearms', shape: <ellipse cx="46"  cy="232" rx="13" ry="30" /> },
    { muscle: 'Forearms', shape: <ellipse cx="194" cy="232" rx="13" ry="30" /> },
    { muscle: 'Abs',
      shape: <path d="M 98,182 Q 120,178 142,182 L 144,270 Q 120,278 96,270 Z" /> },
    { muscle: 'Quads',   shape: <ellipse cx="102" cy="338" rx="22" ry="50" /> },
    { muscle: 'Quads',   shape: <ellipse cx="138" cy="338" rx="22" ry="50" /> },
    { muscle: 'Calves',  shape: <ellipse cx="102" cy="460" rx="17" ry="36" /> },
    { muscle: 'Calves',  shape: <ellipse cx="138" cy="460" rx="17" ry="36" /> }
  ]
}

function backZones() {
  return [
    { muscle: 'Shoulders', shape: <ellipse cx="78"  cy="118" rx="22" ry="20" /> },
    { muscle: 'Shoulders', shape: <ellipse cx="162" cy="118" rx="22" ry="20" /> },
    { muscle: 'Back',
      shape: <path d="M 80,116 L 160,116 L 172,180 L 162,266 L 78,266 L 68,180 Z" /> },
    { muscle: 'Triceps',  shape: <ellipse cx="58"  cy="172" rx="14" ry="26" /> },
    { muscle: 'Triceps',  shape: <ellipse cx="182" cy="172" rx="14" ry="26" /> },
    { muscle: 'Forearms', shape: <ellipse cx="46"  cy="232" rx="13" ry="30" /> },
    { muscle: 'Forearms', shape: <ellipse cx="194" cy="232" rx="13" ry="30" /> },
    { muscle: 'Glutes',
      shape: <path d="M 90,272 Q 120,266 150,272 L 152,320 Q 120,332 88,320 Z" /> },
    { muscle: 'Hamstrings', shape: <ellipse cx="102" cy="372" rx="22" ry="44" /> },
    { muscle: 'Hamstrings', shape: <ellipse cx="138" cy="372" rx="22" ry="44" /> },
    { muscle: 'Calves',     shape: <ellipse cx="102" cy="468" rx="17" ry="34" /> },
    { muscle: 'Calves',     shape: <ellipse cx="138" cy="468" rx="17" ry="34" /> }
  ]
}

export default function BodyMap({ musclesByName, selectedName, onSelect, recentMuscles = new Set() }) {
  const [view, setView] = useState('front')
  const zones = view === 'front' ? frontZones() : backZones()

  return (
    <div className="card-grad p-4 relative overflow-hidden">
      {/* ambient glow background */}
      <div className="absolute inset-0 bg-hero-grad opacity-40 pointer-events-none" />

      {/* Front/Back toggle */}
      <div className="relative card p-1 flex mb-3 max-w-[200px] mx-auto">
        {[
          { id: 'front', label: 'Front' },
          { id: 'back',  label: 'Back' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              view === t.id ? 'bg-accent text-white shadow-glow' : 'text-white/50'
            }`}
          >{t.label}</button>
        ))}
      </div>

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative"
      >
        <svg
          viewBox="0 0 240 580"
          className="block mx-auto w-full max-w-[340px]"
          style={{ aspectRatio: '240/580' }}
        >
          {/* Decorative figure outline (head, neck, joints) — dim */}
          <g stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="rgba(255,255,255,0.025)">
            <ellipse cx="120" cy="48" rx="26" ry="30" />
            <path d="M 108,78 L 132,78 L 130,98 L 110,98 Z" />
            {/* hands */}
            <circle cx="46" cy="270" r="9" />
            <circle cx="194" cy="270" r="9" />
            {/* feet */}
            <ellipse cx="102" cy="502" rx="14" ry="8" />
            <ellipse cx="138" cy="502" rx="14" ry="8" />
            {/* faint torso/leg connectors so the figure reads when empty */}
            <path d="M 96,266 L 96,290 L 144,290 L 144,266" />
          </g>

          {/* Muscle zones */}
          {zones.map((z, i) => {
            const muscle = musclesByName[z.muscle]
            if (!muscle) return null
            return (
              <MuscleZone
                key={`${z.muscle}-${i}`}
                muscle={muscle}
                shape={z.shape}
                isSelected={selectedName === z.muscle}
                isRecent={recentMuscles.has(z.muscle)}
                onClick={() => onSelect(z.muscle)}
              />
            )
          })}
        </svg>

        {/* tiny hint */}
        <div className="text-center text-[10px] uppercase tracking-widest text-white/30 mt-2">
          Tap a muscle
        </div>
      </motion.div>
    </div>
  )
}
