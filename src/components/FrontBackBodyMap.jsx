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
  // FRONT figure — left half of the image
  { muscle: 'Shoulders', d: 'M 14,17 Q 20,18 22,21 Q 23,24 20,26 Q 16,26 14,23 Z' },
  { muscle: 'Shoulders', d: 'M 36,17 Q 30,18 28,21 Q 27,24 30,26 Q 34,26 36,23 Z' },

  { muscle: 'Chest',     d: 'M 18,22 Q 22,21 25,23 L 25,30 Q 22,32 19,31 Q 16,28 17,25 Q 17,23 18,22 Z' },
  { muscle: 'Chest',     d: 'M 32,22 Q 28,21 25,23 L 25,30 Q 28,32 31,31 Q 34,28 33,25 Q 33,23 32,22 Z' },

  { muscle: 'Biceps',    d: 'M 12,26 Q 11,30 11,35 Q 12,37 14,37 Q 16,33 16,28 Q 15,26 12,26 Z' },
  { muscle: 'Biceps',    d: 'M 38,26 Q 39,30 39,35 Q 38,37 36,37 Q 34,33 34,28 Q 35,26 38,26 Z' },

  { muscle: 'Forearms',  d: 'M 9,38 Q 7,44 8,49 Q 10,51 13,50 Q 14,44 14,38 Q 12,37 9,38 Z' },
  { muscle: 'Forearms',  d: 'M 41,38 Q 43,44 42,49 Q 40,51 37,50 Q 36,44 36,38 Q 38,37 41,38 Z' },

  { muscle: 'Abs',       d: 'M 20,33 Q 22,32 25,32 Q 28,32 30,33 Q 32,40 30,48 Q 25,50 20,48 Q 18,40 20,33 Z' },

  { muscle: 'Quads',     d: 'M 19,55 Q 17,62 18,72 Q 21,74 24,73 L 24,56 Q 22,54 19,55 Z' },
  { muscle: 'Quads',     d: 'M 31,55 Q 33,62 32,72 Q 29,74 26,73 L 26,56 Q 28,54 31,55 Z' },

  { muscle: 'Calves',    d: 'M 19,76 Q 17,82 19,88 Q 22,89 24,88 L 24,76 Q 21,75 19,76 Z' },
  { muscle: 'Calves',    d: 'M 31,76 Q 33,82 31,88 Q 28,89 26,88 L 26,76 Q 29,75 31,76 Z' },

  // BACK figure — right half of the image
  { muscle: 'Shoulders', d: 'M 63,17 Q 69,18 71,21 Q 72,24 69,26 Q 65,26 63,23 Z' },
  { muscle: 'Shoulders', d: 'M 85,17 Q 79,18 77,21 Q 76,24 79,26 Q 83,26 85,23 Z' },

  // Back muscle = traps + lats + lower back (3 traced regions, all "Back")
  { muscle: 'Back',      d: 'M 69,17 Q 74,15 79,17 Q 81,22 75,28 Q 69,22 69,17 Z' },
  { muscle: 'Back',      d: 'M 65,28 Q 74,29 75,29 Q 82,29 84,28 Q 86,40 80,47 Q 74,49 68,47 Q 62,40 65,28 Z' },
  { muscle: 'Back',      d: 'M 71,47 Q 75,48 79,47 L 79,51 Q 75,53 71,51 Z' },

  { muscle: 'Triceps',   d: 'M 60,26 Q 59,30 59,35 Q 60,37 62,37 Q 64,33 64,28 Q 63,26 60,26 Z' },
  { muscle: 'Triceps',   d: 'M 90,26 Q 91,30 91,35 Q 90,37 88,37 Q 86,33 86,28 Q 87,26 90,26 Z' },

  { muscle: 'Forearms',  d: 'M 57,38 Q 55,44 56,49 Q 58,51 61,50 Q 62,44 62,38 Q 60,37 57,38 Z' },
  { muscle: 'Forearms',  d: 'M 93,38 Q 95,44 94,49 Q 92,51 89,50 Q 88,44 88,38 Q 90,37 93,38 Z' },

  { muscle: 'Glutes',    d: 'M 66,49 Q 70,48 74,49 Q 75,55 74,61 Q 70,63 66,61 Q 64,55 66,49 Z' },
  { muscle: 'Glutes',    d: 'M 84,49 Q 80,48 76,49 Q 75,55 76,61 Q 80,63 84,61 Q 86,55 84,49 Z' },

  { muscle: 'Hamstrings', d: 'M 66,63 Q 64,70 65,77 Q 69,78 73,77 L 73,64 Q 70,62 66,63 Z' },
  { muscle: 'Hamstrings', d: 'M 84,63 Q 86,70 85,77 Q 81,78 77,77 L 77,64 Q 80,62 84,63 Z' },

  { muscle: 'Calves',     d: 'M 66,78 Q 64,84 66,90 Q 69,91 72,90 L 72,78 Q 69,77 66,78 Z' },
  { muscle: 'Calves',     d: 'M 84,78 Q 86,84 84,90 Q 81,91 78,90 L 78,78 Q 81,77 84,78 Z' }
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
