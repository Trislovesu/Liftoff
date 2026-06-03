import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import MuscleCard from '../components/MuscleCard.jsx'
import { statusForLevel } from '../data/muscles.js'

// Simplified front/back body silhouette using positioned blobs.
// Each muscle's glow intensity scales with its level.
function bodyBlobStyle(level) {
  const status = statusForLevel(level)
  const intensity = Math.min(1, level / 18)
  return {
    background: `radial-gradient(circle, ${status.color}${Math.round(40 + intensity * 80).toString(16).padStart(2,'0')}, transparent 70%)`,
    boxShadow: `0 0 ${10 + intensity * 30}px ${status.color}${Math.round(70 + intensity * 120).toString(16).padStart(2,'0')}`
  }
}

const FRONT_MAP = [
  // [muscle, top%, left%, width%, height%]
  ['Shoulders', 14, 30, 12, 9],
  ['Shoulders', 14, 58, 12, 9],
  ['Chest',     22, 36, 28, 12],
  ['Biceps',    28, 22, 10, 12],
  ['Biceps',    28, 68, 10, 12],
  ['Forearms',  44, 16, 10, 14],
  ['Forearms',  44, 74, 10, 14],
  ['Abs',       38, 40, 20, 18],
  ['Quads',     62, 32, 14, 22],
  ['Quads',     62, 54, 14, 22],
  ['Calves',    86, 33, 12, 12],
  ['Calves',    86, 55, 12, 12]
]

const BACK_MAP = [
  ['Shoulders', 14, 30, 12, 9],
  ['Shoulders', 14, 58, 12, 9],
  ['Back',      24, 34, 32, 22],
  ['Triceps',   28, 22, 10, 12],
  ['Triceps',   28, 68, 10, 12],
  ['Forearms',  44, 16, 10, 14],
  ['Forearms',  44, 74, 10, 14],
  ['Glutes',    52, 34, 32, 12],
  ['Hamstrings',66, 32, 14, 18],
  ['Hamstrings',66, 54, 14, 18],
  ['Calves',    86, 33, 12, 12],
  ['Calves',    86, 55, 12, 12]
]

function BodySide({ map, muscleByName, label }) {
  return (
    <div className="card p-3 relative aspect-[1/2] overflow-hidden">
      <div className="absolute top-2 left-3 text-[10px] uppercase tracking-wider text-white/40 font-bold">{label}</div>
      {/* silhouette */}
      <div className="absolute inset-3 rounded-3xl bg-white/[0.03] border border-white/5" />
      {map.map(([name, t, l, w, h], i) => {
        const muscle = muscleByName[name]
        if (!muscle) return null
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${t}%`, left: `${l}%`, width: `${w}%`, height: `${h}%`,
              ...bodyBlobStyle(muscle.level)
            }}
            title={`${name} L${muscle.level}`}
          />
        )
      })}
    </div>
  )
}

export default function BodyMap() {
  const { state } = useApp()
  const muscleByName = Object.fromEntries(state.user.muscles.map(m => [m.name, m]))

  return (
    <div>
      <Header title="Body Map" />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <BodySide map={FRONT_MAP} muscleByName={muscleByName} label="Front" />
        <BodySide map={BACK_MAP}  muscleByName={muscleByName} label="Back" />
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2 px-1">Muscles</h2>
      <div className="grid grid-cols-2 gap-3">
        {state.user.muscles.map(m => <MuscleCard key={m.name} muscle={m} />)}
      </div>
    </div>
  )
}
