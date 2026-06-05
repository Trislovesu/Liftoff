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

      <section className="mb-4">
        <div className="flex items-end justify-between mb-3 px-1">
          <h2 className="text-2xl font-extrabold tracking-tight">Muscles Worked</h2>
          <div className="flex items-center gap-3 text-xs text-white/45">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-accent" />Primary</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-white/35" />Secondary</span>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-4">
          <MuscleMap primary={ex.primaryMuscle} secondaries={ex.secondaryMuscles || []} />
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

function MuscleMap({ primary, secondaries }) {
  const zones = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Abs', 'Quads', 'Hamstrings', 'Glutes', 'Calves']

  return (
    <div className="grid grid-cols-2 gap-4">
      <BodySilhouette label="Front" zones={zones} primary={primary} secondaries={secondaries} side="front" />
      <BodySilhouette label="Back" zones={zones} primary={primary} secondaries={secondaries} side="back" />
    </div>
  )
}

function BodySilhouette({ label, zones, primary, secondaries, side }) {
  const visible = side === 'front'
    ? ['Chest', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Abs', 'Quads', 'Calves']
    : ['Back', 'Shoulders', 'Triceps', 'Forearms', 'Glutes', 'Hamstrings', 'Calves']

  return (
    <div className="rounded-3xl bg-bg-950/55 border border-white/5 p-3">
      <div className="metric-label mb-3 text-center">{label}</div>
      <div className="relative h-56 mx-auto max-w-[150px]">
        <span className="absolute left-1/2 top-0 -translate-x-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/10" />
        <span className="absolute left-1/2 top-10 -translate-x-1/2 w-16 h-24 rounded-[28px] bg-white/10 border border-white/10" />
        <span className="absolute left-4 top-14 w-9 h-24 rounded-full bg-white/10 border border-white/10 rotate-12" />
        <span className="absolute right-4 top-14 w-9 h-24 rounded-full bg-white/10 border border-white/10 -rotate-12" />
        <span className="absolute left-[38px] top-[130px] w-9 h-24 rounded-full bg-white/10 border border-white/10 rotate-3" />
        <span className="absolute right-[38px] top-[130px] w-9 h-24 rounded-full bg-white/10 border border-white/10 -rotate-3" />
        {zones.filter(z => visible.includes(z)).map((zone, idx) => (
          <span
            key={zone}
            className={`absolute rounded-full blur-[1px] ${zoneClass(zone, primary, secondaries)}`}
            style={zonePosition(zone, side, idx)}
          />
        ))}
      </div>
    </div>
  )
}

function zoneClass(zone, primary, secondaries) {
  if (zone === primary) return 'bg-accent shadow-[0_0_16px_rgba(255,0,51,0.65)]'
  if (secondaries.includes(zone)) return 'bg-white/40'
  return 'bg-transparent'
}

function zonePosition(zone, side) {
  const map = {
    Chest: { left: '43%', top: '24%', width: '28px', height: '22px' },
    Back: { left: '41%', top: '24%', width: '32px', height: '48px' },
    Shoulders: { left: '30%', top: '22%', width: '60px', height: '12px' },
    Biceps: { left: '20%', top: '36%', width: '18px', height: '44px' },
    Triceps: { right: '20%', top: '36%', width: '18px', height: '44px' },
    Forearms: { left: '16%', top: '58%', width: '16px', height: '42px' },
    Abs: { left: '44%', top: '40%', width: '24px', height: '42px' },
    Quads: { left: '34%', top: '62%', width: '46px', height: '58px' },
    Hamstrings: { left: '34%', top: '62%', width: '46px', height: '58px' },
    Glutes: { left: '36%', top: '54%', width: '42px', height: '32px' },
    Calves: { left: '36%', top: '82%', width: '42px', height: '34px' }
  }
  return map[zone] || {}
}
