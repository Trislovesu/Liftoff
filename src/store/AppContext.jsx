import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadState, saveState, clearState } from '../lib/storage.js'
import { createInitialMuscles } from '../data/muscles.js'
import { EXERCISE_BY_ID } from '../data/exerciseLibrary.js'
import { applyMuscleXP, xpForSet, workoutStreakBonus } from '../lib/xp.js'
import { todayKey, daysBetween, startOfWeek } from '../lib/dates.js'

const AppCtx = createContext(null)

const sampleWorkouts = [
  {
    id: 'w-push',
    name: 'Push Day',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
    exercises: [
      { id: cid(), libraryId: 'incline-smith-press', name: 'Incline Smith Press', primaryMuscle: 'Chest', secondaryMuscles: ['Shoulders','Triceps'], sets: 4, reps: 8,  weight: 60 },
      { id: cid(), libraryId: 'flat-db-press',       name: 'Flat Dumbbell Press', primaryMuscle: 'Chest', secondaryMuscles: ['Shoulders','Triceps'], sets: 3, reps: 10, weight: 25 },
      { id: cid(), libraryId: 'pec-deck',            name: 'Pec Deck',            primaryMuscle: 'Chest', secondaryMuscles: ['Shoulders'],           sets: 3, reps: 12, weight: 50 },
      { id: cid(), libraryId: 'tricep-pushdown',     name: 'Tricep Pushdown',     primaryMuscle: 'Triceps', secondaryMuscles: [],                    sets: 3, reps: 12, weight: 30 },
      { id: cid(), libraryId: 'overhead-rope-extension', name: 'Overhead Rope Extension', primaryMuscle: 'Triceps', secondaryMuscles: [],            sets: 3, reps: 12, weight: 20 }
    ]
  },
  {
    id: 'w-pull',
    name: 'Pull Day',
    targetMuscles: ['Back', 'Biceps'],
    exercises: [
      { id: cid(), libraryId: 'lat-pulldown',     name: 'Lat Pulldown',     primaryMuscle: 'Back', secondaryMuscles: ['Biceps'], sets: 4, reps: 10, weight: 55 },
      { id: cid(), libraryId: 'barbell-row',      name: 'Barbell Row',      primaryMuscle: 'Back', secondaryMuscles: ['Biceps','Forearms'], sets: 4, reps: 8, weight: 70 },
      { id: cid(), libraryId: 'seated-cable-row', name: 'Seated Cable Row', primaryMuscle: 'Back', secondaryMuscles: ['Biceps'], sets: 3, reps: 12, weight: 50 },
      { id: cid(), libraryId: 'barbell-curl',     name: 'Barbell Curl',     primaryMuscle: 'Biceps', secondaryMuscles: ['Forearms'], sets: 3, reps: 10, weight: 30 },
      { id: cid(), libraryId: 'hammer-curl',      name: 'Hammer Curl',      primaryMuscle: 'Biceps', secondaryMuscles: ['Forearms'], sets: 3, reps: 12, weight: 15 }
    ]
  },
  {
    id: 'w-legs',
    name: 'Leg Day',
    targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    exercises: [
      { id: cid(), libraryId: 'back-squat',        name: 'Back Squat',        primaryMuscle: 'Quads',      secondaryMuscles: ['Glutes','Hamstrings'], sets: 4, reps: 8, weight: 100 },
      { id: cid(), libraryId: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'Hamstrings', secondaryMuscles: ['Glutes','Back'],       sets: 4, reps: 8, weight: 90 },
      { id: cid(), libraryId: 'hip-thrust',        name: 'Hip Thrust',        primaryMuscle: 'Glutes',     secondaryMuscles: ['Hamstrings'],          sets: 3, reps: 10, weight: 80 },
      { id: cid(), libraryId: 'leg-curl',          name: 'Leg Curl',          primaryMuscle: 'Hamstrings', secondaryMuscles: [],                      sets: 3, reps: 12, weight: 40 },
      { id: cid(), libraryId: 'calf-raise',        name: 'Standing Calf Raise', primaryMuscle: 'Calves',   secondaryMuscles: [],                      sets: 4, reps: 15, weight: 60 }
    ]
  }
]

function cid() { return 'id_' + Math.random().toString(36).slice(2, 10) }

function defaultState() {
  return {
    user: {
      username: 'Tristan',
      totalXP: 0,
      weeklyXP: 0,
      weekStart: startOfWeek().toISOString(),
      streak: 0,
      lastWorkoutDate: null,
      muscles: createInitialMuscles(),
      personalBests: {}, // { exerciseKey: { weight, reps } }
      createdAt: new Date().toISOString()
    },
    workouts: sampleWorkouts,
    history: []
  }
}

