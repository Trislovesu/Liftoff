import { Routes, Route, useLocation } from 'react-router-dom'
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
import WorkoutHistoryDetail from './pages/WorkoutHistoryDetail.jsx'
import Login from './pages/Login.jsx'
import AppTopBar from './components/AppTopBar.jsx'
import SignupOnboarding from './components/SignupOnboarding.jsx'

export default function App() {
  const { state } = useApp()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-bg-900 bg-hero-grad">
      {state.status === 'authed' && !state.user?.needsOnboarding && <AppTopBar user={state.user} />}
      <div className={`max-w-md mx-auto px-5 pb-28 ${state.status === 'authed' ? 'pt-20' : 'pt-0'}`}>
        {state.status === 'loading' && (
          <div className="min-h-[60vh] flex items-center justify-center text-white/40 text-sm">
            Loading…
          </div>
        )}

        {state.status === 'unauthed' && <Login />}

        {state.status === 'authed' && state.user?.needsOnboarding && <SignupOnboarding />}

        {state.status === 'authed' && !state.user?.needsOnboarding && (
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
              <Route path="/history/:id" element={<WorkoutHistoryDetail />} />
            </Routes>
          </motion.div>
        )}
      </div>
      {state.status === 'authed' && !state.user?.needsOnboarding && <BottomNav />}
    </div>
  )
}
