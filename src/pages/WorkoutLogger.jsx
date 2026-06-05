import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'
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
    for (const ex of logged) for (const s of ex.sets)
      if (s.completed) xp += xpForSet({ reps: s.reps, weight: s.weight, isPR: false })
    return xp + WORKOUT_COMPLETION_BONUS
  }, [logged])

  const totalSets = logged.reduce((sum, ex) => sum + ex.sets.length, 0)
  const doneSets = logged.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const completion = totalSets ? doneSets / totalSets : 0

  if (!workout) {
    return (
      <div><Header title="Workout" back="/workouts" />
        <div className="glass-card p-6 text-center text-white/50">Workout not found.</div></div>
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
      <section className="mb-8">
        <div className="flex justify-between items-end mb-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-accent uppercase tracking-tight truncate">{workout.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="metric-label">Active session</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,0,51,0.35)]">{mins}:{secs}</div>
            <span className="metric-label">Elapsed</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-bg-700/40 rounded-full overflow-hidden">
          <div className="h-full bg-accent shadow-[0_0_10px_rgba(255,0,51,0.6)]" style={{ width: `${Math.max(8, completion * 100)}%` }} />
        </div>
        <div className="flex justify-between mt-2 metric-label">
          <span>{doneSets}/{totalSets} sets</span>
          <span>+{liveXP} XP</span>
        </div>
      </section>

      <div className="space-y-4">
        {logged.map((ex, i) => {
          const pbKey = ex.libraryId || ex.name
          const last = state.user.lastSessions?.[pbKey]
          const nudge = last ? lastTimeNudge(last.weight, last.reps) : null
          return (
            <div key={ex.id} className="glass-card rounded-3xl p-4 relative overflow-hidden hover:border-accent/40 transition">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold truncate">{ex.name}</h2>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-bg-600 rounded metric-label">{ex.primaryMuscle}</span>
                    {ex.secondaryMuscles?.slice(0, 1).map(m => <span key={m} className="px-2 py-0.5 bg-bg-600 rounded metric-label">{m}</span>)}
                  </div>
                </div>
                {ex.libraryId && (
                  <Link to={`/exercise/${ex.libraryId}`} className="text-white/45 hover:text-accent transition">
                    <span className="material-symbols-outlined">more_vert</span>
                  </Link>
                )}
              </div>

              {nudge && (
                <div className="text-[11px] text-white/45 mb-3 border border-white/10 bg-bg-950/40 rounded-lg px-3 py-2">
                  {nudge} Try a touch more.
                </div>
              )}

              <div className="grid grid-cols-12 gap-2 mb-2 metric-label px-2">
                <div className="col-span-2">Set</div>
                <div className="col-span-4">Lbs</div>
                <div className="col-span-4">Reps</div>
                <div className="col-span-2 text-right">Done</div>
              </div>

              <div className="space-y-2">
                {ex.sets.map((s, j) => {
                  const active = !s.completed && ex.sets.slice(0, j).every(prev => prev.completed)
                  return (
                    <div key={j} className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border transition-all ${
                      s.completed ? 'bg-bg-950/50 border-transparent' : active ? 'bg-bg-700/40 border-accent/30 kinetic-glow' : 'bg-bg-950/40 border-transparent'
                    }`}>
                      <div className={`col-span-2 font-semibold ${active ? 'text-accent' : 'text-white/70'}`}>{j + 1}</div>
                      <input type="text" inputMode="numeric" value={s.weight === 0 ? '' : s.weight}
                        onChange={e => updateSet(i, j, { weight: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                        placeholder="0"
                        className="col-span-4 w-full bg-bg-950 border border-white/10 focus:border-accent focus:outline-none text-white font-extrabold text-lg px-2 py-1.5 rounded-xl" />
                      <input type="text" inputMode="numeric" value={s.reps === 0 ? '' : s.reps}
                        onChange={e => updateSet(i, j, { reps: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                        placeholder="0"
                        className="col-span-4 w-full bg-bg-950 border border-white/10 focus:border-accent focus:outline-none text-white font-extrabold text-lg px-2 py-1.5 rounded-xl" />
                      <div className="col-span-2 flex justify-end">
                        <button onClick={() => updateSet(i, j, { completed: !s.completed })}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border transition ${
                            s.completed ? 'bg-accent border-accent text-white shadow-[0_0_10px_rgba(255,0,51,0.35)]' : 'border-white/20 text-white/45 hover:border-accent hover:text-accent'
                          }`}>
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                      </div>
                      {ex.sets.length > 1 && (
                        <button onClick={() => removeSet(i, j)} className="col-span-12 text-left metric-label text-white/25 hover:text-danger px-1">Remove set</button>
                      )}
                    </div>
                  )
                })}
              </div>

              <button onClick={() => addSet(i)} className="w-full mt-4 py-3 border border-dashed border-white/10 rounded-2xl metric-label hover:bg-bg-700/50 hover:text-accent hover:border-accent/50 transition flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Add set
              </button>
            </div>
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
