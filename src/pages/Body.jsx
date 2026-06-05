import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import BodyHeaderStats from '../components/BodyHeaderStats.jsx'
import BodygraphTabs from '../components/BodygraphTabs.jsx'
import FrontBackBodyMap from '../components/FrontBackBodyMap.jsx'
import MuscleRankings from '../components/MuscleRankings.jsx'
import Gallery from './Gallery.jsx'

export default function Body() {
  const { state } = useApp()
  const muscles = state.user.muscles
  const musclesByName = useMemo(() => Object.fromEntries(muscles.map(m => [m.name, m])), [muscles])
  const initialFeatured = useMemo(() => {
    const sorted = [...muscles].sort((a, b) => (b.level - a.level) || (b.xp - a.xp))
    return sorted[0]?.name ?? muscles[0]?.name
  }, [muscles])

  const [selectedName, setSelectedName] = useState(initialFeatured)
  const [tab, setTab] = useState('Bodygraph')

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-1/2 top-28 z-40 w-[120%] -translate-x-1/2 -rotate-12">
        <div className="border-y border-white/25 bg-accent/90 py-3 text-center shadow-[0_0_24px_rgba(255,0,51,0.38)]">
          <span className="font-extrabold uppercase tracking-[0.38em] text-white">Coming Soon</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-30 bg-bg-900/35 backdrop-blur-[1px]" />
      <BodyHeaderStats user={state.user} />
      <BodygraphTabs active={tab} onChange={setTab} />

      {tab === 'Bodygraph' && (
        <>
          <FrontBackBodyMap
            musclesByName={musclesByName}
            selectedName={selectedName}
            onSelect={setSelectedName}
          />
          <MuscleRankings
            muscles={muscles}
            featuredName={selectedName}
            onFeature={setSelectedName}
          />
        </>
      )}

      {tab === 'Gallery' && <Gallery />}
    </div>
  )
}
