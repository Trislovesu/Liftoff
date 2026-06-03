import { muscleProgress } from '../lib/xp.js'
import { statusForLevel } from '../data/muscles.js'
import XPProgressBar from './XPProgressBar.jsx'

export default function MuscleProgressBar({ muscle, height = 10, showLabel = true }) {
  const { need, progress } = muscleProgress(muscle)
  const status = statusForLevel(muscle.level)
  return (
    <XPProgressBar
      value={progress}
      color={status.color}
      height={height}
      label={showLabel ? `Level ${muscle.level}` : undefined}
      sub={showLabel ? `${muscle.xp} / ${need} XP` : undefined}
    />
  )
}
