import { useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useApp, cid } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary.js'
import { MUSCLE_GROUPS } from '../data/muscles.js'

function emptyExercise() {
  return {
    id: cid(),
    libraryId: null,
    name: '',
    primaryMuscle: 'Chest',
    secondaryMuscles: [],
    sets: 3,
    reps: 10,
    weight: 0,
    notes: ''
  }
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

  function toggleTarget(m) {
    setTargetMuscles(t => t.includes(m) ? t.filter(x => x !== m) : [...t, m])
  }

  function addFromLibrary(lib) {
    setExercises(es => [...es, {
      id: cid(),
      libraryId: lib.id,
      name: lib.name,
      primaryMuscle: lib.primaryMuscle,
      secondaryMuscles: lib.secondaryMuscles,
      sets: 3, reps: 10, weight: 0, notes: ''
    }])
    setPicker(false)
  }

  function addCustom() {
    setExercises(es => [...es, emptyExercise()])
  }

  function update(idx, patch) {
    setExercises(es => es.map((e, i) => i === idx ? { ...e, ...patch } : e))
  }

  function remove(idx) {
    setExercises(es => es.filter((_, i) => i !== idx))
  }

  function save() {
    if (!name.trim()) { alert('Give your workout a name'); return }
    if (exercises.length === 0) { alert('Add at least one exercise'); return }
    const workout = {
      id: existing?.id ?? cid(),
      name: name.trim(),
      targetMuscles,
      exercises
    }
    actions.saveWorkout(workout)
    navigate('/workouts')
  }

  return (
    <div>
      <Header
        title={existing ? 'Edit Workout' : 'New Workout'}
        back="/workouts"
        right={<button onClick={save} className="btn-primary">Save</button>}
      />

      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <div>
            <div className="label mb-1">Workout name</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Push Day"
              className="input w-full"
            />
          </div>
          <div>
            <div className="label mb-1.5">Target muscles</div>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleTarget(m)}
                  className={`chip ${targetMuscles.includes(m) ? 'bg-accent/20 border-accent/50 text-accent' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Exercises</h2>
          <div className="flex gap-2">
            <button onClick={() => setPicker(true)} className="btn-ghost text-xs">＋ From library</button>
            <button onClick={addCustom} className="btn-ghost text-xs">＋ Custom</button>
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="card p-6 text-center text-white/50 text-sm">
            No exercises yet. Add one from the library or create a custom one.
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div key={ex.id} className="card p-3">
                <div className="flex items-start gap-2 mb-2">
                  <input
                    value={ex.name}
                    onChange={e => update(idx, { name: e.target.value })}
                    placeholder="Exercise name"
                    className="input flex-1 font-semibold"
                  />
                  {ex.libraryId && (
                    <Link to={`/exercise/${ex.libraryId}`} className="btn-ghost text-xs">About</Link>
                  )}
                  <button onClick={() => remove(idx)} className="btn-ghost text-danger text-xs">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={ex.primaryMuscle}
                    onChange={e => update(idx, { primaryMuscle: e.target.value })}
                    className="input"
                  >
                    {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input
                    value={ex.notes ?? ''}
                    onChange={e => update(idx, { notes: e.target.value })}
                    placeholder="Notes (optional)"
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberField label="Sets"   value={ex.sets}   onChange={v => update(idx, { sets: v })} />
                  <NumberField label="Reps"   value={ex.reps}   onChange={v => update(idx, { reps: v })} />
                  <NumberField label="Weight" value={ex.weight} onChange={v => update(idx, { weight: v })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {picker && <LibraryPicker onPick={addFromLibrary} onClose={() => setPicker(false)} />}
    </div>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="label mb-1">{label}</div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input w-full"
      />
    </label>
  )
}

function LibraryPicker({ onPick, onClose }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return EXERCISE_LIBRARY
    return EXERCISE_LIBRARY.filter(e =>
      e.name.toLowerCase().includes(s) || e.primaryMuscle.toLowerCase().includes(s)
    )
  }, [q])
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="bg-bg-800 border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-3 border-b border-white/5 flex gap-2">
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search exercises..."
            className="input flex-1"
          />
          <button onClick={onClose} className="btn-ghost">Close</button>
        </div>
        <div className="overflow-y-auto p-2 space-y-1.5">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="w-full text-left card p-3 flex items-center gap-3 hover:bg-white/5"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center text-accent">🏋️</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{ex.name}</div>
                <div className="text-xs text-white/40">{ex.primaryMuscle}</div>
              </div>
              <span className="text-white/30">＋</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
