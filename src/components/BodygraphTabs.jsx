// Pill tabs row. Only Bodygraph + Gallery are real tabs now.
const TABS = ['Bodygraph', 'Gallery']

export default function BodygraphTabs({ active = 'Bodygraph', onChange }) {
  return (
    <div className="flex gap-2 pb-3">
      {TABS.map(t => {
        const isActive = active === t
        return (
          <button key={t} onClick={() => onChange?.(t)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              isActive ? 'bg-accent text-white shadow-glow'
                       : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}>
            {t}
          </button>
        )
      })}
    </div>
  )
}
