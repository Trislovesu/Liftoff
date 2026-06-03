import { levelFromXP } from '../lib/xp.js'

// Compact top status row: avatar with progress ring, level + XP, streak,
// weekly XP, info icon. Mirrors the reference's top bar.
export default function BodyHeaderStats({ user }) {
  const lvl = levelFromXP(user.totalXP)
  const ringCircumference = 2 * Math.PI * 22
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Avatar with progress ring */}
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
          <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="22" fill="none"
            stroke="#7c5cff" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${lvl.progress * ringCircumference} ${ringCircumference}`}
          />
        </svg>
        <div className="absolute inset-1.5 rounded-full bg-accent/30 border border-accent/40 flex items-center justify-center font-extrabold text-sm shadow-glow">
          {user.username[0]?.toUpperCase()}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-sm font-extrabold leading-none">Lv.{lvl.level}</div>
        <div className="text-[10px] text-white/40 mt-1 font-semibold">
          {user.totalXP.toLocaleString()} XP
        </div>
      </div>

      <div className="flex-1" />

      <Pill icon="🔥" value={user.streak} accent="#ff8a3d" />
      <Pill icon="💎" value={user.weeklyXP.toLocaleString()} accent="#7ee8ff" />

      <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 text-sm font-bold">
        ?
      </button>
    </div>
  )
}

function Pill({ icon, value, accent }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"
      style={{ boxShadow: `0 0 12px ${accent}22` }}
    >
      <span style={{ color: accent }}>{icon}</span>
      <span className="font-bold text-sm">{value}</span>
    </div>
  )
}
