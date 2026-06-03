import { useEffect, useRef, useState } from 'react'
import bodyImg from '../assets/bodygraph.png'
import { tierForLevel } from '../lib/tiers.js'

// ─── Adjust toggles here ─────────────────────────────────────────────────
// DEBUG_OVERLAYS: paint hitboxes red + yellow so you can see them.
// EDIT_MODE:      live editor — click/drag/arrow-key overlays into place,
//                 then "Copy Paths" to copy the new OVERLAYS array onto
//                 your clipboard so you can paste it back into this file.
const DEBUG_OVERLAYS = false
const EDIT_MODE      = false  // ← flip to true to re-open the position editor

// ─── Overlay zones (percent coordinates in a 0–100 viewBox) ──────────────
const OVERLAYS = [
  // ─── FRONT figure ────────────────────────────────────────────────────
  // Front delts — tight teardrop hugging the shoulder cap
  { muscle: 'Shoulders', d: 'M 19,22 Q 22,22.6 22.7,25.6 Q 22.4,28.3 20.9,29.6 Q 17.6,29.6 15.7,28 Q 14.7,25.5 15.9,23.4 Q 17,22.1 19,22 Z' },
  { muscle: 'Shoulders', d: 'M 38,22 Q 35,22.6 34.3,25.6 Q 34.6,28.3 36.1,29.6 Q 39.4,29.6 41.3,28 Q 42.3,25.5 41.1,23.4 Q 40,22.1 38,22 Z' },

  // Chest — kept (pec halves)
  { muscle: 'Chest',     d: 'M 22.27,23.7 Q 25.27,22.7 28.27,24.2 L 28.27,31.7 Q 25.77,33.2 22.77,32.7 Q 20.27,30.2 20.77,27.2 Q 20.77,24.7 22.27,23.7 Z' },
  { muscle: 'Chest',     d: 'M 34.76,23.7 Q 31.76,22.7 28.76,24.2 L 28.76,31.7 Q 31.26,33.2 34.26,32.7 Q 36.76,30.2 36.26,27.2 Q 36.26,24.7 34.76,23.7 Z' },

  // Biceps — tight oval on the peak only
  { muscle: 'Biceps',    d: 'M 18,30 Q 16.3,32.5 16.6,36.4 Q 17.6,37.9 19.4,37.7 Q 20.7,35.5 20.5,32.2 Q 19.6,30 18,30 Z' },
  { muscle: 'Biceps',    d: 'M 39,30 Q 40.7,32.5 40.4,36.4 Q 39.4,37.9 37.6,37.7 Q 36.3,35.5 36.5,32.2 Q 37.4,30 39,30 Z' },

  // Forearms — slim tapered from below elbow to wrist
  { muscle: 'Forearms',  d: 'M 16,38.5 Q 13.7,42 13.4,46.5 Q 14.2,49.8 16.6,50.2 Q 18,49.7 18.5,46.4 Q 18.5,42 17,38.5 Z' },
  { muscle: 'Forearms',  d: 'M 41,38.5 Q 43.3,42 43.6,46.5 Q 42.8,49.8 40.4,50.2 Q 39,49.7 38.5,46.4 Q 38.5,42 40,38.5 Z' },

  // Abs — kept
  { muscle: 'Abs',       d: 'M 24.51,33 Q 28.51,32 32.51,33 Q 34.01,40 33.01,47 Q 28.51,48.5 24.01,47 Q 23.01,40 24.51,33 Z' },

  // Quads — kept
  { muscle: 'Quads',     d: 'M 20.76,47.36 Q 18.26,54.36 19.76,63.36 Q 22.76,64.86 26.26,63.86 L 26.26,48.36 Q 23.76,46.36 20.76,47.36 Z' },
  { muscle: 'Quads',     d: 'M 36.27,47.92 Q 38.77,54.92 37.27,63.92 Q 34.27,65.42 30.77,64.42 L 30.77,48.92 Q 33.27,46.92 36.27,47.92 Z' },

  // Calves — kept
  { muscle: 'Calves',    d: 'M 19,69.21 Q 17,74.21 19,79.21 Q 21.5,80.71 24,79.21 L 24,69.21 Q 21.5,68.21 19,69.21 Z' },
  { muscle: 'Calves',    d: 'M 37.78,69.21 Q 39.78,74.21 37.78,79.21 Q 35.28,80.71 32.78,79.21 L 32.78,69.21 Q 35.28,68.21 37.78,69.21 Z' },

  // ─── BACK figure ─────────────────────────────────────────────────────
  // Rear delts — teardrop matching the front shape
  { muscle: 'Shoulders', d: 'M 67.5,22 Q 64.5,22.6 63.3,25.6 Q 63,28.3 65,29.6 Q 68,29.6 69.5,28 Q 70,25.5 69.4,23.4 Q 68.5,22.1 67.5,22 Z' },
  { muscle: 'Shoulders', d: 'M 84,22 Q 87,22.6 88.2,25.6 Q 88.5,28.3 86.5,29.6 Q 83.5,29.6 82,28 Q 81.5,25.5 82.1,23.4 Q 83,22.1 84,22 Z' },

  // Back — Traps (blue): central spear/lens from upper neck down to mid-back
  { muscle: 'Back',      d: 'M 75.5,17.5 Q 77.2,22 76.4,30 Q 75.8,38 75.5,42 Q 75.2,38 74.6,30 Q 73.8,22 75.5,17.5 Z' },

  // Back — Rhomboid Major L (purple): small diamond beside traps
  { muscle: 'Back',      d: 'M 72.7,28 Q 74,32.5 72.9,38.5 Q 71,32.5 72.7,28 Z' },
  // Back — Rhomboid Major R: mirror
  { muscle: 'Back',      d: 'M 78.3,28 Q 77,32.5 78.1,38.5 Q 80,32.5 78.3,28 Z' },

  // Back — Lat L (yellow): wing tapering from upper outer back inward to lower back
  { muscle: 'Back',      d: 'M 67,29 Q 70.5,29.6 73.3,31 L 73.7,40 L 70.7,43 Q 67,42.5 64.7,38.5 Q 64.3,33 67,29 Z' },
  // Back — Lat R: mirror
  { muscle: 'Back',      d: 'M 84,29 Q 80.5,29.6 77.7,31 L 77.3,40 L 80.3,43 Q 84,42.5 86.3,38.5 Q 86.7,33 84,29 Z' },

  // Back — Lower back (pink): small rect tucked above glutes
  { muscle: 'Back',      d: 'M 73.2,43 Q 75.2,42.6 77,43 L 77,47.5 Q 75.2,48 73.4,47.6 Z' },

  // Triceps — kept
  { muscle: 'Triceps',   d: 'M 63.51,28.83 Q 62.01,32.83 62.51,36.83 Q 64.01,38.33 66.01,37.83 Q 67.01,33.83 67.01,30.33 Q 65.51,28.33 63.51,28.83 Z' },
  { muscle: 'Triceps',   d: 'M 87.49,28.83 Q 88.99,32.83 88.49,36.83 Q 86.99,38.33 84.99,37.83 Q 83.99,33.83 83.99,30.33 Q 85.49,28.33 87.49,28.83 Z' },

  // Forearms back — kept
  { muscle: 'Forearms',  d: 'M 60.51,38.13 Q 58.51,43.13 59.51,49.13 Q 61.51,50.63 64.01,50.13 Q 65.01,44.13 65.01,38.63 Q 63.01,37.13 60.51,38.13 Z' },
  { muscle: 'Forearms',  d: 'M 89.99,38.42 Q 91.99,43.42 90.99,49.42 Q 88.99,50.92 86.49,50.42 Q 85.49,44.42 85.49,38.92 Q 87.49,37.42 89.99,38.42 Z' },

  // Glutes — kept
  { muscle: 'Glutes',    d: 'M 68.26,43.64 Q 71.76,42.14 74.76,43.64 Q 75.76,49.14 74.26,54.64 Q 71.26,55.64 68.26,54.64 Q 66.76,49.14 68.26,43.64 Z' },
  { muscle: 'Glutes',    d: 'M 82,43.64 Q 78.5,42.14 75.5,43.64 Q 74.5,49.14 76,54.64 Q 79,55.64 82,54.64 Q 83.5,49.14 82,43.64 Z' },

  // Hamstrings — kept
  { muscle: 'Hamstrings', d: 'M 67.25,54.44 Q 64.75,60.94 66.25,67.44 Q 69.25,68.44 72.75,67.44 L 72.75,55.44 Q 70.25,53.94 67.25,54.44 Z' },
  { muscle: 'Hamstrings', d: 'M 83,54.72 Q 85.5,61.22 84,67.72 Q 81,68.72 77.5,67.72 L 77.5,55.72 Q 80,54.22 83,54.72 Z' },

  // Calves back — kept
  { muscle: 'Calves',     d: 'M 65.74,69.22 Q 63.74,74.72 65.74,79.22 Q 68.24,80.72 71.24,79.22 L 71.24,69.22 Q 68.74,68.22 65.74,69.22 Z' },
  { muscle: 'Calves',     d: 'M 85.01,69.51 Q 87.01,75.01 85.01,79.51 Q 82.51,81.01 79.51,79.51 L 79.51,69.51 Q 82.01,68.51 85.01,69.51 Z' }
]

