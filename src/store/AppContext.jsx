import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { createInitialMuscles } from '../data/muscles.js'
import { EXERCISE_BY_ID } from '../data/exerciseLibrary.js'
import { applyMuscleXP, xpForSet, WORKOUT_COMPLETION_BONUS, PUMP_PIC_BONUS } from '../lib/xp.js'
import { todayKey, daysBetween, startOfWeek } from '../lib/dates.js'
import { broadcastLeaderboardUpdate, rpcLogin, rpcSignup, rpcSaveState } from '../lib/supabase.js'

const AppCtx = createContext(null)

const SESSION_KEY = 'liftit.session.v1'
const LOCAL_KEY   = 'liftit.local.v1'

function cid() { return 'id_' + Math.random().toString(36).slice(2, 10) }

const sampleWorkouts = () => ([
  { id: 'w-push', name: 'Push Day', targetMuscles: ['Chest','Triceps','Shoulders'],
    exercises: [
      { id: cid(), libraryId: 'incline-smith-press', name: 'Incline Smith Press', primaryMuscle: 'Chest',   secondaryMuscles: ['Shoulders','Triceps'], sets: 4, reps: 8,  weight: 60 },
      { id: cid(), libraryId: 'flat-db-press',       name: 'Flat Dumbbell Press', primaryMuscle: 'Chest',   secondaryMuscles: ['Shoulders','Triceps'], sets: 3, reps: 10, weight: 25 },
      { id: cid(), libraryId: 'pec-deck',            name: 'Pec Deck',            primaryMuscle: 'Chest',   secondaryMuscles: ['Shoulders'],           sets: 3, reps: 12, weight: 50 },
      { id: cid(), libraryId: 'tricep-pushdown',     name: 'Tricep Pushdown',     primaryMuscle: 'Triceps', secondaryMuscles: [],                      sets: 3, reps: 12, weight: 30 }
    ] },
  { id: 'w-pull', name: 'Pull Day', targetMuscles: ['Back','Biceps'],
    exercises: [
      { id: cid(), libraryId: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscle: 'Back',   secondaryMuscles: ['Biceps'], sets: 4, reps: 10, weight: 55 },
      { id: cid(), libraryId: 'barbell-row',  name: 'Barbell Row',  primaryMuscle: 'Back',   secondaryMuscles: ['Biceps','Forearms'], sets: 4, reps: 8, weight: 70 },
      { id: cid(), libraryId: 'barbell-curl', name: 'Barbell Curl', primaryMuscle: 'Biceps', secondaryMuscles: ['Forearms'], sets: 3, reps: 10, weight: 30 }
    ] },
  { id: 'w-legs', name: 'Leg Day', targetMuscles: ['Quads','Hamstrings','Glutes','Calves'],
    exercises: [
      { id: cid(), libraryId: 'back-squat',        name: 'Back Squat',        primaryMuscle: 'Quads',      secondaryMuscles: ['Glutes','Hamstrings'], sets: 4, reps: 8, weight: 100 },
      { id: cid(), libraryId: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'Hamstrings', secondaryMuscles: ['Glutes','Back'],       sets: 4, reps: 8, weight: 90 },
      { id: cid(), libraryId: 'calf-raise',        name: 'Standing Calf Raise', primaryMuscle: 'Calves',   secondaryMuscles: [],                    sets: 4, reps: 15, weight: 60 }
    ] }
])

function loadLocalFor(username) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY); if (!raw) return null
    return JSON.parse(raw)[username] || null
  } catch { return null }
}
function saveLocalFor(username, slice) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[username] = slice
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all))
  } catch {}
}
function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null } }
function saveSession(s) { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY) }

function rolloverWeekIfNeeded(user) {
  const cur = startOfWeek().toISOString()
  if (user.weekStart !== cur) return { ...user, weekStart: cur, weeklyXP: 0 }
  return user
}
function updateStreak(user) {
  const today = todayKey()
  if (!user.lastWorkoutDate) return { ...user, streak: 1, lastWorkoutDate: today }
  if (user.lastWorkoutDate === today) return user
  const diff = daysBetween(user.lastWorkoutDate, today)
  return { ...user, streak: diff === 1 ? user.streak + 1 : 1, lastWorkoutDate: today }
}

