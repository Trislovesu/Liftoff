import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import ExerciseThumb from '../components/ExerciseThumb.jsx'
import { EXERCISE_BY_ID } from '../data/exerciseLibrary.js'

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'tips', label: 'Tips' },
  { id: 'mistakes', label: 'Mistakes' }
]

export default function ExerciseAbout() {
  const { id } = useParams()
  const ex = EXERCISE_BY_ID[id]
  const [tab, setTab] = useState('about')

  const muscles = useMemo(() => {
    if (!ex) return []
    return [
      { name: ex.primaryMuscle, type: 'Primary' },
      ...(ex.secondaryMuscles || []).map(name => ({ name, type: 'Secondary' }))
    ]
  }, [ex])

  if (!ex) {
    return (
      <div>
        <Header title="Exercise" back="/workouts" />
        <div className="card p-6 text-center text-white/50">Exercise not found.</div>
      </div>
    )
  }

  const activeItems = tab === 'tips' ? ex.tips : tab === 'mistakes' ? ex.mistakes : ex.instructions

  return (
    <div className="pb-8">
      <Header title={ex.name} back="/workouts" />

      <section className="glass-card rounded-3xl overflow-hidden mb-4">
        <div className="p-5 flex items-center gap-4 bg-bg-950/25 border-b border-white/10">
          <ExerciseThumb exercise={ex} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="metric-label mb-1">Exercise guide</div>
            <h1 className="text-2xl font-extrabold tracking-tight leading-tight">{ex.name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-white/10">
          {TABS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`py-3 text-sm font-extrabold border-b-2 transition ${
                tab === item.id ? 'border-accent text-white bg-accent/10' : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <Section title={tab === 'about' ? 'How to perform' : tab === 'tips' ? 'Form tips' : 'Common mistakes'} items={activeItems} tab={tab} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold mb-3 px-1">Target Areas</h2>
        <div className="space-y-2">
          {muscles.map(m => (
            <div key={`${m.type}-${m.name}`} className="glass-card p-3 flex items-center justify-between">
              <div>
                <div className="font-bold">{m.name}</div>
                <div className="text-xs text-white/40">{m.type} muscle</div>
              </div>
              <span className={`chip ${m.type === 'Primary' ? 'bg-accent/15 border-accent/40 text-accent' : 'text-white/45'}`}>
                {m.type}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Section({ title, items, tab }) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-white/45">No notes saved for this section yet.</div>
  }

  return (
    <div>
      <div className="metric-label mb-3 text-accent">{title}</div>
      <ol className="space-y-2">
        {items.map((line, i) => (
          <li key={i} className="flex gap-3 text-sm text-white/80">
            <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-extrabold ${
              tab === 'mistakes' ? 'bg-danger/15 text-danger border border-danger/30' : 'bg-accent/15 text-accent border border-accent/30'
            }`}>
              {i + 1}
            </span>
            <span className="pt-1">{line}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
