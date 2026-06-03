// Built-in exercise library used as templates and for the "About" page.
// `id` is a stable string; users can pick from these when building a workout
// or create a custom exercise (no library entry — about page will show basics).

export const EXERCISE_LIBRARY = [
  {
    id: 'incline-smith-press',
    name: 'Incline Smith Press',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    instructions: [
      'Set bench to a 30–45° incline.',
      'Unrack with elbows tucked ~45° from torso.',
      'Lower the bar under control to upper chest.',
      'Press up without harshly locking the elbows.'
    ],
    tips: [
      'Keep shoulder blades retracted and depressed.',
      'Drive feet into the floor for stability.',
      'Pause briefly at the bottom for full stretch.'
    ],
    mistakes: [
      'Flaring elbows to 90° — strains shoulders.',
      'Bouncing the bar off the chest.',
      'Setting incline too steep (becomes a shoulder press).'
    ]
  },
  {
    id: 'flat-db-press',
    name: 'Flat Dumbbell Press',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    instructions: [
      'Sit on a flat bench with dumbbells on your thighs.',
      'Kick the weights up and lie back, dumbbells at chest.',
      'Press up and slightly together at lockout.',
      'Lower under control to a deep stretch.'
    ],
    tips: ['Tuck elbows ~45°.', 'Squeeze chest at the top.'],
    mistakes: ['Bouncing weights together.', 'Half-repping.']
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders'],
    instructions: ['Sit upright, elbows on pads.', 'Squeeze pads together.', 'Return slowly to stretch.'],
    tips: ['Keep chest tall.', 'Pause 1s at peak contraction.'],
    mistakes: ['Using momentum.', 'Shrugging shoulders up.']
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    primaryMuscle: 'Triceps',
    secondaryMuscles: [],
    instructions: ['Stand at cable, rope or bar.', 'Tuck elbows at sides.', 'Press down, fully extend.'],
    tips: ['Keep elbows pinned.', 'Squeeze hard at lockout.'],
    mistakes: ['Leaning forward to cheat.', 'Letting elbows drift.']
  },
  {
    id: 'overhead-rope-extension',
    name: 'Overhead Rope Extension',
    primaryMuscle: 'Triceps',
    secondaryMuscles: [],
    instructions: ['Face away from cable, rope overhead.', 'Stretch triceps deeply.', 'Extend arms overhead.'],
    tips: ['Lean slightly forward.', 'Focus on long head stretch.'],
    mistakes: ['Flaring elbows wide.', 'Short range of motion.']
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'],
    instructions: ['Grip bar wider than shoulders.', 'Pull to upper chest.', 'Squeeze lats; control up.'],
    tips: ['Drive elbows down and back.', 'Chest up, slight lean back.'],
    mistakes: ['Using momentum.', 'Pulling behind neck.']
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    instructions: ['Hinge at hips, neutral spine.', 'Row bar to lower chest.', 'Squeeze; lower under control.'],
    tips: ['Pull with elbows, not hands.', 'Brace core hard.'],
    mistakes: ['Rounding the lower back.', 'Jerking the bar.']
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'],
    instructions: ['Sit tall, knees soft.', 'Row handle to belly.', 'Squeeze shoulder blades.'],
    tips: ['Avoid excessive lean.', 'Long stretch at the front.'],
    mistakes: ['Yanking with the lower back.']
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    instructions: ['Bar at shoulders.', 'Brace, press overhead.', 'Bar finishes over mid-foot.'],
    tips: ['Glutes tight, ribs down.'],
    mistakes: ['Excessive lower-back arch.']
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: [],
    instructions: ['Slight forward lean.', 'Raise dumbbells to shoulder height.', 'Control the descent.'],
    tips: ['Lead with elbows.', 'Pinky slightly up.'],
    mistakes: ['Using too much weight.', 'Shrugging.']
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    instructions: ['Elbows at sides.', 'Curl bar to shoulders.', 'Lower under control.'],
    tips: ['No swinging.', 'Squeeze at the top.'],
    mistakes: ['Elbows drifting forward.']
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    instructions: ['Neutral grip dumbbells.', 'Curl up, palms facing in.', 'Lower slow.'],
    tips: ['Great for brachialis.'],
    mistakes: ['Using momentum.']
  },
  {
    id: 'back-squat',
    name: 'Back Squat',
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    instructions: ['Bar on upper back.', 'Brace, descend to depth.', 'Drive up through mid-foot.'],
    tips: ['Knees track over toes.', 'Maintain neutral spine.'],
    mistakes: ['Knees caving in.']
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Back'],
    instructions: ['Hinge at hips, bar close to legs.', 'Lower to mid-shin.', 'Drive hips forward to stand.'],
    tips: ['Soft knees, long spine.'],
    mistakes: ['Squatting instead of hinging.']
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    primaryMuscle: 'Glutes',
    secondaryMuscles: ['Hamstrings'],
    instructions: ['Upper back on bench, bar over hips.', 'Drive hips up.', 'Squeeze glutes hard at top.'],
    tips: ['Chin tucked, ribs down.'],
    mistakes: ['Hyperextending lower back.']
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: [],
    instructions: ['Lie or sit on machine.', 'Curl heels toward glutes.', 'Slow eccentric.'],
    tips: ['Full range; point toes for emphasis.'],
    mistakes: ['Lifting hips off pad.']
  },
  {
    id: 'calf-raise',
    name: 'Standing Calf Raise',
    primaryMuscle: 'Calves',
    secondaryMuscles: [],
    instructions: ['Ball of foot on platform.', 'Rise as high as possible.', 'Stretch deep at the bottom.'],
    tips: ['Pause at the top, slow eccentric.'],
    mistakes: ['Half-repping.']
  },
  {
    id: 'plank',
    name: 'Plank',
    primaryMuscle: 'Abs',
    secondaryMuscles: [],
    instructions: ['Elbows under shoulders.', 'Body in a straight line.', 'Brace and breathe.'],
    tips: ['Squeeze glutes.'],
    mistakes: ['Sagging hips.']
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    primaryMuscle: 'Abs',
    secondaryMuscles: ['Forearms'],
    instructions: ['Hang from bar.', 'Raise legs to parallel or higher.', 'Lower slowly.'],
    tips: ['Avoid swinging.'],
    mistakes: ['Using momentum.']
  },
  {
    id: 'wrist-curl',
    name: 'Wrist Curl',
    primaryMuscle: 'Forearms',
    secondaryMuscles: [],
    instructions: ['Forearms on bench.', 'Curl wrists up.', 'Slow eccentric.'],
    tips: ['Full range from open hand.'],
    mistakes: ['Using too much weight.']
  }
]

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISE_LIBRARY.map(e => [e.id, e]))
