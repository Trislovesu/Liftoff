const CACHE_KEY = 'liftit.exerciseMedia.v1'

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

function writeCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
}

function normalizeName(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getCachedExerciseMedia(exerciseName) {
  return readCache()[normalizeName(exerciseName)] || null
}

export async function warmExerciseMediaCache(exercises) {
  const key = import.meta.env.VITE_WORKOUTX_API_KEY
  if (!key || !Array.isArray(exercises) || exercises.length === 0) return readCache()

  const cache = readCache()
  const missing = exercises.filter(ex => !cache[normalizeName(ex.name)]).slice(0, 12)
  if (missing.length === 0) return cache

  await Promise.allSettled(missing.map(async ex => {
    const params = new URLSearchParams({ search: ex.name })
    const res = await fetch(`https://api.workoutxapp.com/v1/exercises?${params.toString()}`, {
      headers: { 'X-WorkoutX-Key': key }
    })
    if (!res.ok) return
    const data = await res.json()
    const item = Array.isArray(data) ? data[0] : data?.data?.[0]
    const gifUrl = item?.gifUrl || item?.gif_url || item?.animationUrl || item?.imageUrl
    if (!gifUrl) return
    cache[normalizeName(ex.name)] = {
      gifUrl,
      source: 'WorkoutX',
      updatedAt: new Date().toISOString()
    }
  }))

  writeCache(cache)
  return cache
}
