import { useEffect, useRef, useState } from 'react'
import bodyImg from '../assets/bodygraph.png'
import { tierForLevel } from '../lib/tiers.js'

// ─── Adjust toggles here ─────────────────────────────────────────────────
// DEBUG_OVERLAYS: paint hitboxes red + yellow so you can see them.
// EDIT_MODE:      live editor — click/drag/arrow-key overlays into place,
//                 then "Copy Paths" to copy the new OVERLAYS array onto
//                 your clipboard so you can paste it back into this file.
const DEBUG_OVERLAYS = false
const EDIT_MODE      = true  // ← flip to false to ship

// ─── Overlay zones (percent coordinates in a 0–100 viewBox) ──────────────
const OVERLAYS = [
  { muscle: 'Shoulders',  d: 'M 19.5,22.5 Q 22.5,23.1 23.2,26.1 Q 22.9,28.8 21.4,30.1 Q 18.1,30.1 16.2,28.5 Q 15.2,26 16.4,23.9 Q 17.5,22.6 19.5,22.5 Z' },
  { muscle: 'Shoulders',  d: 'M 38,22.5 Q 35,23.1 34.3,26.1 Q 34.6,28.8 36.1,30.1 Q 39.4,30.1 41.3,28.5 Q 42.3,26 41.1,23.9 Q 40,22.6 38,22.5 Z' },
  { muscle: 'Chest',      d: 'M 22.27,23.7 Q 25.27,22.7 28.27,24.2 L 28.27,31.7 Q 25.77,33.2 22.77,32.7 Q 20.27,30.2 20.77,27.2 Q 20.77,24.7 22.27,23.7 Z' },
  { muscle: 'Chest',      d: 'M 34.76,23.7 Q 31.76,22.7 28.76,24.2 L 28.76,31.7 Q 31.26,33.2 34.26,32.7 Q 36.76,30.2 36.26,27.2 Q 36.26,24.7 34.76,23.7 Z' },
  { muscle: 'Biceps',     d: 'M 17.5,30 Q 15.8,32.5 16.1,36.4 Q 17.1,37.9 18.9,37.7 Q 20.2,35.5 20,32.2 Q 19.1,30 17.5,30 Z' },
  { muscle: 'Biceps',     d: 'M 39.5,30.5 Q 41.2,33 40.9,36.9 Q 39.9,38.4 38.1,38.2 Q 36.8,36 37,32.7 Q 37.9,30.5 39.5,30.5 Z' },
  { muscle: 'Forearms',   d: 'M 15,38 Q 12.7,41.5 12.4,46 Q 13.2,49.3 15.6,49.7 Q 17,49.2 17.5,45.9 Q 17.5,41.5 16,38 Z' },
  { muscle: 'Forearms',   d: 'M 42,38 Q 44.3,41.5 44.6,46 Q 43.8,49.3 41.4,49.7 Q 40,49.2 39.5,45.9 Q 39.5,41.5 41,38 Z' },
  { muscle: 'Abs',        d: 'M 24.51,33 Q 28.51,32 32.51,33 Q 34.01,40 33.01,47 Q 28.51,48.5 24.01,47 Q 23.01,40 24.51,33 Z' },
  { muscle: 'Quads',      d: 'M 20.76,47.86 Q 18.26,54.86 19.76,63.86 Q 22.76,65.36 26.26,64.36 L 26.26,48.86 Q 23.76,46.86 20.76,47.86 Z' },
  { muscle: 'Quads',      d: 'M 36.27,48.42 Q 38.77,55.42 37.27,64.42 Q 34.27,65.92 30.77,64.92 L 30.77,49.42 Q 33.27,47.42 36.27,48.42 Z' },
  { muscle: 'Calves',     d: 'M 19,69.21 Q 17,74.21 19,79.21 Q 21.5,80.71 24,79.21 L 24,69.21 Q 21.5,68.21 19,69.21 Z' },
  { muscle: 'Calves',     d: 'M 37.78,69.21 Q 39.78,74.21 37.78,79.21 Q 35.28,80.71 32.78,79.21 L 32.78,69.21 Q 35.28,68.21 37.78,69.21 Z' },
  { muscle: 'Shoulders',  d: 'M 68,22 Q 65,22.6 63.8,25.6 Q 63.5,28.3 65.5,29.6 Q 68.5,29.6 70,28 Q 70.5,25.5 69.9,23.4 Q 69,22.1 68,22 Z' },
  { muscle: 'Shoulders',  d: 'M 83.5,22 Q 86.5,22.6 87.7,25.6 Q 88,28.3 86,29.6 Q 83,29.6 81.5,28 Q 81,25.5 81.6,23.4 Q 82.5,22.1 83.5,22 Z' },
  { muscle: 'Back',       d: 'M 75.5,17.5 Q 77.2,22 76.4,30 Q 75.8,38 75.5,42 Q 75.2,38 74.6,30 Q 73.8,22 75.5,17.5 Z' },
  { muscle: 'Back',       d: 'M 72.7,23.5 Q 74,28 72.9,34 Q 71,28 72.7,23.5 Z' },
  { muscle: 'Back',       d: 'M 78.3,23 Q 77,27.5 78.1,33.5 Q 80,27.5 78.3,23 Z' },
  { muscle: 'Back',       d: 'M 69,29 Q 72.5,29.6 75.3,31 L 75.7,40 L 72.7,43 Q 69,42.5 66.7,38.5 Q 66.3,33 69,29 Z' },
  { muscle: 'Back',       d: 'M 82.5,29 Q 79,29.6 76.2,31 L 75.8,40 L 78.8,43 Q 82.5,42.5 84.8,38.5 Q 85.2,33 82.5,29 Z' },
  { muscle: 'Back',       d: 'M 73.7,42 Q 75.7,41.6 77.5,42 L 77.5,46.5 Q 75.7,47 73.9,46.6 Z' },
  { muscle: 'Triceps',    d: 'M 63.51,28.83 Q 62.01,32.83 62.51,36.83 Q 64.01,38.33 66.01,37.83 Q 67.01,33.83 67.01,30.33 Q 65.51,28.33 63.51,28.83 Z' },
  { muscle: 'Triceps',    d: 'M 87.49,28.83 Q 88.99,32.83 88.49,36.83 Q 86.99,38.33 84.99,37.83 Q 83.99,33.83 83.99,30.33 Q 85.49,28.33 87.49,28.83 Z' },
  { muscle: 'Forearms',   d: 'M 60.51,38.13 Q 58.51,43.13 59.51,49.13 Q 61.51,50.63 64.01,50.13 Q 65.01,44.13 65.01,38.63 Q 63.01,37.13 60.51,38.13 Z' },
  { muscle: 'Forearms',   d: 'M 89.99,38.42 Q 91.99,43.42 90.99,49.42 Q 88.99,50.92 86.49,50.42 Q 85.49,44.42 85.49,38.92 Q 87.49,37.42 89.99,38.42 Z' },
  { muscle: 'Glutes',     d: 'M 68.26,43.64 Q 71.76,42.14 74.76,43.64 Q 75.76,49.14 74.26,54.64 Q 71.26,55.64 68.26,54.64 Q 66.76,49.14 68.26,43.64 Z' },
  { muscle: 'Glutes',     d: 'M 82,43.64 Q 78.5,42.14 75.5,43.64 Q 74.5,49.14 76,54.64 Q 79,55.64 82,54.64 Q 83.5,49.14 82,43.64 Z' },
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

const MUSCLE_NAMES = ['Shoulders', 'Chest', 'Biceps', 'Triceps', 'Forearms', 'Abs', 'Back', 'Quads', 'Hamstrings', 'Glutes', 'Calves']

// Build a path "d" string from a list of {x,y} points.
function pointsToD(points) {
  if (points.length < 2) return ''
  let d = `M ${round(points[0].x)},${round(points[0].y)}`
  for (let i = 1; i < points.length; i++) d += ` L ${round(points[i].x)},${round(points[i].y)}`
  return d + ' Z'
}

export default function FrontBackBodyMap({ musclesByName, selectedName, onSelect }) {
  // Unified items list: starts with OVERLAYS, can grow (drafts) or shrink (deletes).
  const [items, setItems] = useState(() =>
    OVERLAYS.map(o => ({ muscle: o.muscle, d: o.d, transform: { dx: 0, dy: 0 } }))
  )
  const [editingIdx, setEditingIdx] = useState(null)

  // Draw mode state
  const [mode, setMode] = useState('edit')           // 'edit' | 'draw'
  const [drawPoints, setDrawPoints] = useState([])
  const [drawMuscle, setDrawMuscle] = useState('Shoulders')

  const svgRef = useRef(null)
  const dragRef = useRef(null)

  // Arrow-key nudging while editing. Shift = fine (0.1), default = 0.5.
  // In draw mode: Backspace removes last point, Enter finishes, Escape cancels.
  useEffect(() => {
    if (!EDIT_MODE) return
    function onKey(e) {
      if (mode === 'draw') {
        if (e.key === 'Backspace') { e.preventDefault(); setDrawPoints(p => p.slice(0, -1)) }
        else if (e.key === 'Enter') { e.preventDefault(); finishDrawing() }
        else if (e.key === 'Escape') { e.preventDefault(); cancelDrawing() }
        return
      }
      if (editingIdx == null) return
      const step = e.shiftKey ? 0.1 : 0.5
      let dx = 0, dy = 0
      if (e.key === 'ArrowLeft')  dx = -step
      else if (e.key === 'ArrowRight') dx = step
      else if (e.key === 'ArrowUp')    dy = -step
      else if (e.key === 'ArrowDown')  dy = step
      else if (e.key === 'Delete') { e.preventDefault(); deleteSelected(); return }
      else return
      e.preventDefault()
      setItems(is => is.map((v, i) => i === editingIdx ? { ...v, transform: { dx: v.transform.dx + dx, dy: v.transform.dy + dy } } : v))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingIdx, mode, drawPoints])

  function startDrag(idx, e) {
    if (!EDIT_MODE || mode === 'draw') return
    e.preventDefault()
    e.stopPropagation()
    setEditingIdx(idx)
    const base = items[idx].transform
    dragRef.current = { idx, startX: e.clientX, startY: e.clientY, baseDx: base.dx, baseDy: base.dy }

    function onMove(ev) {
      const drag = dragRef.current
      if (!drag) return
      const rect = svgRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - drag.startX) / rect.width)  * 100
      const dy = ((ev.clientY - drag.startY) / rect.height) * 100
      setItems(is => is.map((v, i) => i === drag.idx ? { ...v, transform: { dx: drag.baseDx + dx, dy: drag.baseDy + dy } } : v))
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
    setItems(is => is.map((v, i) => i === editingIdx ? { ...v, transform: { dx: v.transform.dx + dx, dy: v.transform.dy + dy } } : v))
  }
  function resetSelected() {
    if (editingIdx == null) return
    setItems(is => is.map((v, i) => i === editingIdx ? { ...v, transform: { dx: 0, dy: 0 } } : v))
  }
  function resetAll() {
    setItems(OVERLAYS.map(o => ({ muscle: o.muscle, d: o.d, transform: { dx: 0, dy: 0 } })))
    setEditingIdx(null)
  }
  function deleteSelected() {
    if (editingIdx == null) return
    if (!confirm(`Delete overlay #${editingIdx} (${items[editingIdx].muscle})?`)) return
    setItems(is => is.filter((_, i) => i !== editingIdx))
    setEditingIdx(null)
  }
  function setSelectedMuscle(name) {
    if (editingIdx == null) return
    setItems(is => is.map((v, i) => i === editingIdx ? { ...v, muscle: name } : v))
  }

  // ─── Draw mode ────────────────────────────────────────────────────────
  function svgPointFromMouse(ev) {
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: ((ev.clientX - rect.left) / rect.width)  * 100,
      y: ((ev.clientY - rect.top)  / rect.height) * 100
    }
  }
  function onSvgClick(ev) {
    if (mode !== 'draw') return
    // Ignore clicks on existing overlays — only blank-canvas clicks add points.
    if (ev.target.tagName === 'path') return
    const p = svgPointFromMouse(ev)
    setDrawPoints(arr => [...arr, p])
  }
  function startDrawing() {
    setEditingIdx(null)
    setDrawPoints([])
    setMode('draw')
  }
  function finishDrawing() {
    if (drawPoints.length < 3) { alert('Need at least 3 points to make a shape.'); return }
    const d = pointsToD(drawPoints)
    setItems(is => [...is, { muscle: drawMuscle, d, transform: { dx: 0, dy: 0 } }])
    setDrawPoints([])
    setMode('edit')
    setEditingIdx(items.length) // select the newly added one
  }
  function cancelDrawing() { setDrawPoints([]); setMode('edit') }

  async function copyPaths() {
    const lines = items.map(it => {
      const t = it.transform
      const newD = translatePath(it.d, t.dx, t.dy)
      return `  { muscle: '${it.muscle}', d: '${newD}' },`
    })
    const text = 'const OVERLAYS = [\n' + lines.join('\n') + '\n]'
    try {
      await navigator.clipboard.writeText(text)
      alert('New OVERLAYS array copied to clipboard.\nPaste it over the existing one in FrontBackBodyMap.jsx, then set EDIT_MODE = false.')
    } catch {
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
          onClick={onSvgClick}
          style={{ cursor: mode === 'draw' ? 'crosshair' : undefined }}
        >
          {items.map((o, i) => {
            const muscle = musclesByName[o.muscle]
            const level = muscle?.level ?? 0
            const tier = tierForLevel(level)
            const isSelected = selectedName === o.muscle
            const isEditing = editingIdx === i
            const t = o.transform
            const showHit = DEBUG_OVERLAYS || EDIT_MODE

            const fill = showHit
              ? (isEditing ? 'rgba(120,255,180,0.55)' : 'rgba(255,40,90,0.30)')
              : (isSelected ? `${tier.color}33` : 'transparent')
            const stroke = showHit
              ? (isEditing ? '#7eff9c' : 'rgba(255,220,0,0.9)')
              : (isSelected ? '#ffffff' : 'transparent')

            // Subtle indicator for ranked muscles; real glow only on selected.
            // Tier-effect animations also only fire when selected, so the map
            // isn't a constant disco.
            const tierClass = isSelected
              ? (level >= 19 ? 'tier-legend'
                : level >= 16 ? 'tier-master'
                : level >= 13 ? 'tier-diamond'
                : '')
              : ''
            let displayFill = fill
            let displayStroke = stroke
            let glow = undefined
            if (!showHit) {
              if (isSelected) {
                displayFill   = level > 0 ? `${tier.color}55` : 'rgba(255,255,255,0.08)'
                displayStroke = '#ffffff'
                glow = level > 0
                  ? `drop-shadow(0 0 6px ${tier.color})`
                  : `drop-shadow(0 0 4px rgba(255,255,255,0.7))`
              } else if (level > 0) {
                // Very faint resting tint — just enough to know it's ranked.
                displayFill   = `${tier.color}14`
                displayStroke = `${tier.color}55`
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
                  strokeWidth: (isSelected || showHit) ? 1.5 : (level > 0 ? 0.4 : 0),
                  filter: glow,
                  transition: EDIT_MODE ? undefined : 'fill 200ms ease, stroke 200ms ease, filter 200ms ease',
                  pointerEvents: 'auto',
                  ['--tier-color']: tier.color
                }}
              />
            )
          })}

          {/* Labels for selected overlay in edit mode */}
          {EDIT_MODE && editingIdx != null && items[editingIdx] && (
            <LabelChip text={items[editingIdx].muscle} dRef={items[editingIdx]} />
          )}

          {/* In-progress drawing polygon */}
          {EDIT_MODE && mode === 'draw' && drawPoints.length > 0 && (
            <>
              <polyline
                points={drawPoints.map(p => `${p.x},${p.y}`).join(' ') +
                        (drawPoints.length >= 3 ? ` ${drawPoints[0].x},${drawPoints[0].y}` : '')}
                fill={drawPoints.length >= 3 ? 'rgba(120,255,180,0.20)' : 'none'}
                stroke="#7eff9c"
                strokeWidth="1"
                strokeDasharray="1.2 1"
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: 'none' }}
              />
              {drawPoints.map((p, i) => (
                <g key={i} style={{ pointerEvents: 'none' }}>
                  <circle cx={p.x} cy={p.y} r="0.8" fill="#7eff9c" stroke="#000" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
            </>
          )}
        </svg>
      </div>

      {EDIT_MODE && (
        <EditorPanel
          mode={mode}
          editingIdx={editingIdx}
          overlay={editingIdx != null ? items[editingIdx] : null}
          totalCount={items.length}
          drawPoints={drawPoints}
          drawMuscle={drawMuscle}
          onChangeDrawMuscle={setDrawMuscle}
          onChangeOverlayMuscle={setSelectedMuscle}
          onNudge={nudge}
          onResetSelected={resetSelected}
          onResetAll={resetAll}
          onDeleteSelected={deleteSelected}
          onCopy={copyPaths}
          onSelectByIdx={setEditingIdx}
          onStartDraw={startDrawing}
          onFinishDraw={finishDrawing}
          onCancelDraw={cancelDrawing}
          onUndoPoint={() => setDrawPoints(p => p.slice(0, -1))}
        />
      )}
    </div>
  )
}

function LabelChip({ text, dRef }) {
  // Crude center: parse the first M command of d for an anchor near the centroid
  // (overlaid translation is already on the path element).
  const tokens = dRef.d.match(/-?\d+(?:\.\d+)?/g) || []
  let cx = 50, cy = 50
  if (tokens.length >= 4) {
    // average all coordinate pairs
    let sx = 0, sy = 0, n = 0
    for (let i = 0; i + 1 < tokens.length; i += 2) {
      sx += parseFloat(tokens[i]); sy += parseFloat(tokens[i + 1]); n++
    }
    cx = sx / n + dRef.transform.dx
    cy = sy / n + dRef.transform.dy
  }
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={cx - 6} y={cy - 1.6} width="12" height="3.2" rx="1.2"
        fill="rgba(0,0,0,0.7)" stroke="#7eff9c" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
      <text x={cx} y={cy + 0.7} textAnchor="middle" fontSize="2"
        fill="#ffffff" fontWeight="700" style={{ userSelect: 'none' }}>
        {text}
      </text>
    </g>
  )
}

