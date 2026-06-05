import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Avatar from '../components/Avatar.jsx'
import VerifiedName from '../components/VerifiedName.jsx'
import { BIG_THREE_LIFTS } from '../store/AppContext.jsx'
import { levelFromXP, rankFor } from '../lib/xp.js'
import { rpcPublicProfile } from '../lib/supabase.js'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let dead = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await rpcPublicProfile(username)
        if (!dead) setProfile(toClientProfile(data))
      } catch (e) {
        if (!dead) setError(e.message || 'Profile not found')
      } finally {
        if (!dead) setLoading(false)
      }
    })()
    return () => { dead = true }
  }, [username])

  if (loading) return <div><Header title="Profile" back="/leaderboard" /><div className="card p-6 text-center text-white/45">Loading profile...</div></div>
  if (error) return <div><Header title="Profile" back="/leaderboard" /><div className="card p-6 text-center text-danger">{error}</div></div>

  const rank = rankFor(profile.totalXP).current
  const lvl = levelFromXP(profile.totalXP).level

  return (
    <div>
      <Header title={profile.username} back="/leaderboard" />

      <div className="card-grad p-5 mb-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <Avatar user={profile} size={64} ring={rank.color} />
          <div className="min-w-0 flex-1">
            <VerifiedName user={profile} className="font-extrabold text-2xl" />
            <div className="text-xs mt-1" style={{ color: rank.color }}>{rank.name} · Lv {lvl}</div>
            <div className="text-xs text-white/40 mt-1">{(profile.totalWorkouts || 0).toLocaleString()} workouts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Total XP" value={(profile.totalXP || 0).toLocaleString()} />
        <Stat label="Weekly" value={(profile.weeklyXP || 0).toLocaleString()} />
        <Stat label="Weight" value={profile.bodyWeightLbs ? `${profile.bodyWeightLbs}` : '--'} sub={profile.bodyWeightLbs ? 'lbs' : ''} />
      </div>
      {profile.bodyWeightUpdatedAt && <div className="text-xs text-white/35 -mt-2 mb-4 text-center">Body weight changed {timeAgo(profile.bodyWeightUpdatedAt)}</div>}

      <FeaturedPrGrid prs={profile.featuredPRs || {}} />

      <section className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Public Workouts</h2>
            <div className="text-xs text-white/35">{profile.publicWorkouts.length} visible routines</div>
          </div>
        </div>
        <div className="space-y-3">
          {profile.publicWorkouts.map(workout => (
            <div key={workout.id} className="bg-bg-950/45 border border-white/10 rounded-2xl p-3">
              <div className="font-extrabold text-lg mb-2">{workout.name}</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(workout.targetMuscles || []).map(m => <span key={m} className="chip">{m}</span>)}
              </div>
              <div className="space-y-1.5">
                {(workout.exercises || []).slice(0, 5).map((ex, idx) => (
                  <div key={`${ex.name}-${idx}`} className="flex items-center justify-between text-xs bg-white/[0.03] rounded-xl px-3 py-2">
                    <span className="font-semibold truncate">{ex.name}</span>
                    <span className="text-white/45 shrink-0">{ex.sets}x{ex.reps} · {ex.weight || 0} lbs</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {profile.publicWorkouts.length === 0 && <div className="text-sm text-white/40 text-center py-5">No public routines yet.</div>}
        </div>
      </section>
    </div>
  )
}

function toClientProfile(row) {
  return {
    username: row.username,
    totalXP: row.total_xp ?? 0,
    weeklyXP: row.weekly_xp ?? 0,
    totalWorkouts: row.total_workouts ?? 0,
    profilePicUrl: row.profile_pic_url ?? null,
    zionVerified: row.zion_verified ?? false,
    bodyWeightLbs: row.body_weight_lbs ?? null,
    bodyWeightUpdatedAt: row.body_weight_updated_at ?? null,
    featuredPRs: row.featured_pr && !row.featured_pr.workoutId ? row.featured_pr : {},
    publicWorkouts: row.public_workouts ?? []
  }
}

function FeaturedPrGrid({ prs }) {
  const items = BIG_THREE_LIFTS.map(lift => ({ lift, pr: prs[lift.key] })).filter(item => item.pr)
  if (items.length === 0) return (
    <div className="glass-card p-4 mb-4">
      <div className="metric-label text-accent mb-1">Featured PRs</div>
      <div className="text-sm text-white/45">No featured PR yet.</div>
    </div>
  )
  return <div className="space-y-3 mb-4">{items.map(({ lift, pr }) => <FeaturedPrCard key={lift.key} pr={pr} />)}</div>
}

function FeaturedPrCard({ pr }) {
  const style = prStyle(pr.intensity)
  return (
    <div className={`glass-card p-4 mb-4 relative overflow-hidden ${style.className}`}>
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={style.bg} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="metric-label text-accent mb-1">Featured PR</div>
            <div className="font-extrabold text-xl">{pr.liftName || pr.workoutName}</div>
            <div className="text-xs text-white/45">{pr.exerciseName} · {timeAgo(pr.date)}</div>
          </div>
          {pr.tag && <span className="px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs font-extrabold">{pr.tag}</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Weight" value={`${pr.weight}`} sub="lbs" />
          <Stat label="Reps" value={pr.reps} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</div>
      <div className="text-lg font-extrabold mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-white/35">{sub}</div>}
    </div>
  )
}

function prStyle(intensity) {
  if (intensity === 'legend') return {
    className: 'border-accent/70 shadow-[0_0_36px_rgba(255,0,51,0.35)] animate-pulse',
    bg: { background: 'radial-gradient(circle at top right, rgba(255,0,51,0.35), transparent 45%)' }
  }
  if (intensity === 'heavy') return {
    className: 'border-orange-400/60 shadow-[0_0_28px_rgba(251,146,60,0.24)]',
    bg: { background: 'linear-gradient(135deg, rgba(251,146,60,0.18), transparent)' }
  }
  if (intensity === 'strong') return {
    className: 'border-teal-300/50 shadow-[0_0_22px_rgba(45,212,191,0.16)]',
    bg: { background: 'linear-gradient(135deg, rgba(45,212,191,0.14), transparent)' }
  }
  return {
    className: 'border-white/10',
    bg: { background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)' }
  }
}

function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.max(0, Math.floor(diff / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
