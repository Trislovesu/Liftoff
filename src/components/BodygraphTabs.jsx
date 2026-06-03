// Pill tabs row. Only "Bodygraph" is wired up — the rest are visual placeholders
// matching the reference, so the screen reads as part of a larger feature.
const TABS = ['Bodygraph', 'Leagues', 'Gallery', 'Analytics']

export default function BodygraphTabs({ active = 'Bodygraph', onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
      {TABS.map(t => {
        const isActive = active === t
        return (
          <button
            key={t}
            onClick={() => onChange?.(t)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              isActive
                ? 'bg-accent text-white shadow-glow'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}
