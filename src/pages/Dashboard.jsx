import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'
import { levelFromXP } from '../lib/xp.js'
import XPProgressBar from '../components/XPProgressBar.jsx'
import StatCard from '../components/StatCard.jsx'
import RankCard from '../components/RankCard.jsx'
import MuscleCard from '../components/MuscleCard.jsx'
import Avatar from '../components/Avatar.jsx'

export default function Dashboard() {
  const { state } = useApp()
  const { user, history } = state
  const lvl = levelFromXP(user.totalXP)
  const recent = history.slice(0, 3)
  const topMuscles = [...user.muscles]
    .sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp)).slice(0, 4)

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="card-grad p-5 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <Avatar user={user} size={48} ring="#888888" />
          <div className="min-w-0">
            <div className="text-xs text-white/50 font-semibold">Welcome back</div>
            <div className="text-xl font-extrabold truncate">{user.username}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Level</div>
            <div className="text-2xl font-extrabold text-accent leading-none">{lvl.level}</div>
          </div>
        </div>
        <XPProgressBar value={lvl.progress} color="#888888"
          label={`${user.totalXP.toLocaleString()} XP`}
          sub={`${(lvl.xpForLevel - lvl.xpIntoLevel).toLocaleString()} to Level ${lvl.level + 1}`} />
      </motion.div>

      <RankCard totalXP={user.totalXP} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Workouts" value={user.totalWorkouts || 0} sub="lifetime"  accent="#aaaaaa" icon="🏋️" />
        <StatCard label="Weekly XP" value={user.weeklyXP.toLocaleString()} sub="this week" accent="#38e1b0" icon="⚡" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/workouts" className="btn-primary justify-center text-base py-3">▶  Start Workout</Link>
        <Link to="/workouts/new" className="btn-ghost justify-center text-base py-3">＋ Create</Link>
        <Link to="/body" className="btn-ghost justify-center text-base py-3">💪 Body Map</Link>
        <Link to="/leaderboard" className="btn-ghost justify-center text-base py-3">🏆 Leaderboard</Link>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Recent Workouts</h2>
        </div>
        {recent.length === 0 ? (
          <div className="card p-5 text-center text-white/50 text-sm">
            No workouts yet. Tap <span className="text-accent font-semibold">Start Workout</span> to begin.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(h => (
              <Link key={h.id} to={`/history/${h.id}`} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">🏋️</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{h.workoutName}</div>
                  <div className="text-xs text-white/40">
                    {new Date(h.date).toLocaleDateString()} • {h.exercises.length} exercises
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40">XP</div>
                  <div className="font-extrabold text-xp">+{h.xp}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Muscle Progress</h2>
          <Link to="/body" className="text-xs text-accent font-semibold">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {topMuscles.map(m => <MuscleCard key={m.name} muscle={m} />)}
        </div>
      </section>
    </div>
  )
}
