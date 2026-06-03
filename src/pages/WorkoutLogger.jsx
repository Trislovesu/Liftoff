import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import { xpForSet, workoutStreakBonus } from '../lib/xp.js'

function buildInitial(workout) {
  return workout.exercises.map(ex => ({
    ...ex,
    sets: Array.from({ length: ex.sets || 1 }, () => ({
      reps: ex.reps || 0,
      weight: ex.weight || 0,
      completed: false
    }))
  }))
}

export default function WorkoutLogger() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const workout = state.workouts.find(w => w.id === id)
  const [logged, setLogged] = useState(() => workout ? buildInitial(workout) : [])
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState(null)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const liveXP = useMemo(() => {
    let xp = 0
    for (const ex of logged)
      for (const s of ex.sets)
        if (s.completed) xp += xpForSet({ reps: s.reps, weight: s.weight, isPR: false })
    return xp + workoutStreakBonus(state.user.streak)
  }, [logged, state.user.streak])

  if (!workout) {
    return (
      <div>
        <Header title="Workout" back="/workouts" />
        <div className="card p-6 text-center text-white/50">Workout not found.</div>
      </div>
    )
  }

  function updateSet(exIdx, setIdx, patch) {
    setLogged(ls => ls.map((ex, i) => {
      if (i !== exIdx) return ex
      return { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, ...patch } : s) }
    }))
  }

  function addSet(exIdx) {
    setLogged(ls => ls.map((ex, i) => {
      if (i !== exIdx) return ex
      const last = ex.sets[ex.sets.length - 1] ?? { reps: ex.reps, weight: ex.weight }
      return { ...ex, sets: [...ex.sets, { reps: last.reps, weight: last.weight, completed: false }] }
    }))
  }

  function removeSet(exIdx, setIdx) {
    setLogged(ls => ls.map((ex, i) => {
      if (i !== exIdx) return ex
      return { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
    }))
  }

  function finish() {
    const anyDone = logged.some(ex => ex.sets.some(s => s.completed))
    if (!anyDone) { alert('Mark at least one set as completed.'); return }
    actions.logWorkout({
      workoutId: workout.id,
      loggedExercises: logged,
      durationSec: elapsed
    })
    // capture summary from updated history shortly after
    setFinished({ xp: liveXP })
  }

  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')

  return (
    <div>
      <Header
        title={workout.name}
        back="/workouts"
        right={
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Live XP</div>
            <div className="text-lg font-extrabold text-xp leading-none">+{liveXP}</div>
          </div>
        }
      />

      <div className="card-grad p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>⏱</span>
          <span>{mins}:{secs}</span>
        </div>
        <div className="text-xs text-white/50">Streak bonus: +{workoutStreakBonus(state.user.streak)}</div>
      </div>

      <div className="space-y-3">
        {logged.map((ex, i) => (
          <div key={ex.id} className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0">
                <div className="font-bold truncate">{ex.name}</div>
                <div className="text-xs text-white/40">{ex.primaryMuscle}</div>
              </div>
              {ex.libraryId && (
                <Link to={`/exercise/${ex.libraryId}`} className="btn-ghost text-xs">About</Link>
              )}
            </div>

            <div className="grid grid-cols-[28px_1fr_1fr_36px_36px] gap-2 text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-1 px-1">
              <div>Set</div>
              <div>Weight</div>
              <div>Reps</div>
              <div className="text-center">✓</div>
              <div></div>
            </div>

            <div className="space-y-1.5">
              {ex.sets.map((s, j) => (
                <div key={j} className={`grid grid-cols-[28px_1fr_1fr_36px_36px] gap-2 items-center rounded-xl px-1 py-1 ${s.completed ? 'bg-xp/10' : ''}`}>
                  <div className="text-center font-bold text-white/60">{j + 1}</div>
                  <input
                    type="number" min="0" value={s.weight}
                    onChange={e => updateSet(i, j, { weight: Number(e.target.value) })}
                    className="input py-1.5"
                  />
                  <input
                    type="number" min="0" value={s.reps}
                    onChange={e => updateSet(i, j, { reps: Number(e.target.value) })}
                    className="input py-1.5"
                  />
                  <button
                    onClick={() => updateSet(i, j, { completed: !s.completed })}
                    className={`w-8 h-8 rounded-lg border ${s.completed ? 'bg-xp text-bg-900 border-xp' : 'border-white/15 text-white/40'}`}
                  >✓</button>
                  <button
                    onClick={() => removeSet(i, j)}
                    className="text-white/30 hover:text-danger text-sm"
                  >✕</button>
                </div>
              ))}
            </div>

            <button onClick={() => addSet(i)} className="btn-ghost w-full mt-2 text-xs">＋ Add set</button>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <button onClick={finish} className="btn-primary w-full text-base py-3 shadow-glow">
          🎯 Finish Workout (+{liveXP} XP)
        </button>
      </div>

      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="card-grad p-6 text-center w-full max-w-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-hero-grad opacity-50 pointer-events-none" />
              <div className="text-5xl mb-2">🏆</div>
              <div className="text-xl font-extrabold mb-1">Workout Complete!</div>
              <div className="text-white/60 text-sm mb-4">Great session. You earned</div>
              <div className="text-5xl font-extrabold text-xp mb-1">+{finished.xp}</div>
              <div className="text-xs text-white/40 mb-5">XP added to your profile</div>
              <button
                onClick={() => navigate('/')}
                className="btn-primary w-full"
              >Back to Dashboard</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
