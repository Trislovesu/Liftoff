import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'
import { RANKS, levelFromXP, rankFor } from '../lib/xp.js'
import { rpcGetPumpPhotos } from '../lib/supabase.js'
import { tierForLevel } from '../lib/tiers.js'

function weeklyChartPoints(history) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toDateString()
  })
  const totals = days.map(day => history
    .filter(h => new Date(h.date).toDateString() === day)
    .reduce((sum, h) => sum + (h.xp || 0), 0)
  )
  const max = Math.max(1, ...totals)
  return totals.map((v, i) => {
    const x = (i / 6) * 400
    const y = 88 - (v / max) * 72
    return `${x},${y}`
  }).join(' ')
}

function recentSummary(history) {
  return history.slice(0, 4).map(h => {
    const first = h.exercises?.[0]
    const sets = h.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0
    const best = h.exercises
      ?.flatMap(ex => ex.sets?.map(s => ({ ...s, name: ex.name, muscle: ex.primaryMuscle })) || [])
      ?.sort((a, b) => (b.weight || 0) - (a.weight || 0))[0]
    return {
      id: h.id,
      name: first?.name || h.workoutName,
      workoutName: h.workoutName,
      muscle: first?.primaryMuscle || 'Workout',
      weight: best?.weight || 0,
      reps: best?.reps || 0,
      sets,
      xp: h.xp || 0
    }
  })
}

function dailyMotivation(user, history) {
  const day = Math.floor(Date.now() / 86400000)
  const recent = history[0]
  const options = [
    `Level ${levelFromXP(user.totalXP).level} is looking sharp. Stack another clean session.`,
    user.weeklyXP > 0 ? `${user.weeklyXP.toLocaleString()} XP this week. Keep the pressure on.` : 'Fresh week. First lift sets the tone.',
    recent ? `Last session hit +${recent.xp} XP. Today, beat one number.` : 'Start simple. Log the first set and momentum follows.',
    (user.totalWorkouts || 0) > 0 ? `${user.totalWorkouts} workouts logged. Build the next rep.` : 'Your first logged workout is waiting.'
  ]
  return options[day % options.length]
}

function muscleRankings(user) {
  return [...user.muscles]
    .sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp))
    .slice(0, 5)
    .map((m, index) => {
      const tier = tierForLevel(m.level)
      const fatigue = Math.min(98, Math.max(12, Math.round((m.level * 8 + m.xp / 8 + index * 7) % 100)))
      const status = fatigue > 75 ? 'Critical fatigue' : fatigue > 42 ? 'Recovering' : 'Optimal'
      return { ...m, tier, fatigue, status }
    })
}

function xpNeededForLevel(level) {
  return Math.round(100 * Math.pow(level, 1.4))
}

function totalXPForLevel(level) {
  let total = 0
  for (let i = 1; i < level; i++) total += xpNeededForLevel(i)
  return total
}

