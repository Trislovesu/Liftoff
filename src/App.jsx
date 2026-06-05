import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from './store/AppContext.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Workouts from './pages/Workouts.jsx'
import WorkoutBuilder from './pages/WorkoutBuilder.jsx'
import WorkoutLogger from './pages/WorkoutLogger.jsx'
import Body from './pages/Body.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import ExerciseAbout from './pages/ExerciseAbout.jsx'
import Profile from './pages/Profile.jsx'
import PublicProfile from './pages/PublicProfile.jsx'
import WorkoutHistoryDetail from './pages/WorkoutHistoryDetail.jsx'
import Login from './pages/Login.jsx'
import AppTopBar from './components/AppTopBar.jsx'
import SignupOnboarding from './components/SignupOnboarding.jsx'

export default function App() {
  const { state, dispatch } = useApp()
  const location = useLocation()
  const showIntro = state.status === 'authed' && state.intro === 'dianna'

  return (
    <div className="min-h-screen bg-bg-900 bg-hero-grad">
      {state.status === 'authed' && !state.user?.needsOnboarding && !showIntro && <AppTopBar user={state.user} />}
      <div className={`max-w-md mx-auto px-5 pb-28 ${state.status === 'authed' && !showIntro ? 'pt-20' : 'pt-0'}`}>
        {state.status === 'loading' && (
          <div className="min-h-[60vh] flex items-center justify-center text-white/40 text-sm">
            Loading…
          </div>
        )}

        {state.status === 'unauthed' && <Login />}

        {showIntro && <DiannaIntro onDone={() => dispatch({ type: 'DISMISS_INTRO' })} />}

        {state.status === 'authed' && state.user?.needsOnboarding && !showIntro && <SignupOnboarding />}

        {state.status === 'authed' && !state.user?.needsOnboarding && !showIntro && (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/workouts/new" element={<WorkoutBuilder />} />
              <Route path="/workouts/:id/edit" element={<WorkoutBuilder />} />
              <Route path="/workouts/:id/log" element={<WorkoutLogger />} />
              <Route path="/body" element={<Body />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/exercise/:id" element={<ExerciseAbout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/u/:username" element={<PublicProfile />} />
              <Route path="/history/:id" element={<WorkoutHistoryDetail />} />
            </Routes>
          </motion.div>
        )}
      </div>
      {state.status === 'authed' && !state.user?.needsOnboarding && !showIntro && <BottomNav />}
    </div>
  )
}

function DiannaIntro({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2600)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="mesh-gradient" />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 text-center"
      >
        <motion.div
          initial={{ scale: 0.7, rotate: -8 }}
          animate={{ scale: [0.7, 1.08, 1], rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mx-auto mb-6 w-28 h-28 rounded-[2rem] bg-accent/10 border border-accent/35 flex items-center justify-center shadow-[0_0_50px_rgba(255,0,51,0.28)]"
        >
          <motion.span
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl text-accent drop-shadow-[0_0_18px_rgba(255,0,51,0.8)]"
          >
            ♥
          </motion.span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="metric-label text-accent mb-2"
        >
          Welcome Dianna
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.5 }}
          className="text-3xl font-extrabold tracking-tight"
        >
          hello my beatiful helper
        </motion.h1>
      </motion.div>
    </div>
  )
}
