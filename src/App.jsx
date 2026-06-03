import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Workouts from './pages/Workouts.jsx'
import WorkoutBuilder from './pages/WorkoutBuilder.jsx'
import WorkoutLogger from './pages/WorkoutLogger.jsx'
import BodyMap from './pages/BodyMap.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import ExerciseAbout from './pages/ExerciseAbout.jsx'
import Profile from './pages/Profile.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-bg-900 bg-hero-grad">
      <div className="max-w-md mx-auto px-4 pt-6 pb-28">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/new" element={<WorkoutBuilder />} />
          <Route path="/workouts/:id/edit" element={<WorkoutBuilder />} />
          <Route path="/workouts/:id/log" element={<WorkoutLogger />} />
          <Route path="/body" element={<BodyMap />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/exercise/:id" element={<ExerciseAbout />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
