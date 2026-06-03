import { tierForLevel } from '../lib/tiers.js'

// Anatomical bodygraph figure. Each muscle is an SVG path shaped roughly
// like the real muscle, and the paths tile together to form a continuous
// body silhouette. Untrained muscles render in a neutral body tone so the
// figure still reads as a complete body; trained ones take their tier color
// with a soft glow. White anatomical strokes between zones give the "fitness
// app muscle heatmap" look.

const BODY_TONE        = '#e6ebf3' // base body fill (untrained muscles & decoratives)
const DECOR_TONE       = '#dde3ee' // slightly darker for head/hands/feet
const STROKE           = 'rgba(255,255,255,0.85)'
const STROKE_W         = 1.1
const UNTRAINED_STROKE = 'rgba(255,255,255,0.55)'

// ──────────────────────────────────────────────────────────────────────────
// FRONT VIEW — viewBox 200 × 480
// ──────────────────────────────────────────────────────────────────────────
const FRONT_ZONES = [
  // Shoulders (front deltoids)
  { muscle: 'Shoulders',
    d: 'M 86,72 Q 70,76 58,86 Q 50,98 52,114 Q 64,116 76,110 L 86,100 Z' },
  { muscle: 'Shoulders',
    d: 'M 114,72 Q 130,76 142,86 Q 150,98 148,114 Q 136,116 124,110 L 114,100 Z' },

  // Pectorals (chest), split left + right but both share the "Chest" muscle
  { muscle: 'Chest',
    d: 'M 86,76 Q 78,82 72,94 Q 66,110 70,126 Q 78,140 92,142 Q 100,142 100,138 L 100,80 Q 96,76 86,76 Z' },
  { muscle: 'Chest',
    d: 'M 114,76 Q 122,82 128,94 Q 134,110 130,126 Q 122,140 108,142 Q 100,142 100,138 L 100,80 Q 104,76 114,76 Z' },

  // Biceps
  { muscle: 'Biceps',
    d: 'M 52,114 Q 44,128 42,154 Q 44,168 54,170 Q 62,166 64,156 L 70,128 Q 62,116 52,114 Z' },
  { muscle: 'Biceps',
    d: 'M 148,114 Q 156,128 158,154 Q 156,168 146,170 Q 138,166 136,156 L 130,128 Q 138,116 148,114 Z' },

  // Forearms
  { muscle: 'Forearms',
    d: 'M 42,160 Q 34,184 32,216 Q 32,244 40,260 Q 50,260 54,250 L 58,204 Q 56,182 50,170 Z' },
  { muscle: 'Forearms',
    d: 'M 158,160 Q 166,184 168,216 Q 168,244 160,260 Q 150,260 146,250 L 142,204 Q 144,182 150,170 Z' },

  // Abs (rectus + obliques as one Abs zone so it reads anatomically)
  { muscle: 'Abs',
    d: 'M 84,142 Q 100,148 116,142 Q 124,162 126,202 Q 122,224 110,232 Q 100,236 90,232 Q 78,224 74,202 Q 76,162 84,142 Z' },

  // Quads
  { muscle: 'Quads',
    d: 'M 76,252 Q 66,282 64,332 Q 66,354 80,362 Q 92,362 96,350 L 98,262 Q 92,252 76,252 Z' },
  { muscle: 'Quads',
    d: 'M 124,252 Q 134,282 136,332 Q 134,354 120,362 Q 108,362 104,350 L 102,262 Q 108,252 124,252 Z' },

  // Calves
  { muscle: 'Calves',
    d: 'M 76,380 Q 66,408 70,438 Q 78,448 90,444 L 94,420 L 96,382 Q 88,374 76,380 Z' },
  { muscle: 'Calves',
    d: 'M 124,380 Q 134,408 130,438 Q 122,448 110,444 L 106,420 L 104,382 Q 112,374 124,380 Z' }
]

