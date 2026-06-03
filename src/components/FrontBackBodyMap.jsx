import { useEffect, useRef, useState } from 'react'
import bodyImg from '../assets/bodygraph.png'
import { tierForLevel } from '../lib/tiers.js'

// ─── Adjust toggles here ─────────────────────────────────────────────────
// DEBUG_OVERLAYS: paint hitboxes red + yellow so you can see them.
// EDIT_MODE:      live editor — click/drag/arrow-key overlays into place,
//                 then "Copy Paths" to copy the new OVERLAYS array onto
//                 your clipboard so you can paste it back into this file.
const DEBUG_OVERLAYS = false
const EDIT_MODE      = false // ← flip to true to re-open the editor

// ─── Overlay zones (percent coordinates in a 0–100 viewBox) ──────────────
const OVERLAYS = [
  { muscle: 'Chest',     d: 'M 22.27,23.7 Q 25.27,22.7 28.27,24.2 L 28.27,31.7 Q 25.77,33.2 22.77,32.7 Q 20.27,30.2 20.77,27.2 Q 20.77,24.7 22.27,23.7 Z' },
  { muscle: 'Chest',     d: 'M 34.76,23.7 Q 31.76,22.7 28.76,24.2 L 28.76,31.7 Q 31.26,33.2 34.26,32.7 Q 36.76,30.2 36.26,27.2 Q 36.26,24.7 34.76,23.7 Z' },
  { muscle: 'Triceps',   d: 'M 64.01,29.33 Q 62.51,33.33 63.01,37.33 Q 64.51,38.83 66.51,38.33 Q 67.51,34.33 67.51,30.83 Q 66.01,28.83 64.01,29.33 Z' },
  { muscle: 'Triceps',   d: 'M 86.99,29.33 Q 88.49,33.33 87.99,37.33 Q 86.49,38.83 84.49,38.33 Q 83.49,34.33 83.49,30.83 Q 84.99,28.83 86.99,29.33 Z' },
  { muscle: 'Back',      d: 'M 67.34,29.79 L 68.84,36.02 L 72.61,42.25 L 74.12,40.83 L 74.87,39.13 L 75.37,37.15 L 75.37,35.45 L 74.62,33.47 L 72.86,31.21 L 69.85,29.79 Z' },
  { muscle: 'Back',      d: 'M 82.66,29.23 L 78.39,30.93 L 75.88,35.17 L 76.13,38.57 L 76.88,40.83 L 78.39,42.53 L 80.65,39.13 L 82.15,36.87 L 83.16,34.04 L 83.41,30.64 Z' },
  { muscle: 'Back',      d: 'M 75.12,39.42 L 72.86,42.81 L 74.62,46.21 L 76.38,46.21 L 78.14,43.1 Z' },
  { muscle: 'Glutes',    d: 'M 71.35,44.84 L 68.34,47.1 L 69.09,55.03 L 72.86,55.59 L 75.37,53.04 L 75.37,48.51 L 74.12,45.97 Z' },
  { muscle: 'Glutes',    d: 'M 80.65,44.84 L 77.88,45.4 L 75.62,49.65 L 76.13,53.33 L 78.39,55.31 L 81.15,55.87 L 82.66,53.04 L 82.66,49.65 L 82.66,46.82 Z' },
  { muscle: 'Glutes',    d: 'M 75.12,55.63 L 70.85,55.91 L 66.83,54.22 L 66.58,63.27 L 67.09,68.09 L 71.35,68.09 L 73.36,62.14 Z' },
  { muscle: 'Glutes',    d: 'M 76.38,55.35 L 81.15,56.2 L 83.91,53.93 L 84.16,62.99 L 83.66,68.37 L 79.89,68.37 L 77.13,61.29 Z' },
  { muscle: 'Calves',    d: 'M 66.83,69.22 L 65.58,74.03 L 66.08,79.97 L 69.35,79.97 L 70.85,75.45 L 70.6,70.35 L 68.84,68.65 Z' },
  { muscle: 'Calves',    d: 'M 79.89,70.07 L 79.89,75.45 L 81.65,79.97 L 84.67,79.69 L 85.42,74.88 L 83.66,69.5 Z' },
  { muscle: 'Forearms',  d: 'M 62.31,37.52 L 60.3,41.2 L 59.3,47.99 L 61.31,49.12 L 64.07,44.59 L 66.08,38.65 Z' },
  { muscle: 'Forearms',  d: 'M 85.17,38.93 L 86.67,44.31 L 90.19,49.12 L 91.45,47.14 L 90.69,42.05 L 88.68,37.52 Z' },
  { muscle: 'Shoulders', d: 'M 69.09,22.8 L 64.57,24.78 L 63.82,28.74 L 66.08,29.02 L 69.6,27.89 L 71.1,25.06 Z' },
  { muscle: 'Shoulders', d: 'M 85.92,24.21 L 82.41,23.08 L 79.89,24.78 L 81.15,27.61 L 83.91,29.02 L 87.43,29.31 Z' },
  { muscle: 'Back',      d: 'M 75.12,18.27 L 72.86,19.12 L 72.61,20.53 L 69.35,22.8 L 71.35,24.21 L 70.6,27.04 L 68.84,28.74 L 72.36,30.44 L 75.62,34.69 L 78.14,30.44 L 82.66,28.74 L 78.89,24.5 L 81.9,22.8 L 77.63,18.84 Z' },
  { muscle: 'Shoulders', d: 'M 21.63,23.08 L 18.61,23.65 L 17.11,26.19 L 16.6,29.87 L 18.61,29.59 L 20.12,27.33 Z' },
  { muscle: 'Shoulders', d: 'M 34.94,23.36 L 38.71,23.65 L 40.46,26.76 L 40.46,30.16 L 37.45,28.46 Z' },
  { muscle: 'Biceps',    d: 'M 20.12,29.31 L 18.36,30.16 L 16.6,31.01 L 15.85,32.7 L 15.6,35.54 L 15.6,37.23 L 16.6,38.08 L 17.36,38.93 L 18.36,38.37 L 19.37,37.52 L 20.12,35.82 L 20.62,34.12 L 21.13,31.86 Z' },
  { muscle: 'Biceps',    d: 'M 37.2,29.02 L 38.96,30.16 L 40.21,31.01 L 41.22,32.42 L 41.47,34.69 L 41.47,36.95 L 40.21,38.08 L 39.46,38.37 L 37.95,37.8 L 37.2,36.38 L 36.7,34.69 L 36.7,31.86 Z' },
  { muscle: 'Forearms',  d: 'M 15.1,37.52 L 13.34,40.63 L 12.84,44.31 L 12.08,47.71 L 13.84,48.56 L 15.6,46.01 L 17.11,44.59 L 18.11,42.05 L 18.36,39.78 L 18.61,38.93 Z' },
  { muscle: 'Forearms',  d: 'M 41.47,37.52 L 42.72,38.93 L 43.73,40.91 L 43.98,43.74 L 44.73,46.86 L 43.98,48.27 L 42.47,48.27 L 40.97,46.01 L 39.71,43.74 L 38.71,41.76 L 38.45,39.5 Z' },
  { muscle: 'Quads',     d: 'M 23.64,47.14 L 20.37,51.67 L 19.37,57.61 L 19.87,64.97 L 21.38,65.26 L 22.38,64.97 L 23.39,65.54 L 24.14,66.1 L 25.39,65.82 L 25.9,63.56 L 25.9,61.29 L 27.15,58.46 L 27.65,55.35 L 26.9,51.39 L 25.9,48.84 Z' },
  { muscle: 'Quads',     d: 'M 33.18,47.42 L 34.69,48.27 L 35.69,50.82 L 36.45,52.52 L 37.45,55.35 L 37.2,60.16 L 36.95,64.69 L 35.19,65.26 L 33.93,64.97 L 32.93,66.39 L 31.67,65.54 L 30.67,62.42 L 28.66,55.63 L 28.91,53.37 Z' },
  { muscle: 'Abs',       d: 'M 28.41,32.7 L 25.14,33.84 L 24.64,37.23 L 24.89,40.91 L 25.39,44.31 L 26.15,48.27 L 28.41,49.12 L 30.42,48.56 L 31.17,46.86 L 31.67,43.46 L 31.92,40.63 L 32.18,38.08 L 32.18,36.1 L 32.18,33.84 Z' },
  { muscle: 'Calves',    d: 'M 19.87,69.22 L 18.36,74.03 L 19.12,79.97 L 19.62,84.5 L 22.13,84.5 L 23.89,76.29 L 23.64,70.92 L 23.89,70.35 Z' },
  { muscle: 'Calves',    d: 'M 33.18,70.63 L 33.18,76.86 L 34.94,84.5 L 37.45,84.22 L 38.45,74.88 L 37.2,70.07 Z' }
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
