import { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import { levelFromXP, rankFor } from '../lib/xp.js'
import XPProgressBar from '../components/XPProgressBar.jsx'
import RankBadge from '../components/RankBadge.jsx'

export default function Profile() {
  const { state, actions } = useApp()
  const { user, history } = state
  const lvl = levelFromXP(user.totalXP)
  const { current, next, xpToNext } = rankFor(user.totalXP)
  const [name, setName] = useState(user.username)

  return (
    <div>
      <Header title="Profile" />

      <div className="card-grad p-5 mb-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: current.color }} />
        <div className="flex items-center gap-3 mb-3">
          <RankBadge rank={current} size={56} />
          <div className="min-w-0 flex-1">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => name.trim() && actions.updateUsername(name.trim())}
              className="input w-full font-extrabold text-lg"
            />
            <div className="text-xs text-white/50 mt-1">
              Level {lvl.level} • {current.name}{next ? ` • ${xpToNext.toLocaleString()} XP to ${next.name}` : ' • Max rank'}
            </div>
          </div>
        </div>
        <XPProgressBar value={lvl.progress} color="#7c5cff" label={`${user.totalXP.toLocaleString()} XP`} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Workouts" value={history.length} />
        <Stat label="Streak"   value={`${user.streak}🔥`} />
        <Stat label="Weekly"   value={user.weeklyXP.toLocaleString()} />
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2 px-1">History</h2>
      {history.length === 0 ? (
        <div className="card p-6 text-center text-white/50 text-sm">No workouts yet.</div>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">🏋️</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{h.workoutName}</div>
                <div className="text-xs text-white/40">
                  {new Date(h.date).toLocaleString()} • {h.exercises.length} exercises
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-xp">+{h.xp}</div>
                <div className="text-[10px] text-white/40">XP</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            if (confirm('Reset all progress? This cannot be undone.')) actions.reset()
          }}
          className="text-xs text-danger/70 hover:text-danger"
        >Reset all progress</button>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</div>
      <div className="text-lg font-extrabold mt-0.5">{value}</div>
    </div>
  )
}
