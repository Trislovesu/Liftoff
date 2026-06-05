import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import ExerciseThumb from '../components/ExerciseThumb.jsx'

export default function Workouts() {
  const { state, actions } = useApp()

  return (
    <div>
      <Header
        title="Routines"
        right={
          <Link to="/workouts/new" className="btn-primary text-sm">
            <span className="material-symbols-outlined text-lg">add</span>
            New
          </Link>
        }
      />

      {state.workouts.length === 0 ? (
        <div className="glass-card p-7 text-center text-white/50">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-accent text-3xl">fitness_center</span>
          </div>
          <div className="font-extrabold text-white mb-1">No routines yet</div>
          <div className="text-sm mb-5">Build one from the exercise library and start logging.</div>
          <Link to="/workouts/new" className="btn-primary w-full">Create Routine</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {state.workouts.map(w => (
            <RoutineCard
              key={w.id}
              workout={w}
              onDelete={() => {
                if (confirm(`Delete "${w.name}"?`)) actions.deleteWorkout(w.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RoutineCard({ workout, onDelete }) {
  const preview = workout.exercises.slice(0, 3)
  const more = Math.max(0, workout.exercises.length - preview.length)
  const estimate = Math.max(20, Math.min(90, workout.exercises.length * 8 + 8))

  return (
    <div className="glass-card overflow-hidden rounded-3xl hover:border-accent/35 transition">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-extrabold text-xl tracking-tight truncate">{workout.name}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(workout.targetMuscles ?? []).slice(0, 3).map(m => <span key={m} className="chip">{m}</span>)}
              <span className={`chip ${workout.isPublic ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-white/5 border-white/10 text-white/35'}`}>
                {workout.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link to={`/workouts/${workout.id}/edit`} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-accent/50" aria-label={`Edit ${workout.name}`}>
              <span className="material-symbols-outlined text-lg">edit</span>
            </Link>
            <button onClick={onDelete} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/45 hover:text-danger hover:border-danger/40" aria-label={`Delete ${workout.name}`}>
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {preview.map(ex => (
            <div key={ex.id} className="flex items-center gap-3">
              <ExerciseThumb exercise={ex} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{ex.name}</div>
                <div className="text-xs text-white/40">{ex.sets || 1} sets</div>
              </div>
            </div>
          ))}
          {more > 0 && <div className="text-sm text-white/45 pl-1">and {more} more...</div>}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">timer</span>
              {estimate} min
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">fitness_center</span>
              {workout.exercises.length} moves
            </span>
          </div>
          <Link to={`/workouts/${workout.id}/log`} className="btn-primary px-5 py-2 text-xs">Start</Link>
        </div>
      </div>
    </div>
  )
}