// Decorative front pieces — never muscles, always neutral.
const FRONT_DECOR = (
  <g fill={DECOR_TONE} stroke={UNTRAINED_STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
    {/* Head */}
    <ellipse cx="100" cy="32" rx="22" ry="26" />
    {/* Neck */}
    <path d="M 88,54 L 112,54 L 114,72 L 86,72 Z" />
    {/* Hips/pelvis transition */}
    <path d="M 74,232 Q 100,246 126,232 L 128,254 Q 100,264 72,254 Z" />
    {/* Knees */}
    <ellipse cx="86" cy="370" rx="11" ry="6" />
    <ellipse cx="114" cy="370" rx="11" ry="6" />
    {/* Hands */}
    <ellipse cx="38" cy="278" rx="10" ry="12" />
    <ellipse cx="162" cy="278" rx="10" ry="12" />
    {/* Feet */}
    <path d="M 70,446 L 96,446 L 98,464 L 68,464 Z" />
    <path d="M 104,446 L 130,446 L 132,464 L 102,464 Z" />
  </g>
)

// ──────────────────────────────────────────────────────────────────────────
// BACK VIEW — same viewBox, mirrored muscle groups
// ──────────────────────────────────────────────────────────────────────────
const BACK_ZONES = [
  // Rear deltoids
  { muscle: 'Shoulders',
    d: 'M 86,72 Q 70,76 58,86 Q 50,98 52,114 Q 64,116 76,110 L 86,100 Z' },
  { muscle: 'Shoulders',
    d: 'M 114,72 Q 130,76 142,86 Q 150,98 148,114 Q 136,116 124,110 L 114,100 Z' },

  // Back (traps + lats as one Back muscle)
  { muscle: 'Back',
    d: 'M 86,72 Q 100,68 114,72 Q 122,90 128,118 Q 132,170 124,210 Q 110,232 100,232 Q 90,232 76,210 Q 68,170 72,118 Q 78,90 86,72 Z' },

  // Triceps (mirror biceps shapes)
  { muscle: 'Triceps',
    d: 'M 52,114 Q 44,128 42,154 Q 44,168 54,170 Q 62,166 64,156 L 70,128 Q 62,116 52,114 Z' },
  { muscle: 'Triceps',
    d: 'M 148,114 Q 156,128 158,154 Q 156,168 146,170 Q 138,166 136,156 L 130,128 Q 138,116 148,114 Z' },

  // Forearms (same shape both views)
  { muscle: 'Forearms',
    d: 'M 42,160 Q 34,184 32,216 Q 32,244 40,260 Q 50,260 54,250 L 58,204 Q 56,182 50,170 Z' },
  { muscle: 'Forearms',
    d: 'M 158,160 Q 166,184 168,216 Q 168,244 160,260 Q 150,260 146,250 L 142,204 Q 144,182 150,170 Z' },

  // Glutes
  { muscle: 'Glutes',
    d: 'M 72,236 Q 100,232 128,236 Q 132,264 124,280 Q 100,288 76,280 Q 68,264 72,236 Z' },

  // Hamstrings
  { muscle: 'Hamstrings',
    d: 'M 76,284 Q 66,310 64,350 Q 66,366 80,372 Q 92,372 96,360 L 98,294 Q 92,284 76,284 Z' },
  { muscle: 'Hamstrings',
    d: 'M 124,284 Q 134,310 136,350 Q 134,366 120,372 Q 108,372 104,360 L 102,294 Q 108,284 124,284 Z' },

  // Calves
  { muscle: 'Calves',
    d: 'M 76,386 Q 66,412 70,440 Q 78,450 90,446 L 94,422 L 96,388 Q 88,380 76,386 Z' },
  { muscle: 'Calves',
    d: 'M 124,386 Q 134,412 130,440 Q 122,450 110,446 L 106,422 L 104,388 Q 112,380 124,386 Z' }
]

const BACK_DECOR = (
  <g fill={DECOR_TONE} stroke={UNTRAINED_STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
    {/* Head (back of head — no features) */}
    <ellipse cx="100" cy="32" rx="22" ry="26" />
    {/* Neck */}
    <path d="M 88,54 L 112,54 L 114,72 L 86,72 Z" />
    {/* Knees */}
    <ellipse cx="86" cy="376" rx="11" ry="6" />
    <ellipse cx="114" cy="376" rx="11" ry="6" />
    {/* Hands */}
    <ellipse cx="38" cy="278" rx="10" ry="12" />
    <ellipse cx="162" cy="278" rx="10" ry="12" />
    {/* Feet (heels) */}
    <path d="M 70,446 L 96,446 L 98,464 L 68,464 Z" />
    <path d="M 104,446 L 130,446 L 132,464 L 102,464 Z" />
  </g>
)

export default function BodyFigure({ side = 'front', musclesByName, selectedName, onSelect, label }) {
  const zones = side === 'back' ? BACK_ZONES : FRONT_ZONES
  const decor = side === 'back' ? BACK_DECOR : FRONT_DECOR

  return (
    <div className="relative">
      {label && (
        <div className="text-center text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">
          {label}
        </div>
      )}
      <svg
        viewBox="0 0 200 480"
        className="block w-full mx-auto"
        style={{ aspectRatio: '200/480', maxWidth: 200 }}
      >
        {/* Soft body-tone backdrop so untrained muscles read as part of a body */}
        <defs>
          <filter id={`glow-${side}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {decor}

        {zones.map((z, i) => {
          const muscle = musclesByName[z.muscle]
          const level = muscle?.level ?? 0
          const tier = tierForLevel(level)
          const isSelected = selectedName === z.muscle
          const isElite = level >= 13 // Diamond+ gets the purple glow treatment
          const fill = level > 0 ? tier.color : BODY_TONE
          const stroke = isSelected ? '#ffffff' : STROKE
          const strokeWidth = isSelected ? 2 : STROKE_W

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
                filter: level > 0
                  ? `drop-shadow(0 0 ${isElite ? 10 : 5}px ${tier.color}${isElite ? 'cc' : '88'})`
                  : undefined,
                transition: 'filter 220ms, stroke-width 150ms'
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
