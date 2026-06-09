import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EXERCISE_LIBRARY } from '../src/data/exerciseLibrary.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const sourceRoot = path.resolve(process.argv[2] || '')
const sourceExercises = path.join(sourceRoot, 'exercises')
const outputDir = path.join(root, 'public', 'assets', 'exercises')

const OVERRIDES = {
  'flat-barbell-bench': 'Barbell_Bench_Press_-_Medium_Grip',
  'incline-barbell-bench': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'decline-barbell-bench': 'Decline_Barbell_Bench_Press',
  'incline-smith-press': 'Smith_Machine_Incline_Bench_Press',
  'flat-db-press': 'Dumbbell_Bench_Press',
  'incline-db-press': 'Incline_Dumbbell_Press',
  'db-fly': 'Dumbbell_Flyes',
  'cable-fly': 'Cable_Crossover',
  'pec-deck': 'Butterfly',
  'pushup': 'Pushups',
  'dips-chest': 'Dips_-_Chest_Version',
  'machine-chest-press': 'Machine_Bench_Press',
  deadlift: 'Barbell_Deadlift',
  'rack-pull': 'Rack_Pulls',
  pullup: 'Pullups',
  chinup: 'Chin-Up',
  'lat-pulldown': 'Wide-Grip_Lat_Pulldown',
  'barbell-row': 'Bent_Over_Barbell_Row',
  'tbar-row': 'T-Bar_Row_with_Handle',
  'db-row': 'One-Arm_Dumbbell_Row',
  'seated-cable-row': 'Seated_Cable_Rows',
  'face-pull': 'Face_Pull',
  shrugs: 'Barbell_Shrug',
  'straight-arm-pulldown': 'Straight-Arm_Pulldown',
  'overhead-press': 'Standing_Military_Press',
  'db-shoulder-press': 'Standing_Dumbbell_Press',
  'machine-shoulder-press': 'Machine_Shoulder_Military_Press',
  'arnold-press': 'Arnold_Dumbbell_Press',
  'lateral-raise': 'Side_Lateral_Raise',
  'cable-lateral-raise': 'One-Arm_Side_Laterals',
  'front-raise': 'Standing_Dumbbell_Straight-Arm_Front_Delt_Raise_Above_Head',
  'rear-pec-deck': 'Reverse_Machine_Flyes',
  'upright-row': 'Upright_Barbell_Row',
  'barbell-curl': 'Barbell_Curl',
  'db-curl': 'Dumbbell_Bicep_Curl',
  'hammer-curl': 'Hammer_Curls',
  'preacher-curl': 'Preacher_Curl',
  'concentration-curl': 'Concentration_Curls',
  'cable-curl': 'Standing_Biceps_Cable_Curl',
  'incline-db-curl': 'Alternate_Incline_Dumbbell_Curl',
  'tricep-pushdown': 'Triceps_Pushdown',
  'overhead-rope-extension': 'Cable_Rope_Overhead_Triceps_Extension',
  'skull-crusher': 'Lying_Triceps_Press',
  'close-grip-bench': 'Close-Grip_Barbell_Bench_Press',
  'dips-triceps': 'Bench_Dips',
  'tricep-kickback': 'Tricep_Dumbbell_Kickback',
  'single-arm-cable-extension': 'Cable_One_Arm_Tricep_Extension',
  'wrist-curl': 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench',
  'reverse-wrist-curl': 'Palms-Down_Wrist_Curl_Over_A_Bench',
  'farmers-walk': 'Farmers_Walk',
  'reverse-curl': 'Reverse_Barbell_Curl',
  plank: 'Plank',
  'hanging-leg-raise': 'Hanging_Leg_Raise',
  'cable-crunch': 'Cable_Crunch',
  crunch: 'Crunches',
  situp: 'Sit-Up',
  'ab-wheel': 'Ab_Roller',
  'russian-twist': 'Russian_Twist',
  'bicycle-crunch': 'Air_Bike',
  'back-squat': 'Barbell_Squat',
  'front-squat': 'Front_Barbell_Squat',
  'leg-press': 'Leg_Press',
  'hack-squat': 'Barbell_Hack_Squat',
  'leg-extension': 'Leg_Extensions',
  lunge: 'Barbell_Walking_Lunge',
  'bulgarian-split-squat': 'Split_Squat_with_Dumbbells',
  'goblet-squat': 'Goblet_Squat',
  'romanian-deadlift': 'Romanian_Deadlift',
  'stiff-leg-deadlift': 'Stiff-Legged_Barbell_Deadlift',
  'leg-curl': 'Lying_Leg_Curls',
  'seated-leg-curl': 'Seated_Leg_Curl',
  'good-morning': 'Good_Morning',
  'hip-thrust': 'Barbell_Hip_Thrust',
  'glute-bridge': 'Barbell_Glute_Bridge',
  'glute-ham-raise': 'Glute_Ham_Raise',
  'cable-kickback': 'One-Legged_Cable_Kickback',
  'sumo-deadlift': 'Sumo_Deadlift',
  'sumo-squat': 'Sumo_Squat',
  'calf-raise': 'Standing_Calf_Raises',
  'seated-calf-raise': 'Barbell_Seated_Calf_Raise',
  'calf-press': 'Calf_Press'
}

function titleToFolder(name = '') {
  return name
    .replace(/&/g, 'And')
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function findSourceImage(exercise) {
  const candidates = [
    OVERRIDES[exercise.id],
    titleToFolder(exercise.name),
    titleToFolder(exercise.name.replace(/^Flat /i, '')),
    titleToFolder(exercise.name.replace(/^Back /i, 'Barbell '))
  ].filter(Boolean)

  for (const folder of [...new Set(candidates)]) {
    for (const fileName of ['0.gif', '1.gif', '0.jpg', '1.jpg', '0.png', '1.png']) {
      const filePath = path.join(sourceExercises, folder, fileName)
      if (await exists(filePath)) return { filePath, folder, ext: path.extname(fileName).toLowerCase() }
    }
  }
  return null
}

async function main() {
  if (!sourceRoot || !(await exists(sourceExercises))) {
    throw new Error(`Usage: node scripts/fetch-gifs.mjs <path-to-free-exercise-db>. Could not find ${sourceExercises}`)
  }

  await fs.mkdir(outputDir, { recursive: true })

  const copied = []
  const missed = []

  for (const exercise of EXERCISE_LIBRARY) {
    const source = await findSourceImage(exercise)
    if (!source) {
      missed.push(`${exercise.id} (${exercise.name})`)
      continue
    }
    const outPath = path.join(outputDir, `${exercise.id}${source.ext}`)
    await fs.copyFile(source.filePath, outPath)
    copied.push(`${exercise.id}${source.ext} <- ${source.folder}`)
  }

  console.log(`Copied ${copied.length} exercise demo image(s) to ${outputDir}`)
  for (const line of copied) console.log(`  OK  ${line}`)
  if (missed.length) {
    console.log(`\nMissing ${missed.length} exercise(s):`)
    for (const line of missed) console.log(`  --  ${line}`)
  }
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
