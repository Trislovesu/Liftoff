import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'

export default function ActiveWorkoutLayer() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const active = state.activeWorkout
  const workout = state.workouts.find(w => w.id === active?.workoutId)
  const [pendingPath, setPendingPath] = useState(null)
  const [tick, setTick] = useState(0)

  const loggerPath = active ? `/workouts/${active.workoutId}/log` : ''
  const onLogger = active && location.pathname === loggerPath
  const shouldGuard = active && onLogger && !active.background && !active.leavePrompted

  const progress = useMemo(() => {
    const logged = active?.logged || []
    const total = logged.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0)
    const done = logged.reduce((sum, ex) => sum + (ex.sets || []).filter(s => s.completed).length, 0)
    return { total, done, pct: total ? done / total : 0 }
  }, [active?.logged])

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(timer)
  }, [active])

  useEffect(() => {
    if (!shouldGuard) return
    const onBeforeUnload = event => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [shouldGuard])

  useEffect(() => {
    if (!shouldGuard) return
    const onClick = event => {
      const anchor = event.target.closest?.('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      const hashPath = href.includes('#') ? href.split('#')[1] : href
      const path = hashPath.startsWith('/') ? hashPath : `/${hashPath.replace(/^#?\/?/, '')}`
      if (path === location.pathname) return
      event.preventDefault()
      event.stopPropagation()
      setPendingPath(path)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [shouldGuard, location.pathname])

  if (!active || !workout) return null

  const elapsed = Math.floor((Date.now() - active.startedAt) / 1000)
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')

  function backgroundWorkout() {
    actions.patchActiveWorkout({ background: true, leavePrompted: true })
    const next = pendingPath
    setPendingPath(null)
    if (next) navigate(next)
  }

  function endWorkout() {
    actions.endActiveWorkout()
    const next = pendingPath
    setPendingPath(null)
    if (next) navigate(next)
  }

  return (
    <>
      {active.background && !onLogger && (
        <button
          onClick={() => navigate(loggerPath)}
          className="fixed top-14 inset-x-0 z-40 px-4"
        >
          <div className="max-w-md mx-auto bg-bg-950/95 border border-accent/35 rounded-b-3xl px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.55),0_0_18px_rgba(255,0,51,0.16)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0 text-left">
                <div className="metric-label text-accent">Workout running</div>
                <div className="font-extrabold truncate">{workout.name}</div>
              </div>
              <div className="font-extrabold text-xl tabular-nums">{mins}:{secs}</div>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(255,0,51,0.55)]" style={{ width: `${Math.max(8, progress.pct * 100)}%` }} />
            </div>
            <div className="metric-label mt-1 text-right">{progress.done}/{progress.total} sets</div>
          </div>
        </button>
      )}

      {pendingPath && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm px-4 flex items-center justify-center">
          <div className="max-w-sm w-full bg-bg-950 border border-accent/35 rounded-3xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/35 flex items-center justify-center text-accent mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Workout in progress</h2>
            <p className="text-sm text-white/55 leading-relaxed mb-5">Do you want to end this workout or let it keep running in the background?</p>
            <div className="space-y-2">
              <button onClick={backgroundWorkout} className="btn-primary w-full justify-center">Run in background</button>
              <button onClick={endWorkout} className="btn-ghost w-full justify-center text-danger">End workout</button>
              <button onClick={() => setPendingPath(null)} className="w-full py-2 text-sm text-white/45 hover:text-white">Stay here</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
