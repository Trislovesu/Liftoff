import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'
import ExerciseThumb from '../components/ExerciseThumb.jsx'
import Header from '../components/Header.jsx'
import { xpForSet, WORKOUT_COMPLETION_BONUS, PUMP_PIC_BONUS, sanityCheckSet } from '../lib/xp.js'
import { lastTimeNudge } from '../lib/funnyRejects.js'
import { uploadImage, rpcSavePumpPhoto } from '../lib/supabase.js'
import { checkPhotoIsRecent } from '../lib/exifDate.js'

function buildInitial(workout) {
  return workout.exercises.map(ex => ({
    ...ex,
    sets: Array.from({ length: ex.sets || 1 }, () => ({
      reps: ex.reps || 0, weight: ex.weight || 0, completed: false
    }))
  }))
}

export default function WorkoutLogger() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const workout = state.workouts.find(w => w.id === id)
  const [logged, setLogged] = useState(() => (
    state.activeWorkout?.workoutId === id ? state.activeWorkout.logged : (workout ? buildInitial(workout) : [])
  ))
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState(null)

  useEffect(() => {
    if (!workout) return
    if (state.activeWorkout?.workoutId !== id) {
      actions.startActiveWorkout(id, buildInitial(workout))
    } else if (state.activeWorkout.background) {
      actions.patchActiveWorkout({ background: false })
    }
  }, [id, workout?.id])

  useEffect(() => {
    if (!state.activeWorkout?.startedAt || state.activeWorkout.workoutId !== id) return
    const update = () => setElapsed(Math.floor((Date.now() - state.activeWorkout.startedAt) / 1000))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [id, state.activeWorkout?.startedAt, state.activeWorkout?.workoutId])

  useEffect(() => {
    if (state.activeWorkout?.workoutId !== id) return
    actions.patchActiveWorkout({ logged })
  }, [logged, id])

  const liveXP = useMemo(() => {
    let xp = 0
    for (const ex of logged) for (const s of ex.sets)
      if (s.completed) xp += xpForSet({ reps: s.reps, weight: s.weight, isPR: false })
    return xp + WORKOUT_COMPLETION_BONUS
  }, [logged])

  const totalSets = logged.reduce((sum, ex) => sum + ex.sets.length, 0)
  const doneSets = logged.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const completion = totalSets ? doneSets / totalSets : 0

  if (!workout) {
    return (
      <div>
        <Header title="Workout" back="/workouts" />
        <div className="glass-card p-6 text-center text-white/50">Workout not found.</div>
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

  function attemptFinish() {
    const anyDone = logged.some(ex => ex.sets.some(s => s.completed))
    if (!anyDone) { alert('Mark at least one set as completed.'); return }
    const warnings = []
    for (const ex of logged)
      for (const s of ex.sets) if (s.completed) warnings.push(...sanityCheckSet({ reps: s.reps, weight: s.weight }))
    if (warnings.length > 0) {
      if (!confirm('Heads up:\n\n' + [...new Set(warnings)].slice(0, 3).join('\n') + '\n\nFinish anyway?')) return
    }
    setFinished({ xp: liveXP, pumpPicAdded: false })
  }

  function finalizeWorkout(pumpPicBonus) {
    actions.logWorkout({
      workoutId: workout.id,
      loggedExercises: logged,
      durationSec: elapsed,
      pumpPicBonus
    })
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="pb-24">
      <section className="mb-5 glass-card rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/workouts')} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-accent/50" aria-label="Back to routines">
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
          <div className="text-center min-w-0">
            <div className="text-4xl font-extrabold tracking-tight text-white tabular-nums">{mins}:{secs}</div>
            <div className="metric-label mt-1 truncate">{workout.name}</div>
          </div>
          <button onClick={attemptFinish} className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shadow-[0_0_18px_rgba(255,0,51,0.34)]" aria-label="Finish workout">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-white/45 mb-2">
            <span>{doneSets}/{totalSets} sets complete</span>
            <span className="font-bold text-accent">+{liveXP} XP</span>
          </div>
          <div className="h-2 w-full bg-bg-950 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-accent shadow-[0_0_12px_rgba(255,0,51,0.55)]"
              initial={false}
              animate={{ width: `${Math.max(6, completion * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {logged.map((ex, i) => {
          const pbKey = ex.libraryId || ex.name
          const last = state.user.lastSessions?.[pbKey]
          const nudge = last ? lastTimeNudge(last.weight, last.reps) : null
          const prevText = last ? `${last.weight || 0} x ${last.reps || 0}` : '-'
          return (
            <section key={ex.id} className="glass-card rounded-3xl overflow-hidden hover:border-accent/35 transition">
              <div className="p-4 flex items-center gap-3 border-b border-white/10 bg-bg-950/20">
                <ExerciseThumb exercise={ex} size="md" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-extrabold truncate">{ex.name}</h2>
                  <div className="flex gap-1.5 mt-1 overflow-hidden">
                    <span className="chip shrink-0">{ex.primaryMuscle}</span>
                    {ex.secondaryMuscles?.slice(0, 1).map(m => <span key={m} className="chip shrink-0 text-white/45">{m}</span>)}
                  </div>
                </div>
                {ex.libraryId && (
                  <Link to={`/exercise/${ex.libraryId}`} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-accent/50" aria-label={`About ${ex.name}`}>
                    <span className="material-symbols-outlined text-lg">info</span>
                  </Link>
                )}
              </div>

              {nudge && (
                <div className="mx-4 mt-4 text-xs text-white/55 border border-white/10 bg-bg-950/45 rounded-2xl px-3 py-2">
                  {nudge} Try a touch more if it feels clean.
                </div>
              )}

              <div className="px-4 pt-4 grid grid-cols-12 gap-2 metric-label">
                <div className="col-span-2">Set</div>
                <div className="col-span-3">Prev</div>
                <div className="col-span-3 text-center">Lbs</div>
                <div className="col-span-3 text-center">Reps</div>
                <div className="col-span-1 text-right">Done</div>
              </div>

              <div className="px-4 pb-4 pt-2 space-y-2">
                {ex.sets.map((s, j) => {
                  const active = !s.completed && ex.sets.slice(0, j).every(prev => prev.completed)
                  return (
                    <div key={j} className={`grid grid-cols-12 gap-2 items-center rounded-2xl border px-2 py-2.5 transition-all ${
                      s.completed ? 'bg-accent/15 border-accent/35 shadow-[inset_3px_0_0_rgba(255,0,51,0.9)]' : active ? 'bg-bg-700/45 border-accent/25 kinetic-glow' : 'bg-bg-950/45 border-white/5'
                    }`}>
                      <div className={`col-span-2 h-11 rounded-xl flex items-center justify-center font-extrabold ${s.completed ? 'text-accent' : 'text-white/70 bg-white/5'}`}>
                        {j + 1}
                      </div>
                      <div className="col-span-3 text-sm text-white/55 truncate">{prevText}</div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={s.weight === 0 ? '' : s.weight}
                        onChange={e => updateSet(i, j, { weight: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                        placeholder="0"
                        className="col-span-3 h-11 w-full bg-bg-950 border border-white/10 focus:border-accent focus:outline-none text-white text-center font-extrabold text-lg px-1 rounded-xl"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={s.reps === 0 ? '' : s.reps}
                        onChange={e => updateSet(i, j, { reps: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                        placeholder="0"
                        className="col-span-3 h-11 w-full bg-bg-950 border border-white/10 focus:border-accent focus:outline-none text-white text-center font-extrabold text-lg px-1 rounded-xl"
                      />
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => updateSet(i, j, { completed: !s.completed })}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${
                            s.completed ? 'bg-accent border-accent text-white shadow-[0_0_14px_rgba(255,0,51,0.34)]' : 'bg-white/5 border-white/15 text-white/55 hover:border-accent hover:text-accent'
                          }`}
                          aria-label={s.completed ? 'Mark set incomplete' : 'Mark set complete'}
                        >
                          <span className="material-symbols-outlined text-[22px]">check</span>
                        </button>
                      </div>
                      {ex.sets.length > 1 && (
                        <button onClick={() => removeSet(i, j)} className="col-span-12 text-left metric-label text-white/25 hover:text-danger px-1">Remove set</button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="px-4 pb-4">
                <button onClick={() => addSet(i)} className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl metric-label hover:bg-accent/10 hover:text-accent hover:border-accent/45 transition flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add set
                </button>
              </div>
            </section>
          )
        })}
      </div>

      <div className="fixed bottom-20 left-0 w-full px-5 z-40">
        <div className="max-w-md mx-auto">
          <button onClick={attemptFinish} className="w-full h-14 bg-accent text-white font-extrabold rounded-xl shadow-[0_0_30px_rgba(255,0,51,0.4)] active:scale-95 transition flex items-center justify-center gap-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            Finish Workout
          </button>
        </div>
      </div>

      <AnimatePresence>
        {finished && (
          <FinishModal
            baseXP={finished.xp}
            onFinish={(picBonus) => { finalizeWorkout(picBonus); navigate('/') }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function FinishModal({ baseXP, onFinish }) {
  const { state } = useApp()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [pumpAdded, setPumpAdded] = useState(false)
  const fileRef = useRef(null)

  async function onPickFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    e.target.value = ''
    setBusy(true); setMsg('')
    try {
      const check = await checkPhotoIsRecent(f)
      if (!check.ok) { setMsg(check.reason); return }
      const url = await uploadImage(f, 'pumps', state.user.username)
      await rpcSavePumpPhoto(
        state.session.username, state.session.pin_hash,
        { image_url: url, taken_at: new Date(check.ts).toISOString(), caption: null, xp_bonus: PUMP_PIC_BONUS }
      )
      setPumpAdded(true)
    } catch (e) { setMsg(e.message || 'Upload failed') }
    finally { setBusy(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <motion.div initial={{ y: 30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="glass-card p-6 text-center w-full max-w-sm relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mx-auto mb-3 flex items-center justify-center">
          <span className="material-symbols-outlined text-accent text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
        </div>
        <div className="text-xl font-extrabold mb-1">Workout Complete</div>
        <div className="text-white/60 text-sm mb-3">You earned</div>
        <div className="text-5xl font-extrabold text-accent mb-1">+{baseXP + (pumpAdded ? PUMP_PIC_BONUS : 0)}</div>
        <div className="metric-label mb-5">XP added to your profile</div>

        {!pumpAdded ? (
          <>
            <div className="text-sm text-white/70 mb-2 font-bold">Take a pump pic for +{PUMP_PIC_BONUS} XP</div>
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary w-full mb-2">
              {busy ? 'Checking...' : 'Take/Upload Photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickFile} />
            {msg && <div className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 mb-2">{msg}</div>}
            <button onClick={() => onFinish(false)} className="btn-ghost w-full text-sm">Skip</button>
          </>
        ) : (
          <>
            <div className="text-sm text-accent font-bold mb-3">Pump pic saved to gallery</div>
            <button onClick={() => onFinish(true)} className="btn-primary w-full">Back to Dashboard</button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
