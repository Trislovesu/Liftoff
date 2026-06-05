import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: 'dashboard' },
  { to: '/workouts', label: 'Log', icon: 'add_circle' },
  { to: '/body', label: 'Body', icon: 'fitness_center', disabled: true },
  { to: '/leaderboard', label: 'Ranks', icon: 'analytics' },
  { to: '/profile', label: 'Profile', icon: 'person' }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-md mx-auto h-16 pointer-events-auto bg-bg-950/85 backdrop-blur-2xl border-t border-white/10 rounded-t-xl shadow-[0_-4px_20px_rgba(255,0,51,0.10)] flex items-center justify-around px-4">
        {items.map(item => (
          item.disabled ? (
            <button
              key={item.to}
              type="button"
              disabled
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-white/20 cursor-not-allowed overflow-hidden"
              aria-label={`${item.label} disabled`}
            >
              <span className="absolute left-1/2 top-1/2 w-20 -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-accent/90 text-white text-[7px] font-extrabold tracking-[0.16em] py-0.5 shadow-[0_0_10px_rgba(255,0,51,0.45)]">COMING SOON</span>
              <span className="material-symbols-outlined text-[22px] leading-none">{item.icon}</span>
              <span className="uppercase tracking-[0.12em]">{item.label}</span>
            </button>
          ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all active:scale-90 ${
                isActive
                  ? 'text-accent drop-shadow-[0_0_8px_rgba(255,0,51,0.55)]'
                  : 'text-white/45 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px] leading-none">{item.icon}</span>
            <span className="uppercase tracking-[0.12em]">{item.label}</span>
          </NavLink>
          )
        ))}
      </div>
    </nav>
  )
}
