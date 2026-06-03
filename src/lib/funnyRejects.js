const OLD_PHOTO_LINES = [
  "That photo is older than my last cut. Take a new one bro 📸",
  "Image is old. What you doing bro? 🤨",
  "Nice throwback. Now take a fresh pic of THIS workout.",
  "Bruh that photo is from a different mesocycle. Try again.",
  "This pic is dustier than the squat rack at planet fitness. Retake.",
  "Time machine called — wants its photo back. Snap a new one.",
  "I see you. This is from before. Take a new one champ.",
  "That pump faded weeks ago. Get a fresh one in the mirror.",
  "Old photo detected. Did you really just pump or nah? 🤔",
  "Sus. Photo too old. Hit a quick flex and try again."
]

const NEW_PHOTO_COMPLIMENTS = [
  'Looking jacked.',
  'Built different.',
  'Pump status: insane.',
  'Mass moving up.',
  'Veins out, ego intact.',
  'Whole body lit.',
  'Sleeves crying.',
  'No skip days here.',
  'That mind-muscle hits.',
  'Locked in.',
  'Aesthetic.',
  'Mode: engaged.'
]

export function funnyOldPhotoReject(ageMs) {
  const hours = Math.floor(ageMs / 3600000)
  const tag = hours > 24 ? `(${Math.floor(hours / 24)}d old)` : `(${hours}h old)`
  const line = OLD_PHOTO_LINES[Math.floor(Math.random() * OLD_PHOTO_LINES.length)]
  return `${line} ${tag}`
}

export function randomCompliment() {
  return NEW_PHOTO_COMPLIMENTS[Math.floor(Math.random() * NEW_PHOTO_COMPLIMENTS.length)]
}

// Used as the subtle "encouragement" line under each exercise in the logger.
export function lastTimeNudge(prevWeight, prevReps) {
  if (!prevWeight && !prevReps) return null
  const noWeight = !prevWeight
  if (noWeight) return `Last time: ${prevReps} reps`
  return `Last: ${prevWeight}lbs × ${prevReps}`
}
