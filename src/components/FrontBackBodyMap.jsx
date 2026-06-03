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
  { muscle: 'Shoulders', d: 'M 15.25,22.81 Q 18.75,21.81 21.25,23.31 Q 22.75,25.81 20.75,28.31 Q 17.75,29.31 15.25,27.31 Z' },
  { muscle: 'Shoulders', d: 'M 41.77,23.38 Q 38.27,22.38 35.77,23.88 Q 34.27,26.38 36.27,28.88 Q 39.27,29.88 41.77,27.88 Z' },
  { muscle: 'Chest',     d: 'M 22.27,23.7 Q 25.27,22.7 28.27,24.2 L 28.27,31.7 Q 25.77,33.2 22.77,32.7 Q 20.27,30.2 20.77,27.2 Q 20.77,24.7 22.27,23.7 Z' },
  { muscle: 'Chest',     d: 'M 34.76,23.7 Q 31.76,22.7 28.76,24.2 L 28.76,31.7 Q 31.26,33.2 34.26,32.7 Q 36.76,30.2 36.26,27.2 Q 36.26,24.7 34.76,23.7 Z' },
  { muscle: 'Biceps',    d: 'M 17.02,28.61 Q 15.52,32.11 16.02,37.11 Q 17.52,38.61 19.52,38.11 Q 20.52,34.11 20.52,30.61 Q 19.02,28.11 17.02,28.61 Z' },
  { muscle: 'Biceps',    d: 'M 40.01,28.9 Q 41.51,32.4 41.01,37.4 Q 39.51,38.9 37.51,38.4 Q 36.51,34.4 36.51,30.9 Q 38.01,28.4 40.01,28.9 Z' },
  { muscle: 'Forearms',  d: 'M 14.02,38.13 Q 12.02,43.13 13.02,49.13 Q 15.02,50.63 17.52,50.13 Q 18.52,44.13 18.52,38.63 Q 16.52,37.13 14.02,38.13 Z' },
  { muscle: 'Forearms',  d: 'M 43.01,38.13 Q 45.01,43.13 44.01,49.13 Q 42.01,50.63 39.51,50.13 Q 38.51,44.13 38.51,38.63 Q 40.51,37.13 43.01,38.13 Z' },
  { muscle: 'Abs',       d: 'M 24.51,33 Q 28.51,32 32.51,33 Q 34.01,40 33.01,47 Q 28.51,48.5 24.01,47 Q 23.01,40 24.51,33 Z' },
  { muscle: 'Quads',     d: 'M 20.76,47.36 Q 18.26,54.36 19.76,63.36 Q 22.76,64.86 26.26,63.86 L 26.26,48.36 Q 23.76,46.36 20.76,47.36 Z' },
  { muscle: 'Quads',     d: 'M 36.27,47.92 Q 38.77,54.92 37.27,63.92 Q 34.27,65.42 30.77,64.42 L 30.77,48.92 Q 33.27,46.92 36.27,47.92 Z' },
  { muscle: 'Calves',    d: 'M 19,69.21 Q 17,74.21 19,79.21 Q 21.5,80.71 24,79.21 L 24,69.21 Q 21.5,68.21 19,69.21 Z' },
  { muscle: 'Calves',    d: 'M 37.78,69.21 Q 39.78,74.21 37.78,79.21 Q 35.28,80.71 32.78,79.21 L 32.78,69.21 Q 35.28,68.21 37.78,69.21 Z' },
  { muscle: 'Shoulders', d: 'M 63,22.81 Q 66.5,21.81 69,23.31 Q 70.5,25.81 68.5,28.31 Q 65.5,29.31 63,27.31 Z' },
  { muscle: 'Shoulders', d: 'M 87.51,22.53 Q 84.01,21.53 81.51,23.03 Q 80.01,25.53 82.01,28.03 Q 85.01,29.03 87.51,27.03 Z' },
  { muscle: 'Back',      d: 'M 75.51,17.89 Q 79.01,19.89 78.01,24.89 Q 75.51,26.39 73.01,24.89 Q 72.01,19.89 75.51,17.89 Z' },
  { muscle: 'Back',      d: 'M 69.51,26.89 Q 75.51,25.89 81.51,26.89 Q 85.01,32.89 83.01,38.89 Q 75.51,41.39 68.01,38.89 Q 67.51,32.89 69.51,26.89 Z' },
  { muscle: 'Back',      d: 'M 71.25,39.84 Q 74.75,40.84 78.75,39.84 L 78.75,44.34 Q 75.25,45.34 71.25,44.34 Z' },
  { muscle: 'Triceps',   d: 'M 63.51,28.83 Q 62.01,32.83 62.51,36.83 Q 64.01,38.33 66.01,37.83 Q 67.01,33.83 67.01,30.33 Q 65.51,28.33 63.51,28.83 Z' },
  { muscle: 'Triceps',   d: 'M 87.49,28.83 Q 88.99,32.83 88.49,36.83 Q 86.99,38.33 84.99,37.83 Q 83.99,33.83 83.99,30.33 Q 85.49,28.33 87.49,28.83 Z' },
  { muscle: 'Forearms',  d: 'M 60.51,38.13 Q 58.51,43.13 59.51,49.13 Q 61.51,50.63 64.01,50.13 Q 65.01,44.13 65.01,38.63 Q 63.01,37.13 60.51,38.13 Z' },
  { muscle: 'Forearms',  d: 'M 89.99,38.42 Q 91.99,43.42 90.99,49.42 Q 88.99,50.92 86.49,50.42 Q 85.49,44.42 85.49,38.92 Q 87.49,37.42 89.99,38.42 Z' },
  { muscle: 'Glutes',    d: 'M 68.26,43.64 Q 71.76,42.14 74.76,43.64 Q 75.76,49.14 74.26,54.64 Q 71.26,55.64 68.26,54.64 Q 66.76,49.14 68.26,43.64 Z' },
  { muscle: 'Glutes',    d: 'M 82,43.64 Q 78.5,42.14 75.5,43.64 Q 74.5,49.14 76,54.64 Q 79,55.64 82,54.64 Q 83.5,49.14 82,43.64 Z' },
  { muscle: 'Hamstrings', d: 'M 67.25,54.44 Q 64.75,60.94 66.25,67.44 Q 69.25,68.44 72.75,67.44 L 72.75,55.44 Q 70.25,53.94 67.25,54.44 Z' },
  { muscle: 'Hamstrings', d: 'M 83,54.72 Q 85.5,61.22 84,67.72 Q 81,68.72 77.5,67.72 L 77.5,55.72 Q 80,54.22 83,54.72 Z' },
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

            return (
              <path
                key={i}
                d={o.d}
                transform={`translate(${t.dx} ${t.dy})`}
                onMouseDown={EDIT_MODE ? (e) => startDrag(i, e) : undefined}
                onClick={!EDIT_MODE ? () => onSelect?.(o.muscle) : undefined}
                vectorEffect="non-scaling-stroke"
                style={{
                  cursor: EDIT_MODE ? 'move' : 'pointer',
                  fill,
                  stroke,
                  strokeWidth: (isSelected || showHit) ? 1.5 : 0,
                  filter: (isSelected && !showHit) ? `drop-shadow(0 0 4px ${tier.color})` : undefined,
                  transition: EDIT_MODE ? undefined : 'fill 200ms ease, stroke 200ms ease, filter 200ms ease',
                  pointerEvents: 'auto'
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
