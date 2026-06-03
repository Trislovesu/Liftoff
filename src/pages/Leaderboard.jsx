import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import RankBadge from '../components/RankBadge.jsx'
import { MOCK_LEADERBOARD } from '../data/mockLeaderboard.js'
import { rankFor, levelFromXP } from '../lib/xp.js'

export default function Leaderboard() {
  const { state } = useApp()
  const [mode, setMode] = useState('total') // 'total' | 'weekly'

  const me = useMemo(() => {
    const strongest = [...state.user.muscles].sort((a,b) => b.level - a.level || b.xp - a.xp)[0]
    return {
      username: state.user.username,
      level: levelFromXP(state.user.totalXP).level,
      totalXP: state.user.totalXP,
      weeklyXP: state.user.weeklyXP,
      streak: state.user.streak,
      strongestMuscle: strongest?.level > 0 ? strongest.name : '—',
      __isYou: true
    }
  }, [state.user])

  const rows = useMemo(() => {
    const all = [...MOCK_LEADERBOARD, me]
    return all.sort((a, b) => (b[mode === 'weekly' ? 'weeklyXP' : 'totalXP'] - a[mode === 'weekly' ? 'weeklyXP' : 'totalXP']))
  }, [me, mode])

  return (
    <div>
      <Header title="Leaderboard" />

      <div className="card p-1 flex mb-4">
        {[
          { id: 'total',  label: 'All Time' },
          { id: 'weekly', label: 'This Week' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              mode === t.id ? 'bg-accent text-white shadow-glow' : 'text-white/60'
            }`}
          >{t.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((u, i) => {
          const rank = rankFor(u.totalXP).current
          const isYou = u.__isYou
          return (
            <div
              key={u.username + i}
              className={`card p-3 flex items-center gap-3 ${isYou ? 'border-accent/60 shadow-glow' : ''}`}
              style={isYou ? { background: 'linear-gradient(135deg, rgba(124,92,255,0.18), rgba(56,225,176,0.06))' } : undefined}
            >
              <div className={`w-8 text-center font-extrabold ${i < 3 ? 'text-gold' : 'text-white/40'}`}>
                {i + 1}
              </div>
              <RankBadge rank={rank} size={36} />
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate flex items-center gap-2">
                  {u.username}
                  {isYou && <span className="chip bg-accent/20 border-accent/50 text-accent">You</span>}
                </div>
                <div className="text-xs text-white/40 truncate">
                  Lv {u.level} • {u.strongestMuscle} • 🔥 {u.streak}
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-xp">
                  {(mode === 'weekly' ? u.weeklyXP : u.totalXP).toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  {mode === 'weekly' ? 'Weekly' : 'Total'} XP
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-white/30 mt-4">Mock data — real friends coming soon.</p>
    </div>
  )
}