// Apply a (dx, dy) translation to every coordinate inside an SVG path d string.
// Works for M / L / Q commands (the only ones we use) — Z stays as Z.
function translatePath(d, dx, dy) {
  if (!dx && !dy) return d
  const tokens = d.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) || []
  const out = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (/[A-Za-z]/.test(t)) {
      out.push(t)
    } else {
      const x = parseFloat(t) + dx
      const y = parseFloat(tokens[i + 1]) + dy
      out.push(round(x) + ',' + round(y))
      i++ // consumed the y as well
    }
  }
  return out.join(' ')
}
const round = n => Math.round(n * 100) / 100

export default function FrontBackBodyMap({ musclesByName, selectedName, onSelect }) {
  const [transforms, setTransforms] = useState(() => OVERLAYS.map(() => ({ dx: 0, dy: 0 })))
  const [editingIdx, setEditingIdx] = useState(null)
  const svgRef = useRef(null)
  const dragRef = useRef(null)

  // Arrow-key nudging while editing. Shift = fine (0.1), default = 0.5.
  useEffect(() => {
    if (!EDIT_MODE) return
    function onKey(e) {
      if (editingIdx == null) return
      const step = e.shiftKey ? 0.1 : 0.5
      let dx = 0, dy = 0
      if (e.key === 'ArrowLeft')  dx = -step
      else if (e.key === 'ArrowRight') dx = step
      else if (e.key === 'ArrowUp')    dy = -step
      else if (e.key === 'ArrowDown')  dy = step
      else return
      e.preventDefault()
      setTransforms(ts => ts.map((v, i) => i === editingIdx ? { dx: v.dx + dx, dy: v.dy + dy } : v))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingIdx])

  function startDrag(idx, e) {
    if (!EDIT_MODE) return
    e.preventDefault()
    e.stopPropagation()
    setEditingIdx(idx)
    const base = transforms[idx]
    dragRef.current = { idx, startX: e.clientX, startY: e.clientY, baseDx: base.dx, baseDy: base.dy }

    function onMove(ev) {
      const drag = dragRef.current
      if (!drag) return
      const rect = svgRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - drag.startX) / rect.width)  * 100
      const dy = ((ev.clientY - drag.startY) / rect.height) * 100
      setTransforms(ts => ts.map((v, i) => i === drag.idx ? { dx: drag.baseDx + dx, dy: drag.baseDy + dy } : v))
    }
    function onUp() {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function nudge(dx, dy) {
    if (editingIdx == null) return
    setTransforms(ts => ts.map((v, i) => i === editingIdx ? { dx: v.dx + dx, dy: v.dy + dy } : v))
  }
  function resetSelected() {
    if (editingIdx == null) return
    setTransforms(ts => ts.map((v, i) => i === editingIdx ? { dx: 0, dy: 0 } : v))
  }
  function resetAll() {
    setTransforms(OVERLAYS.map(() => ({ dx: 0, dy: 0 })))
  }
  async function copyPaths() {
    const lines = OVERLAYS.map((o, i) => {
      const t = transforms[i]
      const newD = translatePath(o.d, t.dx, t.dy)
      return `  { muscle: '${o.muscle}', d: '${newD}' },`
    })
    const text = 'const OVERLAYS = [\n' + lines.join('\n') + '\n]'
    try {
      await navigator.clipboard.writeText(text)
      alert('New OVERLAYS array copied to clipboard.\nPaste it over the existing one in FrontBackBodyMap.jsx, then set EDIT_MODE = false.')
    } catch {
      // Fallback: dump to console
      console.log(text)
      alert('Clipboard unavailable. Paths logged to console — copy from there.')
    }
  }

  return (
    <div className="rounded-3xl bg-bg-800/40 border border-white/5 p-2 mb-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grad opacity-25 pointer-events-none" />
      <div className="relative">
        <img
          src={bodyImg}
          alt="Bodygraph"
          className="block w-full h-auto select-none"
          draggable={false}
        />
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {OVERLAYS.map((o, i) => {
            const muscle = musclesByName[o.muscle]
            const level = muscle?.level ?? 0
            const tier = tierForLevel(level)
            const isSelected = selectedName === o.muscle
            const isEditing = editingIdx === i
            const t = transforms[i]
            const showHit = DEBUG_OVERLAYS || EDIT_MODE

            const fill = showHit
              ? (isEditing ? 'rgba(120,255,180,0.55)' : 'rgba(255,40,90,0.30)')
              : (isSelected ? `${tier.color}33` : 'transparent')
            const stroke = showHit
              ? (isEditing ? '#7eff9c' : 'rgba(255,220,0,0.9)')
              : (isSelected ? '#ffffff' : 'transparent')

            // Tint + glow EVERY ranked muscle, not just selected ones.
            const tierClass = level >= 19 ? 'tier-legend'
                            : level >= 16 ? 'tier-master'
                            : level >= 13 ? 'tier-diamond'
                            : ''
            let displayFill = fill
            let displayStroke = stroke
            let glow = undefined
            if (!showHit) {
              if (level > 0) {
                // Constant tint based on tier, brighter when selected.
                const tintAlpha = isSelected ? '66' : '33'
                displayFill = `${tier.color}${tintAlpha}`
                displayStroke = isSelected ? '#ffffff' : `${tier.color}aa`
                const strength = isSelected ? 10 : 6
                glow = `drop-shadow(0 0 ${strength}px ${tier.color}) drop-shadow(0 0 ${strength * 2}px ${tier.color}88)`
              } else if (isSelected) {
                displayStroke = '#ffffff'
                glow = `drop-shadow(0 0 6px #ffffffaa)`
              }
            }

            return (
              <path
                key={i}
                d={o.d}
                transform={`translate(${t.dx} ${t.dy})`}
                onMouseDown={EDIT_MODE ? (e) => startDrag(i, e) : undefined}
                onClick={!EDIT_MODE ? () => onSelect?.(o.muscle) : undefined}
                vectorEffect="non-scaling-stroke"
                className={!showHit ? tierClass : undefined}
                style={{
                  cursor: EDIT_MODE ? 'move' : 'pointer',
                  fill: displayFill,
                  stroke: displayStroke,
                  strokeWidth: (isSelected || showHit) ? 1.5 : (level > 0 ? 0.7 : 0),
                  filter: glow,
                  transition: EDIT_MODE ? undefined : 'fill 200ms ease, stroke 200ms ease, filter 200ms ease',
                  pointerEvents: 'auto',
                  ['--tier-color']: tier.color
                }}
              />
            )
          })}
        </svg>
      </div>

      {EDIT_MODE && (
        <EditorPanel
          editingIdx={editingIdx}
          overlay={editingIdx != null ? OVERLAYS[editingIdx] : null}
          transform={editingIdx != null ? transforms[editingIdx] : null}
          totalCount={OVERLAYS.length}
          onNudge={nudge}
          onResetSelected={resetSelected}
          onResetAll={resetAll}
          onCopy={copyPaths}
          onSelectByIdx={setEditingIdx}
        />
      )}
    </div>
  )
}

function EditorPanel({ editingIdx, overlay, transform, totalCount, onNudge, onResetSelected, onResetAll, onCopy, onSelectByIdx }) {
  return (
    <div className="fixed bottom-24 right-3 z-50 w-60 bg-bg-800/95 border border-accent/40 rounded-2xl p-3 text-xs shadow-glow backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div className="font-extrabold text-accent">Overlay Editor</div>
        <div className="text-white/40 text-[10px]">{editingIdx != null ? `#${editingIdx}` : '—'}</div>
      </div>

      <div className="mb-2 text-white/70 min-h-[28px]">
        {overlay ? (
          <>
            <div className="font-bold">{overlay.muscle}</div>
            <div className="text-white/40 text-[10px]">
              dx {transform.dx.toFixed(2)} · dy {transform.dy.toFixed(2)}
            </div>
          </>
        ) : (
          <span className="text-white/40">Click a red zone to edit</span>
        )}
      </div>

      <div className="flex items-center gap-1 mb-2">
        <button
          className="btn-ghost flex-1 py-1 text-[11px]"
          disabled={editingIdx == null || editingIdx === 0}
          onClick={() => onSelectByIdx(Math.max(0, (editingIdx ?? 0) - 1))}
        >‹ Prev</button>
        <button
          className="btn-ghost flex-1 py-1 text-[11px]"
          disabled={editingIdx == null || editingIdx === totalCount - 1}
          onClick={() => onSelectByIdx(Math.min(totalCount - 1, (editingIdx ?? -1) + 1))}
        >Next ›</button>
      </div>

      <div className="grid grid-cols-3 gap-1 mb-2">
        <span />
        <button className="btn-ghost py-1.5" onClick={() => onNudge(0, -0.5)}>↑</button>
        <span />
        <button className="btn-ghost py-1.5" onClick={() => onNudge(-0.5, 0)}>←</button>
        <button className="btn-ghost py-1.5 text-[10px]" onClick={onResetSelected}>reset</button>
        <button className="btn-ghost py-1.5" onClick={() => onNudge(0.5, 0)}>→</button>
        <span />
        <button className="btn-ghost py-1.5" onClick={() => onNudge(0, 0.5)}>↓</button>
        <span />
      </div>

      <div className="flex gap-1 mb-2">
        <button className="btn-ghost flex-1 py-1.5 text-[11px]" onClick={onResetAll}>Reset All</button>
        <button className="btn-primary flex-1 py-1.5 text-[11px]" onClick={onCopy}>Copy Paths</button>
      </div>

      <div className="text-[10px] text-white/40 leading-snug">
        Drag a zone to move it.
        Arrow keys nudge 0.5 (Shift = 0.1).
        Hit Copy Paths when done.
      </div>
    </div>
  )
}
