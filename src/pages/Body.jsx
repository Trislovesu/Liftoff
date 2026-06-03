import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import BodyHeaderStats from '../components/BodyHeaderStats.jsx'
import BodygraphTabs from '../components/BodygraphTabs.jsx'
import FrontBackBodyMap from '../components/FrontBackBodyMap.jsx'
import MuscleRankings from '../components/MuscleRankings.jsx'

export default function Body() {
  const { state } = useApp()
  const muscles = state.user.muscles
  const musclesByName = useMemo(
    () => Object.fromEntries(muscles.map(m => [m.name, m])),
    [muscles]
  )

  // Feature the strongest muscle by default; user can tap any zone or row to swap.
  const initialFeatured = useMemo(() => {
    const sorted = [...muscles].sort((a, b) => (b.level - a.level) || (b.xp - a.xp))
    return sorted[0]?.name ?? muscles[0]?.name
  }, [muscles])

  const [selectedName, setSelectedName] = useState(initialFeatured)
  const [tab, setTab] = useState('Bodygraph')

  return (
    <div>
      <BodyHeaderStats user={state.user} />
      <BodygraphTabs active={tab} onChange={setTab} />

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
    </div>
  )
}
