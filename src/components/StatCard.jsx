export default function StatCard({ label, value, sub, icon, accent = '#7c5cff' }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      {icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `${accent}22`, color: accent, boxShadow: `0 0 18px ${accent}33` }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">{label}</div>
        <div className="text-lg font-bold leading-tight">{value}</div>
        {sub && <div className="text-[11px] text-white/40 truncate">{sub}</div>}
      </div>
    </div>
  )
}
