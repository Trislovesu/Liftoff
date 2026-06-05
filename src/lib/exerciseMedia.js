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
  return readCache()
}
