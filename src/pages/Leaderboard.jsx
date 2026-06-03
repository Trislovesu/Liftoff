import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import RankBadge from '../components/RankBadge.jsx'
import { rankFor, levelFromXP } from '../lib/xp.js'
import { rpcLeaderboard } from '../lib/supabase.js'

export default function Leaderboard() {
  const { state } = useApp()
  const [mode, setMode] = useState('total') // 'total' | 'weekly'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    rpcLeaderboard()
      .then(data => { if (!cancelled) setRows(data) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const sorted = useMemo(() => {
    const arr = [...rows].map(r => ({
      username: r.username,
      totalXP: r.total_xp,
      weeklyXP: r.weekly_xp,
      streak: r.streak,
      strongestMuscle: strongestFromMuscles(r.muscles)
    }))
    arr.sort((a, b) =>
      (b[mode === 'weekly' ? 'weeklyXP' : 'totalXP']) -
      (a[mode === 'weekly' ? 'weeklyXP' : 'totalXP'])
    )
    return arr
  }, [rows, mode])

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

      {loading && <div className="card p-6 text-center text-white/50 text-sm">Loading leaderboard…</div>}
      {error && <div className="card p-4 text-center text-danger text-sm">{error}</div>}

      {!loading && !error && (
        <div className="space-y-2">
          {sorted.map((u, i) => {
            const rank = rankFor(u.totalXP).current
            const isYou = u.username === state.user?.username
            const lvl = levelFromXP(u.totalXP).level
            return (
              <div
                key={u.username}
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
                    Lv {lvl} • {u.strongestMuscle} • 🔥 {u.streak}
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
          {sorted.length === 0 && (
            <div className="card p-6 text-center text-white/40 text-sm">
              No players yet — invite a friend!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function strongestFromMuscles(muscles) {
  if (!Array.isArray(muscles) || muscles.length === 0) return '—'
  const top = [...muscles].sort((a, b) => (b.level - a.level) || (b.xp - a.xp))[0]
  return top?.level > 0 ? top.name : '—'
}
