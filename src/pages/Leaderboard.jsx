import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import Avatar from '../components/Avatar.jsx'
import VerifiedName from '../components/VerifiedName.jsx'
import { rankFor, rankIndex, levelFromXP } from '../lib/xp.js'
import { rpcLeaderboard, subscribeToLeaderboardUpdates } from '../lib/supabase.js'

export default function Leaderboard() {
  const { state } = useApp()
  const [mode, setMode] = useState('total') // 'total' | 'weekly' | 'rank'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function refreshRows({ showLoading = false } = {}) {
    if (showLoading) setLoading(true)
    setError('')
    try {
      setRows(await rpcLeaderboard())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let dead = false
    const load = async () => {
      setLoading(true); setError('')
      try {
        const data = await rpcLeaderboard()
        if (!dead) setRows(data)
      } catch (e) {
        if (!dead) setError(e.message)
      } finally {
        if (!dead) setLoading(false)
      }
    }
    load()
    const unsubscribe = subscribeToLeaderboardUpdates(() => {
      if (!dead) refreshRows({ showLoading: false })
    })
    const interval = setInterval(() => {
      if (!dead) refreshRows({ showLoading: false })
    }, 60000)
    return () => {
      dead = true
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const sorted = useMemo(() => {
    const arr = rows.map(r => ({
      username: r.username,
      totalXP: r.total_xp,
      weeklyXP: r.weekly_xp,
      totalWorkouts: r.total_workouts,
      profilePicUrl: r.profile_pic_url,
      zionVerified: r.zion_verified,
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
        <div className="space-y-4">
          {sorted.length > 0 && (
            <section className="pb-2">
              <div className="flex justify-center mb-3">
                <PodiumCard user={sorted[0]} place={1} mode={mode} isYou={sorted[0].username === state.user?.username} />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                {sorted[1] && <PodiumCard user={sorted[1]} place={2} mode={mode} isYou={sorted[1].username === state.user?.username} />}
                {sorted[2] && <PodiumCard user={sorted[2]} place={3} mode={mode} isYou={sorted[2].username === state.user?.username} />}
              </div>
            </section>
          )}

          {sorted.slice(3).map((u, i) => {
            const rank = rankFor(u.totalXP).current
            const isYou = u.username === state.user?.username
            const lvl = levelFromXP(u.totalXP).level
            const xpValue = mode === 'weekly' ? u.weeklyXP : u.totalXP
            const place = i + 4
            return (
              <Link key={u.username + i}
                to={`/u/${u.username}`}
                className={`card p-3 flex items-center gap-3 ${isYou ? 'border-accent/60 shadow-glow' : ''}`}
                style={isYou ? { background: 'linear-gradient(135deg, rgba(170,170,170,0.18), rgba(56,225,176,0.06))' } : undefined}>
                <div className="w-6 text-center font-extrabold text-white/40">
                  {place}
                </div>
                <Avatar user={u} size={40} ring={rank.color} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate flex items-center gap-2">
                    <VerifiedName user={u} className="min-w-0" />
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
              </Link>
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

function PodiumCard({ user, place, mode, isYou }) {
  const rank = rankFor(user.totalXP).current
  const lvl = levelFromXP(user.totalXP).level
  const xpValue = mode === 'weekly' ? user.weeklyXP : user.totalXP
  const first = place === 1

  return (
    <Link
      to={`/u/${user.username}`}
      className={`relative block overflow-hidden rounded-3xl border bg-bg-950/70 p-4 text-center transition active:scale-[0.98] ${
        first
          ? 'w-[78%] border-gold/60 shadow-[0_0_36px_rgba(255,215,0,0.24)]'
          : 'border-accent/35 shadow-[0_0_24px_rgba(255,0,51,0.16)]'
      } ${isYou ? 'ring-1 ring-accent/70' : ''}`}
    >
      {first ? <CelebrationEffect /> : <FireEffect />}
      <div className="relative z-10">
        <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full font-extrabold ${first ? 'bg-gold text-bg-950' : 'bg-accent text-white'}`}>
          {place}
        </div>
        <div className="flex justify-center mb-2">
          <Avatar user={user} size={first ? 58 : 48} ring={rank.color} />
        </div>
        <VerifiedName user={user} className="justify-center font-extrabold" />
        {isYou && <div className="metric-label text-accent mt-1">You</div>}
        <div className="text-xs mt-2" style={{ color: rank.color }}>{rank.name} · Lv {lvl}</div>
        <div className="mt-3 text-2xl font-extrabold text-xp">{(xpValue || 0).toLocaleString()}</div>
        <div className="metric-label">{mode === 'weekly' ? 'Weekly XP' : 'Total XP'}</div>
      </div>
    </Link>
  )
}

function CelebrationEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(14)].map((_, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-gold animate-ping"
          style={{
            left: `${8 + ((i * 17) % 84)}%`,
            top: `${8 + ((i * 23) % 62)}%`,
            animationDelay: `${i * 0.13}s`,
            animationDuration: '1.6s'
          }}
        />
      ))}
      <div className="absolute inset-x-6 top-0 h-16 bg-[radial-gradient(circle,rgba(255,215,0,0.35),transparent_60%)] blur-xl" />
    </div>
  )
}

function FireEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -inset-px rounded-3xl border border-accent/40 animate-pulse" />
      {[...Array(10)].map((_, i) => (
        <span
          key={i}
          className="absolute bottom-0 h-7 w-3 rounded-full bg-gradient-to-t from-accent via-orange-400 to-transparent blur-[1px] animate-pulse"
          style={{
            left: `${4 + i * 10}%`,
            animationDelay: `${i * 0.12}s`,
            transform: `scaleY(${0.7 + (i % 3) * 0.18})`
          }}
        />
      ))}
    </div>
  )
}

function strongestFromMuscles(muscles) {
  if (!Array.isArray(muscles) || muscles.length === 0) return '—'
  const top = [...muscles].sort((a, b) => (b.level - a.level) || (b.xp - a.xp))[0]
  return top?.level > 0 ? top.name : '—'
}