function initialState() {
  return { status: 'loading', session: null, user: null, workouts: [], history: [] }
}

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT_UNAUTHED':
      return { ...state, status: 'unauthed', session: null, user: null, workouts: [], history: [] }

    case 'AUTH_SUCCESS': {
      const local = loadLocalFor(action.user.username) || { workouts: sampleWorkouts(), history: [] }
      const user = rolloverWeekIfNeeded(action.user)
      // Backfill totalWorkouts from local history for older users
      if (!user.totalWorkouts && local.history?.length) user.totalWorkouts = local.history.length
      if (action.isNew) user.needsOnboarding = true
      return { status: 'authed', session: action.session, user, workouts: local.workouts, history: local.history }
    }

    case 'SIGN_OUT':
      return { ...state, status: 'unauthed', session: null, user: null, workouts: [], history: [] }

    case 'SAVE_WORKOUT': {
      const w = action.workout
      const existing = state.workouts.findIndex(x => x.id === w.id)
      const next = [...state.workouts]
      if (existing >= 0) next[existing] = w; else next.unshift(w)
      return { ...state, workouts: next }
    }

    case 'DELETE_WORKOUT':
      return { ...state, workouts: state.workouts.filter(w => w.id !== action.id) }

    case 'LOG_WORKOUT': {
      const { workoutId, loggedExercises, durationSec, pumpPicBonus } = action
      const workout = state.workouts.find(w => w.id === workoutId)
      if (!workout) return state

      let user = rolloverWeekIfNeeded(state.user)
      user = updateStreak(user)

      const muscleGain = {}
      const add = (m, n) => { muscleGain[m] = (muscleGain[m] || 0) + n }
      const newPBs      = { ...user.personalBests }
      const newSessions = { ...(user.lastSessions || {}) }
      let workoutXP = 0
      const exerciseSummaries = []

      for (const ex of loggedExercises) {
        const lib = ex.libraryId ? EXERCISE_BY_ID[ex.libraryId] : null
        const primary = ex.primaryMuscle || lib?.primaryMuscle
        const secondary = ex.secondaryMuscles || lib?.secondaryMuscles || []
        const pbKey = ex.libraryId || ex.name
        let exXP = 0
        let topSet = null

        for (const set of ex.sets) {
          if (!set.completed) continue
          const pb = newPBs[pbKey] || { weight: 0, reps: 0 }
          const isPR = Number(set.weight) > pb.weight ||
                       (Number(set.weight) === pb.weight && Number(set.reps) > pb.reps)
          const setXP = xpForSet({ reps: Number(set.reps), weight: Number(set.weight), isPR })
          exXP += setXP
          if (isPR) newPBs[pbKey] = { weight: Number(set.weight) || 0, reps: Number(set.reps) || 0 }
          // Track the heaviest completed set of this session
          if (!topSet || Number(set.weight) > topSet.weight ||
              (Number(set.weight) === topSet.weight && Number(set.reps) > topSet.reps)) {
            topSet = { weight: Number(set.weight) || 0, reps: Number(set.reps) || 0 }
          }
        }
        if (topSet) newSessions[pbKey] = { ...topSet, date: new Date().toISOString() }

        workoutXP += exXP
        if (primary) add(primary, Math.round(exXP * 0.7))
        for (const m of secondary) add(m, Math.round(exXP * 0.15))
        exerciseSummaries.push({
          name: ex.name, xp: exXP, primaryMuscle: primary,
          libraryId: ex.libraryId, sets: ex.sets.filter(s => s.completed).map(s => ({
            weight: Number(s.weight) || 0, reps: Number(s.reps) || 0
          }))
        })
      }

      const completionBonus = WORKOUT_COMPLETION_BONUS
      const picBonus = pumpPicBonus ? PUMP_PIC_BONUS : 0
      const totalXP = workoutXP + completionBonus + picBonus

      const muscles = user.muscles.map(m => muscleGain[m.name] ? applyMuscleXP(m, muscleGain[m.name]) : m)

      user = {
        ...user, muscles, personalBests: newPBs, lastSessions: newSessions,
        totalXP: user.totalXP + totalXP,
        weeklyXP: user.weeklyXP + totalXP,
        totalWorkouts: (user.totalWorkouts || 0) + 1
      }

      const entry = {
        id: cid(), workoutId, workoutName: workout.name,
        date: new Date().toISOString(), durationSec: durationSec || 0,
        xp: totalXP, completionBonus, pumpPicBonus: picBonus,
        exercises: exerciseSummaries, muscleGain
      }

      return { ...state, user, history: [entry, ...state.history].slice(0, 200) }
    }

    case 'PATCH_USER':
      return { ...state, user: { ...state.user, ...action.patch } }

    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const saveTimer = useRef(null)
  const lastSaved = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = loadSession()
      if (!s) { dispatch({ type: 'BOOT_UNAUTHED' }); return }
      const local = loadLocalFor(s.username)
      const userCache = local?.userCache
      if (!userCache) { saveSession(null); dispatch({ type: 'BOOT_UNAUTHED' }); return }
      if (cancelled) return
      dispatch({ type: 'AUTH_SUCCESS', session: s, user: userCache })
      try {
        const fresh = await rpcSaveState(s.username, s.pin_hash, userCache)
        if (!cancelled) dispatch({ type: 'PATCH_USER', patch: rpcUserToClient(fresh) })
      } catch {
        saveSession(null)
        if (!cancelled) dispatch({ type: 'BOOT_UNAUTHED' })
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (state.status !== 'authed' || !state.user) return
    saveLocalFor(state.user.username, {
      workouts: state.workouts, history: state.history, userCache: state.user
    })
  }, [state.workouts, state.history, state.user, state.status])

  useEffect(() => {
    if (state.status !== 'authed' || !state.session || !state.user) return
    if (lastSaved.current === state.user) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await rpcSaveState(state.session.username, state.session.pin_hash, state.user)
        await broadcastLeaderboardUpdate()
        lastSaved.current = state.user
      } catch (e) { console.warn('Cloud sync failed:', e.message) }
    }, 1200)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [state.user, state.session, state.status])

  const signup = useCallback(async (username, pin) => {
    const { user, pin_hash } = await rpcSignup(username, pin, createInitialMuscles())
    const session = { username: user.username, pin_hash }
    saveSession(session)
    dispatch({ type: 'AUTH_SUCCESS', session, user: rpcUserToClient(user), isNew: true })
  }, [])

  const login = useCallback(async (username, pin) => {
    const { user, pin_hash } = await rpcLogin(username, pin)
    const session = { username: user.username, pin_hash }
    saveSession(session)
    dispatch({ type: 'AUTH_SUCCESS', session, user: rpcUserToClient(user) })
  }, [])

  const signOut = useCallback(() => { saveSession(null); dispatch({ type: 'SIGN_OUT' }) }, [])

  const setProfilePic = useCallback((url) => {
    dispatch({ type: 'PATCH_USER', patch: { profilePicUrl: url } })
  }, [])

  const setTrainingLocation = useCallback((gymType) => {
    dispatch({ type: 'PATCH_USER', patch: { gymType } })
  }, [])

  const completeOnboarding = useCallback((patch = {}) => {
    dispatch({ type: 'PATCH_USER', patch: { ...patch, needsOnboarding: false } })
  }, [])

  const value = useMemo(() => ({
    state, dispatch,
    actions: {
      signup, login, signOut, setProfilePic, setTrainingLocation, completeOnboarding,
      saveWorkout: (w) => dispatch({ type: 'SAVE_WORKOUT', workout: w }),
      deleteWorkout: (id) => dispatch({ type: 'DELETE_WORKOUT', id }),
      logWorkout: ({ workoutId, loggedExercises, durationSec, pumpPicBonus }) =>
        dispatch({ type: 'LOG_WORKOUT', workoutId, loggedExercises, durationSec, pumpPicBonus })
    }
  }), [state, signup, login, signOut, setProfilePic, setTrainingLocation, completeOnboarding])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

function rpcUserToClient(row) {
  return {
    username: row.username,
    totalXP: row.total_xp ?? 0,
    weeklyXP: row.weekly_xp ?? 0,
    weekStart: row.week_start ?? startOfWeek().toISOString(),
    streak: row.streak ?? 0,
    lastWorkoutDate: row.last_workout_date ?? null,
    muscles: (row.muscles && row.muscles.length) ? row.muscles : createInitialMuscles(),
    personalBests: row.personal_bests ?? {},
    lastSessions: row.last_sessions ?? {},
    totalWorkouts: row.total_workouts ?? 0,
    profilePicUrl: row.profile_pic_url ?? null,
    gymType: row.gym_type ?? null
  }
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

export { cid }
