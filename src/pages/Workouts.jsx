import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'

export default function Workouts() {
  const { state, actions } = useApp()
  return (
    <div>
      <Header
        title="Workouts"
        right={
          <Link to="/workouts/new" className="btn-primary text-sm">＋ New</Link>
        }
      />
      {state.workouts.length === 0 ? (
        <div className="card p-6 text-center text-white/50">
          No workouts yet. <Link to="/workouts/new" className="text-accent">Create one</Link>.
        </div>
      ) : (
        <div className="space-y-3">
          {state.workouts.map(w => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-lg truncate">{w.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {w.targetMuscles.map(m => <span key={m} className="chip">{m}</span>)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-white/40">Exercises</div>
                  <div className="font-extrabold text-xl">{w.exercises.length}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link to={`/workouts/${w.id}/log`} className="btn-primary flex-1 justify-center">▶ Start</Link>
                <Link to={`/workouts/${w.id}/edit`} className="btn-ghost">Edit</Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${w.name}"?`)) actions.deleteWorkout(w.id)
                  }}
                  className="btn-ghost text-danger"
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
