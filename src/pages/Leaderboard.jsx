import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import Avatar from '../components/Avatar.jsx'
import { rankFor, rankIndex, levelFromXP } from '../lib/xp.js'
import { rpcLeaderboard } from '../lib/supabase.js'

export default function Leaderboard() {
  const { state } = useApp()
  const [mode, setMode] = useState('total') // 'total' | 'weekly' | 'rank'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let dead = false
    setLoading(true); setError('')
    rpcLeaderboard()
      .then(data => { if (!dead) setRows(data) })
      .catch(e => { if (!dead) setError(e.message) })
      .finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [])

  const sorted = useMemo(() => {
    const arr = rows.map(r => ({
      username: r.username,
      totalXP: r.total_xp,
      weeklyXP: r.weekly_xp,
      totalWorkouts: r.total_workouts,
      profilePicUrl: r.profile_pic_url,
      strongestMuscle: strongestFromMuscles(r.muscles)
    }))
    if (mode === 'weekly') arr.sort((a, b) => b.weeklyXP - a.weeklyXP || b.totalXP - a.totalXP)
    else if (mode === 'rank') arr.sort((a, b) => rankIndex(b.totalXP) - rankIndex(a.totalXP) || b.totalXP - a.totalXP)
    else arr.sort((a, b) => b.totalXP - a.totalXP)
    return arr
  }, [rows, mode])

  return (
    <div>
      <Header title="Leaderboard" />

      <div className="card p-1 flex mb-4">
        {[
          { id: 'total',  label: 'All Time' },
          { id: 'weekly', label: 'This Week' },
          { id: 'rank',   label: 'Rank' }
        ].map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            className={`flex-1 py-2 rounded text-sm font-semibold transition ${
              mode === t.id ? 'bg-accent text-white shadow-glow' : 'text-white/60'
            }`}>{t.label}</button>
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
            const xpValue = mode === 'weekly' ? u.weeklyXP : u.totalXP
            return (
              <div key={u.username + i}
                className={`card p-3 flex items-center gap-3 ${isYou ? 'border-accent/60 shadow-glow' : ''}`}
                style={isYou ? { background: 'linear-gradient(135deg, rgba(170,170,170,0.18), rgba(56,225,176,0.06))' } : undefined}>
                <div className={`w-6 text-center font-extrabold ${i < 3 ? 'text-gold' : 'text-white/40'}`}>
                  {i + 1}
                </div>
                <Avatar user={u} size={40} ring={rank.color} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate flex items-center gap-2">
                    {u.username}
                    {isYou && <span className="chip bg-accent/20 border-accent/50 text-accent">You</span>}
                  </div>
                  <div className="text-xs truncate" style={{ color: rank.color }}>
                    <span className="font-bold">{rank.name}</span>
                    <span className="text-white/40"> • Lv {lvl} • 🏋️ {u.totalWorkouts || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-xp">{(xpValue || 0).toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    {mode === 'weekly' ? 'Weekly' : mode === 'rank' ? 'Total' : 'Total'} XP
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
