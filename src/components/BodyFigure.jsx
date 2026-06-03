import { tierForLevel } from '../lib/tiers.js'

// Bodygraph figure.
// Layer 1: a white body silhouette built from overlapping rounded parts that
//          share a single fill — they merge visually into one body.
// Layer 2: anatomical muscle overlays painted ON TOP of the silhouette
//          (split pecs, six-pack abs, bicep/tricep heads, quads, calves,
//          traps/lats/glutes on the back). Each overlay's fill follows the
//          muscle's tier: gray when untrained, tier color when trained.

const SILHOUETTE_FILL = '#eef1f7'   // soft white body tone
const UNTRAINED_FILL  = '#9aa3b6'   // gray muscle when level 0
const MUSCLE_STROKE   = 'rgba(255,255,255,0.95)' // anatomical line color
const STROKE_W        = 1.0

// ──────────────────────────────────────────────────────────────────────────
// FRONT — viewBox 200 × 520
// ──────────────────────────────────────────────────────────────────────────

const FRONT_SILHOUETTE = (
  <g fill={SILHOUETTE_FILL} stroke="none">
    {/* Head */}
    <ellipse cx="100" cy="34" rx="22" ry="26" />
    {/* Neck */}
    <path d="M 86,56 L 114,56 L 116,72 L 84,72 Z" />
    {/* Torso (upper V — shoulders to waist) */}
    <path d="M 56,76 Q 36,84 28,108 Q 24,150 32,196 Q 40,228 56,250 L 64,250 Q 62,200 66,160 Q 72,128 84,122 L 116,122 Q 128,128 134,160 Q 138,200 136,250 L 144,250 Q 160,228 168,196 Q 176,150 172,108 Q 164,84 144,76 Z" />
    {/* Hip / pelvis */}
    <path d="M 60,232 Q 70,264 78,278 L 122,278 Q 130,264 140,232 Z" />
    {/* Upper arms */}
    <path d="M 36,110 Q 28,140 28,178 Q 28,210 36,236 Q 50,242 56,232 Q 60,200 62,166 L 62,116 Q 54,108 36,110 Z" />
    <path d="M 164,110 Q 172,140 172,178 Q 172,210 164,236 Q 150,242 144,232 Q 140,200 138,166 L 138,116 Q 146,108 164,110 Z" />
    {/* Forearms */}
    <path d="M 30,230 Q 22,260 22,294 Q 24,320 36,328 Q 50,326 54,316 Q 58,290 60,260 L 60,228 Z" />
    <path d="M 170,230 Q 178,260 178,294 Q 176,320 164,328 Q 150,326 146,316 Q 142,290 140,260 L 140,228 Z" />
    {/* Hands */}
    <ellipse cx="38" cy="338" rx="14" ry="14" />
    <ellipse cx="162" cy="338" rx="14" ry="14" />
    {/* Thighs */}
    <path d="M 64,272 Q 56,316 60,378 Q 66,406 80,414 Q 94,414 98,406 L 100,278 Z" />
    <path d="M 136,272 Q 144,316 140,378 Q 134,406 120,414 Q 106,414 102,406 L 100,278 Z" />
    {/* Knees */}
    <ellipse cx="84" cy="416" rx="14" ry="6" />
    <ellipse cx="116" cy="416" rx="14" ry="6" />
    {/* Calves */}
    <path d="M 68,418 Q 60,452 64,486 Q 72,500 86,498 Q 94,478 96,456 L 96,418 Z" />
    <path d="M 132,418 Q 140,452 136,486 Q 128,500 114,498 Q 106,478 104,456 L 104,418 Z" />
    {/* Feet */}
    <path d="M 60,496 Q 58,506 62,512 L 98,512 L 96,496 Z" />
    <path d="M 140,496 Q 142,506 138,512 L 102,512 L 104,496 Z" />
  </g>
)

