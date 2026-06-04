import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'

export default function AppTopBar({ user }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-bg-900/75 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-md mx-auto h-14 px-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 active:scale-[0.98] transition">
          <Avatar user={user} size={32} ring="#ff0033" />
          <span className="font-extrabold tracking-tight text-accent text-xl leading-none">LIFTIT</span>
        </Link>
        <button className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-accent active:scale-95 transition">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
      </div>
    </header>
  )
}
