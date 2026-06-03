import { useMemo, useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import BodyMap from '../components/BodyMap.jsx'
import MuscleDetailPanel from '../components/MuscleDetailPanel.jsx'
import MuscleGrid from '../components/MuscleGrid.jsx'
import { useApp } from '../store/AppContext.jsx'
import { muscleXPForLevel } from '../lib/xp.js'

// Derive from history: last-trained date per muscle, weekly XP per muscle, most-improved this week.
function deriveHistoryStats(history, weekStartISO) {
  const weekStart = new Date(weekStartISO || 0).getTime()
  const lastTrained = {}
  const weeklyGain = {}
  for (const h of history || []) {
    const ts = new Date(h.date).getTime()
    for (const [muscle, xp] of Object.entries(h.muscleGain || {})) {
      if (!lastTrained[muscle] || new Date(lastTrained[muscle]) < new Date(h.date)) {
        lastTrained[muscle] = h.date
      }
      if (ts >= weekStart) {
        weeklyGain[muscle] = (weeklyGain[muscle] || 0) + xp
      }
    }
  }
  let mostImproved = null
  for (const [muscle, xp] of Object.entries(weeklyGain)) {
    if (!mostImproved || xp > mostImproved.xp) mostImproved = { muscle, xp }
  }
  return { lastTrained, weeklyGain, mostImproved }
}

function totalMuscleXP(muscles) {
  let t = 0
  for (const m of muscles) {
    for (let i = 0; i < m.level; i++) t += muscleXPForLevel(i)
    t += m.xp
  }
  return t
}

export default function Body() {
  const { state } = useApp()
  const muscles = state.user.muscles
  const musclesByName = useMemo(
    () => Object.fromEntries(muscles.map(m => [m.name, m])),
    [muscles]
  )
  const { lastTrained, weeklyGain, mostImproved } = useMemo(
    () => deriveHistoryStats(state.history, state.user.weekStart),
    [state.history, state.user.weekStart]
  )

  // Recently-trained = anything trained in the last 48 hours.
  const recentMuscles = useMemo(() => {
    const cutoff = Date.now() - 48 * 3600 * 1000
    return new Set(
      Object.entries(lastTrained)
        .filter(([, iso]) => new Date(iso).getTime() >= cutoff)
        .map(([m]) => m)
    )
  }, [lastTrained])

  const bodyLevel = useMemo(() => {
    if (!muscles.length) return 0
    const sum = muscles.reduce((a, m) => a + m.level, 0)
    return Math.floor(sum / muscles.length)
  }, [muscles])

  const totalXP = useMemo(() => totalMuscleXP(muscles), [muscles])

  // Default selection: most improved this week → else first leveled muscle → else Chest.
  const [selectedName, setSelectedName] = useState(() =>
    mostImproved?.muscle
      ?? muscles.find(m => m.level > 0)?.name
      ?? muscles[0]?.name
  )

  // If most-improved appears later (after first workout of week), select it once.
  useEffect(() => {
    if (mostImproved?.muscle && !selectedName) setSelectedName(mostImproved.muscle)
  }, [mostImproved, selectedName])

  const selected = musclesByName[selectedName]

  return (
    <div>
      <Header title="Body Progress" />

      {/* Top stat row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <TopStat label="Body Level" value={bodyLevel}              accent="#7c5cff" />
        <TopStat label="Muscle XP"  value={totalXP.toLocaleString()} accent="#38e1b0" />
        <TopStat
          label="Top This Week"
          value={mostImproved ? mostImproved.muscle : '—'}
          sub={mostImproved ? `+${mostImproved.xp} XP` : 'No XP yet'}
          accent="#ffcc4d"
          small
        />
      </div>

      {/* Central body visual */}
      <div className="mb-4">
        <BodyMap
          musclesByName={musclesByName}
          selectedName={selectedName}
          onSelect={setSelectedName}
          recentMuscles={recentMuscles}
        />
      </div>

      {/* Selected muscle detail */}
      <div className="mb-4">
        <MuscleDetailPanel
          muscle={selected}
          lastTrained={lastTrained[selectedName]}
          weeklyGain={weeklyGain[selectedName] || 0}
          history={state.history}
        />
      </div>

      {/* All-muscle compact grid */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2 px-1">All Muscles</h2>
      <MuscleGrid
        muscles={muscles}
        selectedName={selectedName}
        onSelect={setSelectedName}
        recentMuscles={recentMuscles}
      />
    </div>
  )
}

function TopStat({ label, value, sub, accent = '#7c5cff', small = false }) {
  return (
    <div
      className="card p-3 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accent}18, transparent 80%)`, borderColor: `${accent}33` }}
    >
      <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">{label}</div>
      <div
        className={`font-extrabold leading-tight mt-0.5 ${small ? 'text-base' : 'text-2xl'}`}
        style={{ color: accent }}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>}
    </div>
  )
}
