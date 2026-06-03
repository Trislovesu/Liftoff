import { useParams } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'

export default function WorkoutHistoryDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const entry = state.history.find(h => h.id === id)

  if (!entry) {
    return (
      <div>
        <Header title="Workout" back="/profile" />
        <div className="card p-6 text-center text-white/50">Workout not found.</div>
      </div>
    )
  }

  return (
    <div>
      <Header title={entry.workoutName} back="/profile" right={
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">XP</div>
          <div className="text-lg font-extrabold text-xp leading-none">+{entry.xp}</div>
        </div>
      } />

      <div className="card-grad p-3 mb-4 flex items-center justify-between text-xs">
        <span className="text-white/60">{new Date(entry.date).toLocaleString()}</span>
        <span className="text-white/50">
          {Math.floor((entry.durationSec || 0) / 60)} min •{' '}
          {entry.exercises.length} ex
        </span>
      </div>

      <div className="space-y-3">
        {entry.exercises.map((ex, i) => (
          <div key={i} className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-bold">{ex.name}</div>
                <div className="text-xs text-white/40">{ex.primaryMuscle}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-white/40">XP</div>
                <div className="font-extrabold text-xp">+{ex.xp}</div>
              </div>
            </div>
            {ex.sets && ex.sets.length > 0 && (
              <div className="space-y-1 mt-2">
                <div className="grid grid-cols-[28px_1fr_1fr] gap-2 text-[11px] uppercase tracking-wider text-white/40 font-semibold px-1">
                  <div>Set</div><div>Weight</div><div>Reps</div>
                </div>
                {ex.sets.map((s, j) => (
                  <div key={j} className="grid grid-cols-[28px_1fr_1fr] gap-2 items-center bg-white/[0.03] rounded-lg px-2 py-1.5">
                    <div className="text-center font-bold text-white/60 text-sm">{j + 1}</div>
                    <div className="text-sm">{s.weight} lbs</div>
                    <div className="text-sm">{s.reps}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {(entry.completionBonus || entry.pumpPicBonus) > 0 && (
        <div className="mt-4 card p-3 text-xs text-white/60">
          {entry.completionBonus > 0 && <div>Completion bonus: +{entry.completionBonus} XP</div>}
          {entry.pumpPicBonus > 0 && <div>Pump-pic bonus: +{entry.pumpPicBonus} XP</div>}
        </div>
      )}
    </div>
  )
}
