import { getCachedExerciseMedia } from '../lib/exerciseMedia.js'

const MUSCLE_POSE = {
  Chest: 'bench',
  Back: 'pull',
  Shoulders: 'press',
  Biceps: 'curl',
  Triceps: 'press',
  Forearms: 'grip',
  Abs: 'core',
  Quads: 'squat',
  Hamstrings: 'hinge',
  Glutes: 'hinge',
  Calves: 'raise'
}

export default function ExerciseThumb({ exercise, size = 'md', className = '' }) {
  const media = getCachedExerciseMedia(exercise?.name)
  const dims = size === 'lg' ? 'w-20 h-20 rounded-3xl' : size === 'sm' ? 'w-11 h-11 rounded-2xl' : 'w-14 h-14 rounded-2xl'

  if (media?.gifUrl) {
    return (
      <img
        src={media.gifUrl}
        alt=""
        className={`${dims} object-cover bg-white shrink-0 ${className}`}
        loading="lazy"
      />
    )
  }

  const pose = MUSCLE_POSE[exercise?.primaryMuscle] || 'lift'

  return (
    <div className={`${dims} bg-white/95 flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      <div className={`exercise-stick exercise-stick-${pose}`} aria-hidden="true">
        <span className="head" />
        <span className="body" />
        <span className="arm arm-left" />
        <span className="arm arm-right" />
        <span className="leg leg-left" />
        <span className="leg leg-right" />
        <span className="bar" />
      </div>
    </div>
  )
}
