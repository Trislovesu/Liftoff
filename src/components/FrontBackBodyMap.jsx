import bodyImg from '../assets/bodygraph.png'
import { tierForLevel } from '../lib/tiers.js'

// Flip to true to see exactly where each clickable zone is (red translucent fill
// + yellow outline + muscle name). Use this to nudge the path coordinates until
// the hitbox sits on the right muscle. Set back to false before shipping.
const DEBUG_OVERLAYS = false

// ──────────────────────────────────────────────────────────────────────────
// Overlay zones.
// Coordinate space is 0–100 on both axes (percentages of the image).
// The SVG below uses preserveAspectRatio="none", so these coordinates map
// 1:1 onto the image regardless of how it's scaled by Tailwind / the viewport.
//
// Each entry is a single muscle hitbox traced as an SVG path that follows
// the visible muscle shape on the bodygraph image. Multiple paths can share
// the same `muscle` name (eg, two pec halves both belong to "Chest") so
// tapping either selects the same muscle in the rankings list.
// ──────────────────────────────────────────────────────────────────────────
const OVERLAYS = [
  // ─── FRONT figure (left half of image, center ≈ x:25) ─────────────────
  // Front deltoids — sit ON the rounded shoulder cap only
  { muscle: 'Shoulders', d: 'M 15,18 Q 18.5,17 21,18.5 Q 22.5,21 20.5,23.5 Q 17.5,24.5 15,22.5 Z' },
  { muscle: 'Shoulders', d: 'M 35,18 Q 31.5,17 29,18.5 Q 27.5,21 29.5,23.5 Q 32.5,24.5 35,22.5 Z' },

  // Pecs — each half traces a dome over the orange pec
  { muscle: 'Chest',     d: 'M 18.5,22 Q 21.5,21 24.5,22.5 L 24.5,30 Q 22,31.5 19,31 Q 16.5,28.5 17,25.5 Q 17,23 18.5,22 Z' },
  { muscle: 'Chest',     d: 'M 31.5,22 Q 28.5,21 25.5,22.5 L 25.5,30 Q 28,31.5 31,31 Q 33.5,28.5 33,25.5 Q 33,23 31.5,22 Z' },

  // Biceps — tight bicep bulge under the delt
  { muscle: 'Biceps',    d: 'M 13,25.5 Q 11.5,29 12,34 Q 13.5,35.5 15.5,35 Q 16.5,31 16.5,27.5 Q 15,25 13,25.5 Z' },
  { muscle: 'Biceps',    d: 'M 37,25.5 Q 38.5,29 38,34 Q 36.5,35.5 34.5,35 Q 33.5,31 33.5,27.5 Q 35,25 37,25.5 Z' },

  // Forearms — tapered lower arm
  { muscle: 'Forearms',  d: 'M 10,37 Q 8,42 9,48 Q 11,49.5 13.5,49 Q 14.5,43 14.5,37.5 Q 12.5,36 10,37 Z' },
  { muscle: 'Forearms',  d: 'M 40,37 Q 42,42 41,48 Q 39,49.5 36.5,49 Q 35.5,43 35.5,37.5 Q 37.5,36 40,37 Z' },

  // Abs — six-pack block, tight to the ab region
  { muscle: 'Abs',       d: 'M 21,33 Q 25,32 29,33 Q 30.5,40 29.5,47 Q 25,48.5 20.5,47 Q 19.5,40 21,33 Z' },

  // Quads — each thigh, ends above the knee
  { muscle: 'Quads',     d: 'M 19,55 Q 16.5,62 18,71 Q 21,72.5 24.5,71.5 L 24.5,56 Q 22,54 19,55 Z' },
  { muscle: 'Quads',     d: 'M 31,55 Q 33.5,62 32,71 Q 29,72.5 25.5,71.5 L 25.5,56 Q 28,54 31,55 Z' },

  // Calves — under the knee to mid-shin
  { muscle: 'Calves',    d: 'M 19.5,76 Q 17.5,81 19.5,86 Q 22,87.5 24.5,86 L 24.5,76 Q 22,75 19.5,76 Z' },
  { muscle: 'Calves',    d: 'M 30.5,76 Q 32.5,81 30.5,86 Q 28,87.5 25.5,86 L 25.5,76 Q 28,75 30.5,76 Z' },

  // ─── BACK figure (right half of image, center ≈ x:74) ─────────────────
  // Rear deltoids
  { muscle: 'Shoulders', d: 'M 64,18 Q 67.5,17 70,18.5 Q 71.5,21 69.5,23.5 Q 66.5,24.5 64,22.5 Z' },
  { muscle: 'Shoulders', d: 'M 84,18 Q 80.5,17 78,18.5 Q 76.5,21 78.5,23.5 Q 81.5,24.5 84,22.5 Z' },

  // Back — traps (small diamond between rear delts, lowered to sit on the orange shape)
  { muscle: 'Back',      d: 'M 73,21 Q 76.5,23 75.5,28 Q 73,29.5 70.5,28 Q 69.5,23 73,21 Z' },
  // Back — lats (wide V, ends above the lower-back strip — no longer overshoots)
  { muscle: 'Back',      d: 'M 67,30 Q 73,29 79,30 Q 82.5,36 80.5,42 Q 73,44.5 65.5,42 Q 65,36 67,30 Z' },
  // Back — lower back (narrow strip just above glutes)
  { muscle: 'Back',      d: 'M 71,45.5 Q 74.5,46.5 78.5,45.5 L 78.5,50 Q 75,51 71,50 Z' },

  // Triceps — back of upper arm
  { muscle: 'Triceps',   d: 'M 60,26 Q 58.5,30 59,34 Q 60.5,35.5 62.5,35 Q 63.5,31 63.5,27.5 Q 62,25.5 60,26 Z' },
  { muscle: 'Triceps',   d: 'M 90,26 Q 91.5,30 91,34 Q 89.5,35.5 87.5,35 Q 86.5,31 86.5,27.5 Q 88,25.5 90,26 Z' },

  // Forearms (back)
  { muscle: 'Forearms',  d: 'M 58,37 Q 56,42 57,48 Q 59,49.5 61.5,49 Q 62.5,43 62.5,37.5 Q 60.5,36 58,37 Z' },
  { muscle: 'Forearms',  d: 'M 92,37 Q 94,42 93,48 Q 91,49.5 88.5,49 Q 87.5,43 87.5,37.5 Q 89.5,36 92,37 Z' },

  // Glutes — two cheeks, sit on the orange glute region only
  { muscle: 'Glutes',    d: 'M 67,51 Q 70.5,49.5 73.5,51 Q 74.5,56.5 73,62 Q 70,63 67,62 Q 65.5,56.5 67,51 Z' },
  { muscle: 'Glutes',    d: 'M 83,51 Q 79.5,49.5 76.5,51 Q 75.5,56.5 77,62 Q 80,63 83,62 Q 84.5,56.5 83,51 Z' },

  // Hamstrings — back of thigh, ends above the knee
  { muscle: 'Hamstrings', d: 'M 67,63.5 Q 64.5,70 66,76.5 Q 69,77.5 72.5,76.5 L 72.5,64.5 Q 70,63 67,63.5 Z' },
  { muscle: 'Hamstrings', d: 'M 83,63.5 Q 85.5,70 84,76.5 Q 81,77.5 77.5,76.5 L 77.5,64.5 Q 80,63 83,63.5 Z' },

  // Calves (back)
  { muscle: 'Calves',     d: 'M 67,78 Q 65,83.5 67,88 Q 69.5,89.5 72.5,88 L 72.5,78 Q 70,77 67,78 Z' },
  { muscle: 'Calves',     d: 'M 83,78 Q 85,83.5 83,88 Q 80.5,89.5 77.5,88 L 77.5,78 Q 80,77 83,78 Z' }
]