function EditorPanel({
  mode, editingIdx, overlay, totalCount,
  drawPoints, drawMuscle,
  onChangeDrawMuscle, onChangeOverlayMuscle,
  onNudge, onResetSelected, onResetAll, onDeleteSelected, onCopy, onSelectByIdx,
  onStartDraw, onFinishDraw, onCancelDraw, onUndoPoint
}) {
  if (mode === 'draw') {
    return (
      <div className="fixed bottom-24 right-3 z-50 w-64 bg-bg-800/95 border border-xp/50 rounded-2xl p-3 text-xs shadow-glow backdrop-blur-md">
        <div className="font-extrabold text-xp mb-2">Draw Mode</div>
        <div className="text-white/70 mb-2">
          Click on the body to add points.
          <div className="text-white/40 text-[10px]">{drawPoints.length} point{drawPoints.length === 1 ? '' : 's'} placed</div>
        </div>
        <label className="block mb-2">
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Muscle</div>
          <select className="input w-full text-xs py-1"
            value={drawMuscle} onChange={e => onChangeDrawMuscle(e.target.value)}>
            {MUSCLE_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <div className="flex gap-1 mb-2">
          <button className="btn-ghost flex-1 py-1 text-[11px]"
            disabled={drawPoints.length === 0} onClick={onUndoPoint}>Undo</button>
          <button className="btn-ghost flex-1 py-1 text-[11px]" onClick={onCancelDraw}>Cancel</button>
        </div>
        <button className="btn-primary w-full py-1.5 text-[11px]"
          disabled={drawPoints.length < 3} onClick={onFinishDraw}>
          ✓ Finish ({drawPoints.length}/3)
        </button>
        <div className="text-[10px] text-white/40 leading-snug mt-2">
          Backspace = undo · Enter = finish · Esc = cancel
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-24 right-3 z-50 w-64 bg-bg-800/95 border border-accent/40 rounded-2xl p-3 text-xs shadow-glow backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div className="font-extrabold text-accent">Overlay Editor</div>
        <div className="text-white/40 text-[10px]">{editingIdx != null ? `#${editingIdx}` : '—'} / {totalCount}</div>
      </div>

      <div className="mb-2">
        {overlay ? (
          <>
            <select className="input w-full text-xs py-1 font-bold mb-1"
              value={overlay.muscle} onChange={e => onChangeOverlayMuscle(e.target.value)}>
              {MUSCLE_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="text-white/40 text-[10px]">
              dx {overlay.transform.dx.toFixed(2)} · dy {overlay.transform.dy.toFixed(2)}
            </div>
          </>
        ) : (
          <span className="text-white/40">Click a red zone to edit</span>
        )}
      </div>

      <div className="flex items-center gap-1 mb-2">
        <button className="btn-ghost flex-1 py-1 text-[11px]"
          disabled={editingIdx == null || editingIdx === 0}
          onClick={() => onSelectByIdx(Math.max(0, (editingIdx ?? 0) - 1))}>‹ Prev</button>
        <button className="btn-ghost flex-1 py-1 text-[11px]"
          disabled={editingIdx == null || editingIdx === totalCount - 1}
          onClick={() => onSelectByIdx(Math.min(totalCount - 1, (editingIdx ?? -1) + 1))}>Next ›</button>
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

      <div className="flex gap-1 mb-1">
        <button className="btn-ghost flex-1 py-1.5 text-[11px]"
          disabled={editingIdx == null}
          onClick={onDeleteSelected}>🗑 Delete</button>
        <button className="btn-ghost flex-1 py-1.5 text-[11px]" onClick={onResetAll}>Reset All</button>
      </div>
      <div className="flex gap-1 mb-2">
        <button className="btn-ghost flex-1 py-1.5 text-[11px] text-xp" onClick={onStartDraw}>✎ Draw New</button>
        <button className="btn-primary flex-1 py-1.5 text-[11px]" onClick={onCopy}>Copy Paths</button>
      </div>

      <div className="text-[10px] text-white/40 leading-snug">
        Drag = move · Arrows = nudge 0.5 (Shift = 0.1) · Delete = remove · Draw New = trace a polygon
      </div>
    </div>
  )
}