export default function Dashboard() {
  const { state } = useApp()
  const { user, history } = state
  const [pumpPhoto, setPumpPhoto] = useState(null)
  const [detail, setDetail] = useState(null)
  const lvl = levelFromXP(user.totalXP)
  const rank = rankFor(user.totalXP)
  const recent = recentSummary(history)
  const chartPoints = weeklyChartPoints(history)
  const totalSets = history.reduce((sum, h) => sum + h.exercises.reduce((a, ex) => a + (ex.sets?.length || 0), 0), 0)
  const weeklyGain = user.weeklyXP > 0 ? '+12%' : '0%'
  const motivation = useMemo(() => dailyMotivation(user, history), [user, history])
  const rankings = useMemo(() => muscleRankings(user), [user])
  const recommended = rankings.find(m => m.fatigue < 60)?.name || rankings[0]?.name || 'Chest'

  useEffect(() => {
    let dead = false
    rpcGetPumpPhotos(user.username)
      .then(photos => { if (!dead) setPumpPhoto(photos[0] || null) })
      .catch(() => { if (!dead) setPumpPhoto(null) })
    return () => { dead = true }
  }, [user.username])

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="metric-label mb-1">Welcome back, {user.username}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{motivation}</h1>
      </motion.section>

      <section className="glass-card p-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-12 w-36 h-36 bg-accent/10 rounded-full blur-3xl" />
        <div className="flex justify-between items-end mb-6 relative">
          <div>
            <h2 className="text-2xl font-extrabold text-accent tracking-tight">Weekly Progress</h2>
            <p className="text-sm text-white/45">XP intensity</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-extrabold text-accent tracking-tight">{weeklyGain}</span>
          </div>
        </div>

        <div className="h-40 w-full relative">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
            <defs>
              <linearGradient id="dashLine" x1="0" x2="1">
                <stop offset="0%" stopColor="#ffb3af" />
                <stop offset="100%" stopColor="#ff0033" />
              </linearGradient>
            </defs>
            <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
              <line x1="0" x2="400" y1="25" y2="25" />
              <line x1="0" x2="400" y1="55" y2="55" />
              <line x1="0" x2="400" y1="85" y2="85" />
            </g>
            <polyline points={chartPoints} fill="none" stroke="url(#dashLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="400" cy={chartPoints.split(' ').at(-1)?.split(',')[1] || 16} r="5" fill="#ff0033" className="drop-shadow-[0_0_10px_rgba(255,0,51,0.8)]" />
          </svg>
        </div>
        <div className="flex justify-between mt-4 metric-label px-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <MetricCard label="Level" value={lvl.level} sub={`${Math.round(lvl.progress * 100)}%`} hot onClick={() => setDetail('level')} />
        <MetricCard label="Rank" value={rank.current.name} sub={`${rank.xpToNext.toLocaleString()} XP`} onClick={() => setDetail('rank')} />
        <MetricCard label="Workouts" value={user.totalWorkouts || 0} sub="lifetime" />
        <MetricCard label="Weekly XP" value={user.weeklyXP.toLocaleString()} sub="this week" hot />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight">Muscle Rankings</h2>
            <Link to="/body" className="shrink-0 px-3 py-1 bg-bg-600 rounded-full metric-label text-accent border border-accent/20">
              Train {recommended}
            </Link>
          </div>
        </div>
        <div className="space-y-3">
          {rankings.map((m, i) => (
            <Link key={m.name} to="/body" className="glass-card p-4 block hover:border-accent/40 transition">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold"
                    style={{ color: m.tier.color, background: `${m.tier.color}18`, borderColor: `${m.tier.color}44` }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{m.name}</h3>
                    <p className="metric-label" style={{ color: m.tier.color }}>{m.tier.name} • {m.status}</p>
                  </div>
                </div>
                <span className="font-extrabold text-sm" style={{ color: m.tier.color }}>{m.fatigue}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${m.fatigue}%`, background: m.tier.color }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-extrabold tracking-tight">Recent Lifts</h2>
          <Link to="/profile" className="metric-label text-accent">View all</Link>
        </div>

        {recent.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-white/45 text-sm">No workouts yet.</p>
            <Link to="/workouts" className="text-accent font-bold text-sm mt-2 inline-block">Start your first lift</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(h => (
              <Link key={h.id} to={`/history/${h.id}`} className="glass-card p-5 flex items-center gap-4 hover:border-accent/40 transition">
                <div className="w-12 h-12 bg-bg-700 rounded-lg flex items-center justify-center text-accent">
                  <span className="material-symbols-outlined">fitness_center</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{h.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-bg-600 rounded text-[10px] uppercase tracking-wider text-white/55">{h.muscle}</span>
                    <span className="px-2 py-0.5 bg-bg-600 rounded text-[10px] uppercase tracking-wider text-white/55">+{h.xp} XP</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-extrabold">{h.weight || h.sets}<span className="text-xs text-white/45 ml-1">{h.weight ? 'LB' : 'SETS'}</span></p>
                  <p className="metric-label">{h.sets} sets {h.reps ? `x ${h.reps}` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="relative h-52 rounded-3xl overflow-hidden border border-white/10 bg-bg-800">
        {pumpPhoto ? (
          <img src={pumpPhoto.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,0,51,0.25),transparent_35%),linear-gradient(135deg,#2e2e2e,#0a0a0a)]" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute left-8 top-8 w-24 h-24 border border-accent/50 rotate-12" />
              <div className="absolute right-8 bottom-8 w-32 h-2 bg-accent/60 blur-sm" />
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-900 via-bg-900/40 to-transparent" />
        <div className="absolute bottom-5 left-6">
          <p className="metric-label text-accent mb-1">Pro advice</p>
          <h3 className="text-xl font-extrabold pr-6">{pumpPhoto?.caption || 'You already proved you can show up. Now make the next set count.'}</h3>
        </div>
      </section>

      <Link
        to="/workouts"
        className="fixed bottom-24 right-[calc(50%-184px)] w-14 h-14 bg-accent text-white rounded-full shadow-[0_0_22px_rgba(255,0,51,0.45)] flex items-center justify-center z-40 active:scale-90 transition"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </Link>

      <div className="sr-only">Total sets logged: {totalSets}</div>

      {detail === 'level' && <LevelDetailModal user={user} lvl={lvl} onClose={() => setDetail(null)} />}
      {detail === 'rank' && <RankDetailModal user={user} rank={rank} onClose={() => setDetail(null)} />}
    </div>
  )
}

function MetricCard({ label, value, sub, hot, onClick }) {
  const interactive = Boolean(onClick)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`glass-card p-4 text-left ${hot ? 'border-l-2 border-accent' : ''} ${interactive ? 'cursor-pointer active:scale-[0.98] hover:border-accent/50 transition' : 'cursor-default'}`}
    >
      <p className="metric-label">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight mt-1 truncate">{value}</p>
      <p className="text-xs text-white/40 mt-1 truncate">{sub}</p>
    </button>
  )
}

function DetailShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm px-4 py-6 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md glass-card p-5 rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 text-white/45 hover:text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function LevelDetailModal({ user, lvl, onClose }) {
  const maxLevel = 500
  const currentLevelStart = totalXPForLevel(lvl.level)
  const targetXP = totalXPForLevel(maxLevel)
  const xpTo500 = Math.max(0, targetXP - user.totalXP)
  const pathProgress = Math.min(1, user.totalXP / targetXP)
  const milestones = [1, 100, 250, 500]

  return (
    <DetailShell onClose={onClose}>
      <p className="metric-label text-accent mb-1">Level path</p>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Level {lvl.level}</h2>
          <p className="text-sm text-white/45 mt-1">{user.totalXP.toLocaleString()} total XP</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-accent">{Math.round(lvl.progress * 100)}%</p>
          <p className="metric-label">this level</p>
        </div>
      </div>

      <div className="relative h-3 rounded-full bg-white/10 overflow-hidden mb-3">
        <div className="h-full rounded-full bg-accent shadow-[0_0_18px_rgba(255,0,51,0.65)]" style={{ width: `${pathProgress * 100}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-white/35 font-bold uppercase tracking-wider mb-6">
        {milestones.map(level => <span key={level}>Lv {level}</span>)}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Next level" value={`${lvl.xpIntoLevel.toLocaleString()} / ${lvl.xpForLevel.toLocaleString()}`} />
        <MiniStat label="XP to 500" value={xpTo500.toLocaleString()} />
        <MiniStat label="Level start" value={currentLevelStart.toLocaleString()} />
        <MiniStat label="Level 500 XP" value={targetXP.toLocaleString()} />
      </div>
    </DetailShell>
  )
}

function RankDetailModal({ user, rank, onClose }) {
  return (
    <DetailShell onClose={onClose}>
      <p className="metric-label text-accent mb-1">Rank ladder</p>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">{rank.current.name}</h2>
          <p className="text-sm text-white/45 mt-1">{user.totalXP.toLocaleString()} total XP</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-accent">{rank.next ? rank.xpToNext.toLocaleString() : 'Max'}</p>
          <p className="metric-label">{rank.next ? `to ${rank.next.name}` : 'rank'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {RANKS.map(item => {
          const active = item.name === rank.current.name
          const reached = user.totalXP >= item.min
          return (
            <div key={item.name} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${active ? 'bg-accent/10 border-accent/60' : 'bg-white/[0.03] border-white/10'}`}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: reached ? item.color : 'rgba(255,255,255,0.16)', boxShadow: active ? `0 0 16px ${item.glow}` : 'none' }} />
              <div className="flex-1 min-w-0">
                <p className={`font-extrabold ${active ? 'text-white' : 'text-white/65'}`}>{item.name}</p>
                <p className="text-xs text-white/35">{item.min.toLocaleString()} XP</p>
              </div>
              {active && <span className="metric-label text-accent">Current</span>}
            </div>
          )
        })}
      </div>

      <div className="mt-5">
        <div className="flex justify-between metric-label mb-2">
          <span>{rank.current.name}</span>
          <span>{rank.next?.name || 'Complete'}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${rank.progress * 100}%` }} />
        </div>
      </div>
    </DetailShell>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
      <p className="metric-label">{label}</p>
      <p className="text-lg font-extrabold mt-1 truncate">{value}</p>
    </div>
  )
}