// Front muscle anatomy zones. Each entry: { muscle, d }.
// Multiple shapes can share a muscle (eg, two pec halves both = "Chest").
const FRONT_MUSCLES = [
  // Front delts (Shoulders) — rounded shoulder caps
  { muscle: 'Shoulders', d: 'M 84,76 Q 64,80 52,94 Q 46,108 50,122 Q 64,124 76,116 Q 84,108 86,98 Z' },
  { muscle: 'Shoulders', d: 'M 116,76 Q 136,80 148,94 Q 154,108 150,122 Q 136,124 124,116 Q 116,108 114,98 Z' },

  // Pecs (Chest) — split left/right with curved bottom
  { muscle: 'Chest', d: 'M 86,80 Q 76,86 70,100 Q 64,118 68,134 Q 78,148 92,148 Q 100,148 100,140 L 100,86 Q 96,80 86,80 Z' },
  { muscle: 'Chest', d: 'M 114,80 Q 124,86 130,100 Q 136,118 132,134 Q 122,148 108,148 Q 100,148 100,140 L 100,86 Q 104,80 114,80 Z' },

  // Biceps — rounded upper arm muscle (positioned inside the upper arm silhouette)
  { muscle: 'Biceps', d: 'M 46,118 Q 38,140 38,170 Q 40,196 50,210 Q 56,210 58,198 L 60,170 L 62,128 Q 58,118 46,118 Z' },
  { muscle: 'Biceps', d: 'M 154,118 Q 162,140 162,170 Q 160,196 150,210 Q 144,210 142,198 L 140,170 L 138,128 Q 142,118 154,118 Z' },

  // Forearms — tapered lower arm muscle
  { muscle: 'Forearms', d: 'M 32,234 Q 24,262 24,294 Q 26,316 36,322 Q 48,320 52,310 Q 56,286 58,256 L 58,232 Z' },
  { muscle: 'Forearms', d: 'M 168,234 Q 176,262 176,294 Q 174,316 164,322 Q 152,320 148,310 Q 144,286 142,256 L 142,232 Z' },

  // Six-pack abs — 6 segments (3 rows × 2 columns), all under "Abs"
  { muscle: 'Abs', d: 'M 84,150 Q 92,154 99,154 L 99,172 Q 92,174 84,172 Z' }, // upper L
  { muscle: 'Abs', d: 'M 101,154 Q 108,154 116,150 L 116,172 Q 108,174 101,172 Z' }, // upper R
  { muscle: 'Abs', d: 'M 82,176 Q 92,180 99,180 L 99,200 Q 92,202 82,200 Z' }, // mid L
  { muscle: 'Abs', d: 'M 101,180 Q 108,180 118,176 L 118,200 Q 108,202 101,200 Z' }, // mid R
  { muscle: 'Abs', d: 'M 80,204 Q 92,208 99,208 L 99,232 Q 92,234 80,232 Z' }, // lower L
  { muscle: 'Abs', d: 'M 101,208 Q 108,208 120,204 L 120,232 Q 108,234 101,232 Z' }, // lower R

  // Quads — large thigh muscle
  { muscle: 'Quads', d: 'M 70,282 Q 60,322 64,378 Q 70,402 82,408 Q 92,406 94,396 L 98,290 Q 90,278 70,282 Z' },
  { muscle: 'Quads', d: 'M 130,282 Q 140,322 136,378 Q 130,402 118,408 Q 108,406 106,396 L 102,290 Q 110,278 130,282 Z' },

  // Calves — rounded lower leg muscle
  { muscle: 'Calves', d: 'M 70,424 Q 62,456 68,488 Q 78,498 88,492 L 92,460 L 94,422 Q 84,420 70,424 Z' },
  { muscle: 'Calves', d: 'M 130,424 Q 138,456 132,488 Q 122,498 112,492 L 108,460 L 106,422 Q 116,420 130,424 Z' }
]

// ──────────────────────────────────────────────────────────────────────────
// BACK — same silhouette, different muscle layout (traps+lats+lower back as Back, glutes, hamstrings, triceps)
// ──────────────────────────────────────────────────────────────────────────

const BACK_SILHOUETTE = FRONT_SILHOUETTE // body shape is the same

