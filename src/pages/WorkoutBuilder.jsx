import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useApp, cid } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary.js'
import { MUSCLE_GROUPS } from '../data/muscles.js'
import { getCachedExerciseMedia, warmExerciseMediaCache } from '../lib/exerciseMedia.js'

const CATEGORY_FILTERS = ['All', 'Strength', 'Hypertrophy', 'Endurance', 'Quick']

const MUSCLE_ICONS = {
  Chest: 'accessibility_new',
  Back: 'person_pin',
  Shoulders: 'sports_kabaddi',
  Biceps: 'fitness_center',
  Triceps: 'fitness_center',
  Forearms: 'front_hand',
  Abs: 'center_focus_strong',
  Quads: 'directions_walk',
  Hamstrings: 'directions_run',
  Glutes: 'airline_seat_recline_extra',
  Calves: 'footprint'
}

export default function WorkoutBuilder() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const existing = id ? state.workouts.find(w => w.id === id) : null

  const [name, setName] = useState(existing?.name ?? '')
  const [targetMuscles, setTargetMuscles] = useState(existing?.targetMuscles ?? [])
  const [exercises, setExercises] = useState(existing?.exercises ?? [])
  const [picker, setPicker] = useState(false)
  const [flow, setFlow] = useState(existing ? 'editor' : 'home')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('All')

  function toggleTarget(m) {
    setTargetMuscles(t => {
      if (t.includes(m)) return t.filter(x => x !== m)
      if (t.length >= 3) return t
      return [...t, m]
    })
  }

  function addFromLibrary(lib) {
    setExercises(es => es.some(e => e.libraryId === lib.id) ? es : [...es, {
      id: cid(), libraryId: lib.id, name: lib.name,
      primaryMuscle: lib.primaryMuscle, secondaryMuscles: lib.secondaryMuscles,
      sets: 3, reps: 10, weight: 0, notes: ''
    }])
    setFlow('editor')
    setPicker(false)
    if (!name.trim() && targetMuscles.length) setName(`${targetMuscles.slice(0, 2).join(' + ')} Day`)
  }

  function update(idx, patch) { setExercises(es => es.map((e, i) => i === idx ? { ...e, ...patch } : e)) }
  function remove(idx) { setExercises(es => es.filter((_, i) => i !== idx)) }

  function save() {
    if (!name.trim()) { alert('Give your workout a name'); return }
    if (exercises.length === 0) { alert('Add at least one exercise'); return }
    const workout = { id: existing?.id ?? cid(), name: name.trim(), targetMuscles, exercises }
    actions.saveWorkout(workout)
    navigate('/workouts')
  }

  if (!existing && flow === 'home') {
    return (
      <RoutineLibraryHome
        workouts={state.workouts}
        q={q}
        setQ={setQ}
        filter={filter}
        setFilter={setFilter}
        onCreate={() => { setName(''); setTargetMuscles([]); setExercises([]); setFlow('muscles') }}
      />
    )
  }

  if (!existing && flow === 'muscles') {
    return (
      <MuscleSelection
        selected={targetMuscles}
        onToggle={toggleTarget}
        onBack={() => setFlow('home')}
        onNext={() => setFlow('library')}
      />
    )
  }

  if (!existing && flow === 'library') {
    return (
      <FullLibrary
        targetMuscles={targetMuscles}
        selected={exercises}
        onPick={addFromLibrary}
        onBack={() => setFlow('muscles')}
        onDone={() => setFlow('editor')}
      />
    )
  }

  return (
    <div>
      <Header title={existing ? 'Edit Routine' : 'Custom Routine'} back="/workouts"
        right={<button onClick={save} className="btn-primary">Save</button>} />

      <div className="space-y-4">
        <div className="glass-card p-4 space-y-3">
          <div>
            <div className="label mb-1">Routine name</div>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Push Day" className="input w-full" />
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Exercises</h2>
          <button onClick={() => setPicker(true)} className="btn-ghost text-xs">+ Add from library</button>
        </div>

        {exercises.length === 0 ? (
          <div className="glass-card p-8 text-center text-white/50 text-sm">
            No exercises yet. Tap "Add from library" to pick some.
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div key={ex.id} className="glass-card p-3">
                <div className="flex items-start gap-2 mb-3">
                  <ExerciseThumb exercise={ex} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{ex.name}</div>
                  </div>
                  {ex.libraryId && <Link to={`/exercise/${ex.libraryId}`} className="btn-ghost text-xs">About</Link>}
                  <button onClick={() => remove(idx)} className="btn-ghost text-danger text-xs">×</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberField label="Sets" value={ex.sets} onChange={v => update(idx, { sets: v })} />
                  <NumberField label="Reps" value={ex.reps} onChange={v => update(idx, { reps: v })} />
                  <NumberField label="Weight" value={ex.weight} onChange={v => update(idx, { weight: v })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {picker && <LibraryPicker
        targetMuscles={targetMuscles}
        onPick={addFromLibrary}
        onClose={() => setPicker(false)} />}
    </div>
  )
}

function RoutineLibraryHome({ workouts, q, setQ, filter, setFilter, onCreate }) {
  const shown = workouts.filter(w => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    return w.name.toLowerCase().includes(s) || (w.targetMuscles ?? []).some(m => m.toLowerCase().includes(s))
  })

  return (
    <div>
      <section className="mb-6">
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            className="input w-full py-4 pl-12"
            placeholder="Search workout, plan, or muscle group..."
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {CATEGORY_FILTERS.map(item => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                filter === item ? 'bg-accent text-white border-accent' : 'bg-bg-800 border-white/10 text-white/55'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h1 className="text-2xl font-extrabold tracking-tight">Your Routines</h1>
        </div>
        {shown.length === 0 ? (
          <div className="glass-card p-6 text-center text-white/45 text-sm">No routines yet.</div>
        ) : (
          <div className="space-y-3">
            {shown.map(w => (
              <Link key={w.id} to={`/workouts/${w.id}/edit`} className="glass-card p-5 block border-l-2 border-accent hover:bg-bg-700/30 transition">
                <div className="flex justify-between items-start mb-4 gap-3">
                  <h2 className="font-bold text-lg truncate">{w.name}</h2>
                  <span className="text-xs text-white/40 shrink-0">{w.exercises.length} exercises</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(w.targetMuscles ?? []).slice(0, 3).map(m => <span key={m} className="px-3 py-1 rounded bg-bg-600 text-[10px] uppercase tracking-wider font-bold">{m}</span>)}
                </div>
                <div className="flex items-center gap-6 text-white/45 text-sm">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">timer</span>45 min</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">fitness_center</span>{w.exercises.length} moves</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <button onClick={onCreate} className="w-full mt-6 bg-accent text-white font-extrabold py-4 rounded-full kinetic-glow active:scale-[0.98] transition flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Create New Routine
        </button>
      </section>
    </div>
  )
}

function MuscleSelection({ selected, onToggle, onBack, onNext }) {
  return (
    <div>
      <Header title="Select Muscle Groups" back="/workouts" right={<button onClick={onBack} className="btn-ghost text-xs">Back</button>} />
      <div className="mb-5">
        <p className="text-white/45 text-sm">Choose up to 3. The library will organize exercises around your focus.</p>
        <div className="metric-label mt-2">{selected.length}/3 selected</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MUSCLE_GROUPS.map(m => {
          const active = selected.includes(m)
          return (
            <button
              key={m}
              onClick={() => onToggle(m)}
              className={`relative bg-bg-800 border rounded-2xl p-5 flex flex-col items-center gap-3 transition ${
                active ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-accent/40'
              }`}
            >
              {active && <span className="material-symbols-outlined absolute top-2 right-2 text-accent text-xl">check_circle</span>}
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-bg-700 text-white/60">
                <span className="material-symbols-outlined">{MUSCLE_ICONS[m] || 'fitness_center'}</span>
              </div>
              <span className="text-sm font-bold">{m}</span>
            </button>
          )
        })}
      </div>
      <button onClick={onNext} disabled={selected.length === 0} className="btn-primary w-full justify-center mt-6 disabled:opacity-40">
        Next
      </button>
    </div>
  )
}

function FullLibrary({ targetMuscles, selected, onPick, onBack, onDone }) {
  return (
    <div>
      <Header title="Workout Library" back="/workouts" right={<button onClick={onBack} className="btn-ghost text-xs">Back</button>} />
      <LibraryContent targetMuscles={targetMuscles} selected={selected} onPick={onPick} />
      <button onClick={onDone} disabled={selected.length === 0} className="btn-primary w-full justify-center mt-5 disabled:opacity-40">
        Build Routine ({selected.length})
      </button>
    </div>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="label mb-1">{label}</div>
      <input type="number" min="0" value={value}
        onChange={e => onChange(Number(e.target.value))} className="input w-full" />
    </label>
  )
}

function LibraryPicker({ targetMuscles, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="glass-card w-full max-w-md max-h-[84vh] flex flex-col">
        <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-extrabold">Workout Library</div>
            <div className="text-xs text-white/40">Pick exercises for this routine</div>
          </div>
          <button onClick={onClose} className="btn-ghost">Close</button>
        </div>
        <div className="overflow-y-auto p-3">
          <LibraryContent targetMuscles={targetMuscles} selected={[]} onPick={onPick} />
        </div>
      </div>
    </div>
  )
}

function LibraryContent({ targetMuscles, selected, onPick }) {
  const [q, setQ] = useState('')
  const [mediaReady, setMediaReady] = useState(false)
  const targets = useMemo(() => new Set(targetMuscles || []), [targetMuscles])

  useEffect(() => {
    warmExerciseMediaCache(EXERCISE_LIBRARY).finally(() => setMediaReady(true))
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    let list = EXERCISE_LIBRARY
    if (s) {
      list = list.filter(e =>
        e.name.toLowerCase().includes(s) ||
        e.primaryMuscle.toLowerCase().includes(s) ||
        e.secondaryMuscles?.some(m => m.toLowerCase().includes(s))
      )
    }
    return list
      .map(e => {
        let score = 0
        if (targets.has(e.primaryMuscle)) score += 2
        for (const m of e.secondaryMuscles || []) if (targets.has(m)) score += 1
        return { e, score }
      })
      .sort((a, b) => b.score - a.score || a.e.primaryMuscle.localeCompare(b.e.primaryMuscle) || a.e.name.localeCompare(b.e.name))
  }, [q, targets])

  const grouped = filtered.reduce((acc, item) => {
    const key = item.e.primaryMuscle
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div>
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
        <input value={q} onChange={e => setQ(e.target.value)} className="input w-full py-3 pl-12" placeholder="Search exercises..." />
      </div>
      {targetMuscles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {targetMuscles.map(m => <span key={m} className="px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] uppercase tracking-wider font-bold">{m}</span>)}
        </div>
      )}
      <div className="space-y-5">
        {Object.entries(grouped).map(([muscle, items]) => (
          <section key={muscle}>
            <h3 className="metric-label mb-2 text-white/60">{muscle}</h3>
            <div className="space-y-2">
              {items.map(({ e, score }) => {
                const isSelected = selected.some(x => x.libraryId === e.id)
                return (
                  <button key={e.id} onClick={() => onPick(e)}
                    className={`w-full text-left glass-card p-3 flex items-center gap-3 hover:border-accent/40 transition ${isSelected ? 'border-accent/50' : ''}`}>
                    <ExerciseThumb exercise={e} mediaReady={mediaReady} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{e.name}</div>
                      <div className="text-xs text-white/40 truncate">
                        {e.secondaryMuscles?.length ? e.secondaryMuscles.join(', ') : 'Primary focus'}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${score > 0 || isSelected ? 'bg-accent/15 text-accent' : 'bg-white/5 text-white/40'}`}>
                      <span className="material-symbols-outlined text-lg">{isSelected ? 'check' : 'add'}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function ExerciseThumb({ exercise }) {
  const media = getCachedExerciseMedia(exercise.name)
  if (media?.gifUrl) {
    return <img src={media.gifUrl} alt="" className="w-14 h-14 rounded-2xl object-cover bg-white" loading="lazy" />
  }
  return (
    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0">
      <div className="relative w-8 h-10">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3 h-3 rounded-full bg-bg-800" />
        <div className="absolute left-1/2 -translate-x-1/2 top-3 w-2 h-5 rounded-full bg-bg-800" />
        <div className="absolute left-0 top-5 w-8 h-1.5 rounded-full bg-accent rotate-12" />
        <div className="absolute left-1 top-8 w-3 h-1.5 rounded-full bg-bg-800 rotate-[55deg]" />
        <div className="absolute right-1 top-8 w-3 h-1.5 rounded-full bg-bg-800 -rotate-[55deg]" />
      </div>
    </div>
  )
}