function rolloverWeekIfNeeded(user) {
  const currentWeekStart = startOfWeek().toISOString()
  if (user.weekStart !== currentWeekStart) {
    return { ...user, weekStart: currentWeekStart, weeklyXP: 0 }
  }
  return user
}

function updateStreak(user) {
  const today = todayKey()
  if (!user.lastWorkoutDate) return { ...user, streak: 1, lastWorkoutDate: today }
  if (user.lastWorkoutDate === today) return user
  const diff = daysBetween(user.lastWorkoutDate, today)
  const streak = diff === 1 ? user.streak + 1 : 1
  return { ...user, streak, lastWorkoutDate: today }
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'SAVE_WORKOUT': {
      const w = action.workout
      const existing = state.workouts.findIndex(x => x.id === w.id)
      const next = [...state.workouts]
      if (existing >= 0) next[existing] = w
      else next.unshift(w)
      return { ...state, workouts: next }
    }

    case 'DELETE_WORKOUT':
      return { ...state, workouts: state.workouts.filter(w => w.id !== action.id) }

    case 'LOG_WORKOUT': {
      const { workoutId, loggedExercises, durationSec } = action
      const workout = state.workouts.find(w => w.id === workoutId)
      if (!workout) return state

      let user = rolloverWeekIfNeeded(state.user)
      user = updateStreak(user)

      // muscle XP accumulator
      const muscleGain = {}
      const addMuscle = (name, amt) => { muscleGain[name] = (muscleGain[name] || 0) + amt }

      const newPBs = { ...user.personalBests }
      let workoutXP = 0
      const exerciseSummaries = []

      for (const ex of loggedExercises) {
        const lib = ex.libraryId ? EXERCISE_BY_ID[ex.libraryId] : null
        const primary = ex.primaryMuscle || lib?.primaryMuscle
        const secondary = ex.secondaryMuscles || lib?.secondaryMuscles || []
        let exXP = 0
        for (const set of ex.sets) {
          if (!set.completed) continue
          const pbKey = ex.libraryId || ex.name
          const pb = newPBs[pbKey] || { weight: 0, reps: 0 }
          const isPR =
            Number(set.weight) > pb.weight ||
            (Number(set.weight) === pb.weight && Number(set.reps) > pb.reps)
          const setXP = xpForSet({ reps: Number(set.reps), weight: Number(set.weight), isPR })
          exXP += setXP
          if (isPR) newPBs[pbKey] = { weight: Number(set.weight) || 0, reps: Number(set.reps) || 0 }
        }
        workoutXP += exXP
        if (primary) addMuscle(primary, Math.round(exXP * 0.7))
        for (const m of secondary) addMuscle(m, Math.round(exXP * 0.15))
        exerciseSummaries.push({ name: ex.name, xp: exXP, primaryMuscle: primary })
      }

      const streakBonus = workoutStreakBonus(user.streak)
      const totalXP = workoutXP + streakBonus

      // apply muscle XP
      const muscles = user.muscles.map(m =>
        muscleGain[m.name] ? applyMuscleXP(m, muscleGain[m.name]) : m
      )

      user = {
        ...user,
        muscles,
        personalBests: newPBs,
        totalXP: user.totalXP + totalXP,
        weeklyXP: user.weeklyXP + totalXP
      }

      const entry = {
        id: cid(),
        workoutId,
        workoutName: workout.name,
        date: new Date().toISOString(),
        durationSec: durationSec || 0,
        xp: totalXP,
        streakBonus,
        exercises: exerciseSummaries,
        muscleGain
      }

      return { ...state, user, history: [entry, ...state.history].slice(0, 200) }
    }

    case 'UPDATE_USERNAME':
      return { ...state, user: { ...state.user, username: action.username } }

    case 'RESET':
      return defaultState()

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() || defaultState())

  useEffect(() => { saveState(state) }, [state])

  // Roll over weekly XP on mount if needed
  useEffect(() => {
    const fresh = rolloverWeekIfNeeded(state.user)
    if (fresh !== state.user) dispatch({ type: 'HYDRATE', state: { ...state, user: fresh } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(() => ({
    state,
    dispatch,
    actions: {
      saveWorkout: (w) => dispatch({ type: 'SAVE_WORKOUT', workout: w }),
      deleteWorkout: (id) => dispatch({ type: 'DELETE_WORKOUT', id }),
      logWorkout: ({ workoutId, loggedExercises, durationSec }) =>
        dispatch({ type: 'LOG_WORKOUT', workoutId, loggedExercises, durationSec }),
      updateUsername: (username) => dispatch({ type: 'UPDATE_USERNAME', username }),
      reset: () => { clearState(); dispatch({ type: 'RESET' }) }
    }
  }), [state])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

export { cid }
