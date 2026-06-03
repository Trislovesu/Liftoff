import React from 'react'
import { tierForLevel } from '../lib/tiers.js'

// Decorative body parts (head, neck, hands, feet) — always neutral light gray.
const BODY_FILL = '#dde3ee'
const BODY_STROKE = '#9ca5b9'
const UNTRAINED_FILL = '#cfd6e2'

// Muscle zones are paths inside viewBox 160×380. Together they form the
// front/back body silhouette. Untrained zones render as a body-neutral gray
// so the figure still reads as a complete body even with no progress.
const FRONT_ZONES = [
  { muscle: 'Shoulders', d: 'M 62,54 Q 48,58 46,72 Q 50,82 60,82 L 66,68 Z' },
  { muscle: 'Shoulders', d: 'M 98,54 Q 112,58 114,72 Q 110,82 100,82 L 94,68 Z' },
  { muscle: 'Chest',     d: 'M 62,54 Q 80,50 98,54 Q 104,80 98,110 Q 80,116 62,110 Q 56,80 62,54 Z' },
  { muscle: 'Biceps',    d: 'M 44,80 Q 38,98 42,120 Q 48,130 54,126 L 56,92 Q 54,82 50,80 Z' },
  { muscle: 'Biceps',    d: 'M 116,80 Q 122,98 118,120 Q 112,130 106,126 L 104,92 Q 106,82 110,80 Z' },
  { muscle: 'Forearms',  d: 'M 38,130 Q 30,150 34,174 Q 38,184 46,182 L 48,150 Q 48,138 42,128 Z' },
  { muscle: 'Forearms',  d: 'M 122,130 Q 130,150 126,174 Q 122,184 114,182 L 112,150 Q 112,138 118,128 Z' },
  { muscle: 'Abs',       d: 'M 64,110 Q 80,114 96,110 L 100,172 Q 80,180 60,172 Z' },
  { muscle: 'Quads',     d: 'M 62,202 Q 54,234 60,276 Q 64,290 74,288 Q 78,272 78,248 L 78,200 Q 70,198 62,202 Z' },
  { muscle: 'Quads',     d: 'M 98,202 Q 106,234 100,276 Q 96,290 86,288 Q 82,272 82,248 L 82,200 Q 90,198 98,202 Z' },
  { muscle: 'Calves',    d: 'M 62,296 Q 58,320 64,344 Q 70,358 76,354 L 78,308 Q 70,294 62,296 Z' },
  { muscle: 'Calves',    d: 'M 98,296 Q 102,320 96,344 Q 90,358 84,354 L 82,308 Q 90,294 98,296 Z' }
]

const BACK_ZONES = [
  { muscle: 'Shoulders',  d: 'M 62,54 Q 48,58 46,72 Q 50,82 60,82 L 66,68 Z' },
  { muscle: 'Shoulders',  d: 'M 98,54 Q 112,58 114,72 Q 110,82 100,82 L 94,68 Z' },
  { muscle: 'Back',       d: 'M 62,54 Q 80,50 98,54 L 104,112 Q 100,150 96,172 Q 80,180 64,172 Q 60,150 56,112 Z' },
  { muscle: 'Triceps',    d: 'M 44,80 Q 38,98 42,120 Q 48,130 54,126 L 56,92 Q 54,82 50,80 Z' },
  { muscle: 'Triceps',    d: 'M 116,80 Q 122,98 118,120 Q 112,130 106,126 L 104,92 Q 106,82 110,80 Z' },
  { muscle: 'Forearms',   d: 'M 38,130 Q 30,150 34,174 Q 38,184 46,182 L 48,150 Q 48,138 42,128 Z' },
  { muscle: 'Forearms',   d: 'M 122,130 Q 130,150 126,174 Q 122,184 114,182 L 112,150 Q 112,138 118,128 Z' },
  { muscle: 'Glutes',     d: 'M 60,184 Q 80,180 100,184 L 102,226 Q 80,238 58,226 Z' },
  { muscle: 'Hamstrings', d: 'M 62,236 Q 54,266 60,300 Q 64,316 74,314 Q 78,298 78,274 L 78,234 Q 70,232 62,236 Z' },
  { muscle: 'Hamstrings', d: 'M 98,236 Q 106,266 100,300 Q 96,316 86,314 Q 82,298 82,274 L 82,234 Q 90,232 98,236 Z' },
  { muscle: 'Calves',     d: 'M 62,322 Q 58,346 64,360 Q 70,368 76,364 L 78,330 Q 70,318 62,322 Z' },
  { muscle: 'Calves',     d: 'M 98,322 Q 102,346 96,360 Q 90,368 84,364 L 82,330 Q 90,318 98,322 Z' }
]

export default function BodyFigure({ side = 'front', musclesByName, selectedName, onSelect, label }) {
  const zones = side === 'back' ? BACK_ZONES : FRONT_ZONES
  return (
    <div className="relative">
      {label && (
        <div className="text-center text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">
          {label}
        </div>
      )}
      <svg
        viewBox="0 0 160 380"
        className="block w-full max-w-[170px] mx-auto"
        style={{ aspectRatio: '160/380' }}
      >
        {/* Decoratives — head, neck, hands, feet */}
        <g fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.7" strokeLinejoin="round">
          <ellipse cx="80" cy="22" rx="15" ry="17" />
          <path d="M 72,38 L 88,38 L 90,52 L 70,52 Z" />
          <circle cx="36" cy="190" r="7" />
          <circle cx="124" cy="190" r="7" />
          <ellipse cx="72" cy="368" rx="8" ry="5" />
          <ellipse cx="88" cy="368" rx="8" ry="5" />
        </g>

        {/* Muscle zones */}
        {zones.map((z, i) => {
          const muscle = musclesByName[z.muscle]
          const level = muscle?.level ?? 0
          const tier = tierForLevel(level)
          const isSelected = selectedName === z.muscle
          const fill = level > 0 ? tier.color : UNTRAINED_FILL
          const stroke = isSelected ? '#ffffff' : (level > 0 ? 'rgba(0,0,0,0.15)' : BODY_STROKE)
          const strokeWidth = isSelected ? 1.6 : 0.7
          return (
            <path
              key={`${z.muscle}-${i}`}
              d={z.d}
              fill={fill}
              fillOpacity={level > 0 ? 0.95 : 1}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              onClick={() => onSelect?.(z.muscle)}
              style={{
                cursor: 'pointer',
                filter: level > 0 ? `drop-shadow(0 0 6px ${tier.color}55)` : undefined,
                transition: 'filter 200ms, stroke-width 150ms'
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