export default function FrontBackBodyMap({ musclesByName, selectedName, onSelect }) {
  return (
    <div className="rounded-3xl bg-bg-800/40 border border-white/5 p-2 mb-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grad opacity-25 pointer-events-none" />
      <div className="relative">
        <img
          src={bodyImg}
          alt="Bodygraph: front and back muscle map"
          className="block w-full h-auto select-none"
          draggable={false}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {OVERLAYS.map((o, i) => {
            const muscle = musclesByName[o.muscle]
            const level = muscle?.level ?? 0
            const tier = tierForLevel(level)
            const isSelected = selectedName === o.muscle

            const fill = DEBUG_OVERLAYS
              ? 'rgba(255,40,90,0.35)'
              : isSelected
                ? `${tier.color}33`
                : 'transparent'

            const stroke = DEBUG_OVERLAYS
              ? 'rgba(255,220,0,0.95)'
              : isSelected
                ? '#ffffff'
                : 'transparent'

            return (
              <path
                key={`${o.muscle}-${i}`}
                d={o.d}
                onClick={() => onSelect?.(o.muscle)}
                vectorEffect="non-scaling-stroke"
                style={{
                  cursor: 'pointer',
                  fill,
                  stroke,
                  strokeWidth: isSelected || DEBUG_OVERLAYS ? 1.5 : 0,
                  filter: isSelected && !DEBUG_OVERLAYS
                    ? `drop-shadow(0 0 4px ${tier.color})`
                    : undefined,
                  transition: 'fill 200ms ease, stroke 200ms ease, filter 200ms ease',
                  pointerEvents: 'auto'
                }}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
