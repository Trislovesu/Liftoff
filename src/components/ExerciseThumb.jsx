import { useEffect, useMemo, useState } from 'react'
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

function normalizeAssetPath(path) {
  if (!path) return null
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const clean = String(path).replace(/^\.?\//, '')
  return `${import.meta.env.BASE_URL || './'}${clean}`
}

function slugifyExerciseName(name = '') {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function exerciseGifSources(exercise) {
  const id = exercise?.id || exercise?.libraryId
  const nameSlug = slugifyExerciseName(exercise?.name)
  const paths = [
    exercise?.gif,
    exercise?.gifUrl,
    id ? `assets/exercises/${id}.gif` : null,
    id ? `assets/exercises/${id}.jpg` : null,
    id ? `assets/exercises/${id}.png` : null,
    nameSlug ? `assets/exercises/${nameSlug}.gif` : null,
    nameSlug ? `assets/exercises/${nameSlug}.jpg` : null,
    nameSlug ? `assets/exercises/${nameSlug}.png` : null
  ]
  return [...new Set(paths.map(normalizeAssetPath).filter(Boolean))]
}

export function ExerciseGifImage({ exercise, className = '', fallback = null, objectFit = 'cover' }) {
  const sources = useMemo(() => exerciseGifSources(exercise), [exercise])
  const [sourceIndex, setSourceIndex] = useState(0)
  const src = sources[sourceIndex]

  useEffect(() => {
    setSourceIndex(0)
  }, [sources.join('|')])

  if (!src) return fallback

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      style={{ objectFit }}
      onError={() => setSourceIndex(i => i + 1)}
    />
  )
}

export default function ExerciseThumb({ exercise, size = 'md', className = '' }) {
  const media = getCachedExerciseMedia(exercise?.name)
  const dims = size === 'log' ? 'log-ex-thumb' : size === 'lg' ? 'w-20 h-20 rounded-3xl' : size === 'sm' ? 'w-11 h-11 rounded-2xl' : 'w-14 h-14 rounded-2xl'
  const gifExercise = media?.gifUrl ? { ...exercise, gifUrl: media.gifUrl } : exercise
  const fallback = exercise?.emoji ? (
    <div className={`${dims} log-ex-thumb-fallback flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      <span aria-hidden="true">{exercise.emoji}</span>
    </div>
  ) : (
    <FallbackPose exercise={exercise} dims={dims} className={className} />
  )

  return (
    <ExerciseGifImage
      exercise={gifExercise}
      className={`${dims} bg-white shrink-0 ${className}`}
      fallback={fallback}
    />
  )
}

function FallbackPose({ exercise, dims, className }) {
  const pose = MUSCLE_POSE[exercise?.primaryMuscle] || 'lift'

  return (
    <div className={`${dims} log-ex-thumb-fallback flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
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
