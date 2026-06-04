import { useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { EXERCISE_BY_ID } from '../data/exerciseLibrary.js'

export default function ExerciseAbout() {
  const { id } = useParams()
  const ex = EXERCISE_BY_ID[id]

  if (!ex) {
    return (
      <div>
        <Header title="Exercise" back="/workouts" />
        <div className="card p-6 text-center text-white/50">Exercise not found.</div>
      </div>
    )
  }

  return (
    <div>
      <Header title={ex.name} back="/workouts" />

      <div className="card-grad aspect-video mb-4 flex items-center justify-center text-5xl">
        🎬
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="chip bg-accent/15 border-accent/40 text-accent">{ex.primaryMuscle}</span>
        {ex.secondaryMuscles.map(m => <span key={m} className="chip">{m}</span>)}
      </div>

      <Section title="Instructions" items={ex.instructions} />
      <Section title="Form Tips" items={ex.tips} accent="#ffb3af" />
      <Section title="Common Mistakes" items={ex.mistakes} accent="#ff5357" />
    </div>
  )
}

function Section({ title, items, accent = '#ff0033' }) {
  if (!items || items.length === 0) return null
  return (
    <div className="card p-4 mb-3">
      <div className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: accent }}>{title}</div>
      <ol className="space-y-1.5">
        {items.map((line, i) => (
          <li key={i} className="text-sm text-white/80 flex gap-2">
            <span className="text-white/30 font-bold w-5 shrink-0">{i + 1}.</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