const BACK_MUSCLES = [
  // Rear delts (Shoulders)
  { muscle: 'Shoulders', d: 'M 84,76 Q 64,80 52,94 Q 46,108 50,122 Q 64,124 76,116 Q 84,108 86,98 Z' },
  { muscle: 'Shoulders', d: 'M 116,76 Q 136,80 148,94 Q 154,108 150,122 Q 136,124 124,116 Q 116,108 114,98 Z' },

  // Traps (upper Back) — diamond/heart shape between shoulders
  { muscle: 'Back', d: 'M 86,72 Q 100,68 114,72 Q 116,90 110,108 Q 100,116 90,108 Q 84,90 86,72 Z' },

  // Lats (Back) — wide V from upper back to waist
  { muscle: 'Back', d: 'M 70,108 Q 90,114 100,114 Q 110,114 130,108 Q 136,148 132,196 Q 116,224 100,224 Q 84,224 68,196 Q 64,148 70,108 Z' },

  // Lower back (Back) — narrow taper above glutes
  { muscle: 'Back', d: 'M 84,224 Q 100,232 116,224 L 118,250 Q 100,256 82,250 Z' },

  // Triceps — upper arm back
  { muscle: 'Triceps', d: 'M 46,118 Q 38,140 38,170 Q 40,196 50,210 Q 56,210 58,198 L 60,170 L 62,128 Q 58,118 46,118 Z' },
  { muscle: 'Triceps', d: 'M 154,118 Q 162,140 162,170 Q 160,196 150,210 Q 144,210 142,198 L 140,170 L 138,128 Q 142,118 154,118 Z' },

  // Forearms (same)
  { muscle: 'Forearms', d: 'M 32,234 Q 24,262 24,294 Q 26,316 36,322 Q 48,320 52,310 Q 56,286 58,256 L 58,232 Z' },
  { muscle: 'Forearms', d: 'M 168,234 Q 176,262 176,294 Q 174,316 164,322 Q 152,320 148,310 Q 144,286 142,256 L 142,232 Z' },

  // Glutes — two distinct cheeks
  { muscle: 'Glutes', d: 'M 70,254 Q 84,250 96,254 Q 100,272 96,288 Q 84,296 72,288 Q 64,272 70,254 Z' },
  { muscle: 'Glutes', d: 'M 130,254 Q 116,250 104,254 Q 100,272 104,288 Q 116,296 128,288 Q 136,272 130,254 Z' },

  // Hamstrings — back of thighs
  { muscle: 'Hamstrings', d: 'M 70,294 Q 60,332 64,386 Q 70,406 82,412 Q 92,410 94,400 L 98,302 Q 90,290 70,294 Z' },
  { muscle: 'Hamstrings', d: 'M 130,294 Q 140,332 136,386 Q 130,406 118,412 Q 108,410 106,400 L 102,302 Q 110,290 130,294 Z' },

  // Calves (same)
  { muscle: 'Calves', d: 'M 70,424 Q 62,456 68,488 Q 78,498 88,492 L 92,460 L 94,422 Q 84,420 70,424 Z' },
  { muscle: 'Calves', d: 'M 130,424 Q 138,456 132,488 Q 122,498 112,492 L 108,460 L 106,422 Q 116,420 130,424 Z' }
]

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export default function BodyFigure({ side = 'front', musclesByName, selectedName, onSelect, label }) {
  const silhouette = side === 'back' ? BACK_SILHOUETTE : FRONT_SILHOUETTE
  const muscles    = side === 'back' ? BACK_MUSCLES    : FRONT_MUSCLES

  return (
    <div className="relative">
      {label && (
        <div className="text-center text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">
          {label}
        </div>
      )}
      <svg
        viewBox="0 0 200 520"
        className="block w-full mx-auto"
        style={{ aspectRatio: '200/520', maxWidth: 220 }}
      >
        {/* Layer 1: unified white body silhouette */}
        {silhouette}

        {/* Layer 2: anatomical muscle overlays */}
        {muscles.map((m, i) => {
          const muscle = musclesByName[m.muscle]
          const level = muscle?.level ?? 0
          const tier = tierForLevel(level)
          const isSelected = selectedName === m.muscle
          const isElite = level >= 13
          const fill = level > 0 ? tier.color : UNTRAINED_FILL
          const stroke = isSelected ? '#ffffff' : MUSCLE_STROKE
          const strokeWidth = isSelected ? 1.8 : STROKE_W

          return (
            <path
              key={`${m.muscle}-${i}`}
              d={m.d}
              fill={fill}
              fillOpacity={level > 0 ? 0.94 : 0.85}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              onClick={() => onSelect?.(m.muscle)}
              style={{
                cursor: 'pointer',
                filter: level > 0
                  ? `drop-shadow(0 0 ${isElite ? 8 : 3}px ${tier.color}${isElite ? 'cc' : '66'})`
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
