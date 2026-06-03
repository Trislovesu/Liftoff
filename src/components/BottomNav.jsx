import { NavLink } from 'react-router-dom'

const items = [
  { to: '/',            label: 'Home',     icon: '🏠' },
  { to: '/workouts',    label: 'Workouts', icon: '🏋️' },
  { to: '/body',        label: 'Body',     icon: '💪' },
  { to: '/leaderboard', label: 'Ranks',    icon: '🏆' },
  { to: '/profile',     label: 'Profile',  icon: '👤' }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-2 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-bg-800/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-card flex items-center justify-around p-1.5">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                isActive
                  ? 'bg-accent/15 text-accent shadow-[0_0_18px_rgba(124,92,255,0.3)]'
                  : 'text-white/50 hover:text-white'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
