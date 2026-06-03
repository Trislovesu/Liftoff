import { useEffect, useRef, useState } from 'react'
import bodyImg from '../assets/bodygraph.png'
import { tierForLevel } from '../lib/tiers.js'

// ─── Adjust toggles here ─────────────────────────────────────────────────
// DEBUG_OVERLAYS: paint hitboxes red + yellow so you can see them.
// EDIT_MODE:      live editor — click/drag/arrow-key overlays into place,
//                 then "Copy Paths" to copy the new OVERLAYS array onto
//                 your clipboard so you can paste it back into this file.
const DEBUG_OVERLAYS = false
const EDIT_MODE      = true   // ← flip to false when done positioning

// ─── Overlay zones (percent coordinates in a 0–100 viewBox) ──────────────
const OVERLAYS = [
  // FRONT figure
  { muscle: 'Shoulders', d: 'M 15,18 Q 18.5,17 21,18.5 Q 22.5,21 20.5,23.5 Q 17.5,24.5 15,22.5 Z' },
  { muscle: 'Shoulders', d: 'M 35,18 Q 31.5,17 29,18.5 Q 27.5,21 29.5,23.5 Q 32.5,24.5 35,22.5 Z' },
  { muscle: 'Chest',     d: 'M 18.5,22 Q 21.5,21 24.5,22.5 L 24.5,30 Q 22,31.5 19,31 Q 16.5,28.5 17,25.5 Q 17,23 18.5,22 Z' },
  { muscle: 'Chest',     d: 'M 31.5,22 Q 28.5,21 25.5,22.5 L 25.5,30 Q 28,31.5 31,31 Q 33.5,28.5 33,25.5 Q 33,23 31.5,22 Z' },
  { muscle: 'Biceps',    d: 'M 13,25.5 Q 11.5,29 12,34 Q 13.5,35.5 15.5,35 Q 16.5,31 16.5,27.5 Q 15,25 13,25.5 Z' },
  { muscle: 'Biceps',    d: 'M 37,25.5 Q 38.5,29 38,34 Q 36.5,35.5 34.5,35 Q 33.5,31 33.5,27.5 Q 35,25 37,25.5 Z' },
  { muscle: 'Forearms',  d: 'M 10,37 Q 8,42 9,48 Q 11,49.5 13.5,49 Q 14.5,43 14.5,37.5 Q 12.5,36 10,37 Z' },
  { muscle: 'Forearms',  d: 'M 40,37 Q 42,42 41,48 Q 39,49.5 36.5,49 Q 35.5,43 35.5,37.5 Q 37.5,36 40,37 Z' },
  { muscle: 'Abs',       d: 'M 21,33 Q 25,32 29,33 Q 30.5,40 29.5,47 Q 25,48.5 20.5,47 Q 19.5,40 21,33 Z' },
  { muscle: 'Quads',     d: 'M 19,55 Q 16.5,62 18,71 Q 21,72.5 24.5,71.5 L 24.5,56 Q 22,54 19,55 Z' },
  { muscle: 'Quads',     d: 'M 31,55 Q 33.5,62 32,71 Q 29,72.5 25.5,71.5 L 25.5,56 Q 28,54 31,55 Z' },
  { muscle: 'Calves',    d: 'M 19.5,76 Q 17.5,81 19.5,86 Q 22,87.5 24.5,86 L 24.5,76 Q 22,75 19.5,76 Z' },
  { muscle: 'Calves',    d: 'M 30.5,76 Q 32.5,81 30.5,86 Q 28,87.5 25.5,86 L 25.5,76 Q 28,75 30.5,76 Z' },

  // BACK figure
  { muscle: 'Shoulders', d: 'M 64,18 Q 67.5,17 70,18.5 Q 71.5,21 69.5,23.5 Q 66.5,24.5 64,22.5 Z' },
  { muscle: 'Shoulders', d: 'M 84,18 Q 80.5,17 78,18.5 Q 76.5,21 78.5,23.5 Q 81.5,24.5 84,22.5 Z' },
  { muscle: 'Back',      d: 'M 73,21 Q 76.5,23 75.5,28 Q 73,29.5 70.5,28 Q 69.5,23 73,21 Z' },
  { muscle: 'Back',      d: 'M 67,30 Q 73,29 79,30 Q 82.5,36 80.5,42 Q 73,44.5 65.5,42 Q 65,36 67,30 Z' },
  { muscle: 'Back',      d: 'M 71,45.5 Q 74.5,46.5 78.5,45.5 L 78.5,50 Q 75,51 71,50 Z' },
  { muscle: 'Triceps',   d: 'M 60,26 Q 58.5,30 59,34 Q 60.5,35.5 62.5,35 Q 63.5,31 63.5,27.5 Q 62,25.5 60,26 Z' },
  { muscle: 'Triceps',   d: 'M 90,26 Q 91.5,30 91,34 Q 89.5,35.5 87.5,35 Q 86.5,31 86.5,27.5 Q 88,25.5 90,26 Z' },
  { muscle: 'Forearms',  d: 'M 58,37 Q 56,42 57,48 Q 59,49.5 61.5,49 Q 62.5,43 62.5,37.5 Q 60.5,36 58,37 Z' },
  { muscle: 'Forearms',  d: 'M 92,37 Q 94,42 93,48 Q 91,49.5 88.5,49 Q 87.5,43 87.5,37.5 Q 89.5,36 92,37 Z' },
  { muscle: 'Glutes',    d: 'M 67,51 Q 70.5,49.5 73.5,51 Q 74.5,56.5 73,62 Q 70,63 67,62 Q 65.5,56.5 67,51 Z' },
  { muscle: 'Glutes',    d: 'M 83,51 Q 79.5,49.5 76.5,51 Q 75.5,56.5 77,62 Q 80,63 83,62 Q 84.5,56.5 83,51 Z' },
  { muscle: 'Hamstrings', d: 'M 67,63.5 Q 64.5,70 66,76.5 Q 69,77.5 72.5,76.5 L 72.5,64.5 Q 70,63 67,63.5 Z' },
  { muscle: 'Hamstrings', d: 'M 83,63.5 Q 85.5,70 84,76.5 Q 81,77.5 77.5,76.5 L 77.5,64.5 Q 80,63 83,63.5 Z' },
  { muscle: 'Calves',     d: 'M 67,78 Q 65,83.5 67,88 Q 69.5,89.5 72.5,88 L 72.5,78 Q 70,77 67,78 Z' },
  { muscle: 'Calves',     d: 'M 83,78 Q 85,83.5 83,88 Q 80.5,89.5 77.5,88 L 77.5,78 Q 80,77 83,78 Z' }
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
      return `  { muscle: '${o.muscle}',\tt d: '${newD}' },`.replace('\t', '')
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
