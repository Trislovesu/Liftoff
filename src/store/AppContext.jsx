import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { createInitialMuscles } from '../data/muscles.js'
import { EXERCISE_BY_ID } from '../data/exerciseLibrary.js'
import { applyMuscleXP, xpForSet, workoutStreakBonus } from '../lib/xp.js'
import { todayKey, daysBetween, startOfWeek } from '../lib/dates.js'
import { rpcLogin, rpcSignup, rpcSaveState } from '../lib/supabase.js'

const AppCtx = createContext(null)

const SESSION_KEY = 'liftit.session.v1'   // { username, pin_hash }
const LOCAL_KEY   = 'liftit.local.v1'     // per-user local cache: workouts, history

function cid() { return 'id_' + Math.random().toString(36).slice(2, 10) }

const sampleWorkouts = () => ([
  {
    id: 'w-push',
    name: 'Push Day',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
    exercises: [
      { id: cid(), libraryId: 'incline-smith-press', name: 'Incline Smith Press', primaryMuscle: 'Chest',   secondaryMuscles: ['Shoulders','Triceps'], sets: 4, reps: 8,  weight: 60 },
      { id: cid(), libraryId: 'flat-db-press',       name: 'Flat Dumbbell Press', primaryMuscle: 'Chest',   secondaryMuscles: ['Shoulders','Triceps'], sets: 3, reps: 10, weight: 25 },
      { id: cid(), libraryId: 'pec-deck',            name: 'Pec Deck',            primaryMuscle: 'Chest',   secondaryMuscles: ['Shoulders'],           sets: 3, reps: 12, weight: 50 },
      { id: cid(), libraryId: 'tricep-pushdown',     name: 'Tricep Pushdown',     primaryMuscle: 'Triceps', secondaryMuscles: [],                       sets: 3, reps: 12, weight: 30 },
      { id: cid(), libraryId: 'overhead-rope-extension', name: 'Overhead Rope Extension', primaryMuscle: 'Triceps', secondaryMuscles: [],              sets: 3, reps: 12, weight: 20 }
    ]
  },
  {
    id: 'w-pull',
    name: 'Pull Day',
    targetMuscles: ['Back', 'Biceps'],
    exercises: [
      { id: cid(), libraryId: 'lat-pulldown',     name: 'Lat Pulldown',     primaryMuscle: 'Back',   secondaryMuscles: ['Biceps'],            sets: 4, reps: 10, weight: 55 },
      { id: cid(), libraryId: 'barbell-row',      name: 'Barbell Row',      primaryMuscle: 'Back',   secondaryMuscles: ['Biceps','Forearms'], sets: 4, reps: 8,  weight: 70 },
      { id: cid(), libraryId: 'seated-cable-row', name: 'Seated Cable Row', primaryMuscle: 'Back',   secondaryMuscles: ['Biceps'],            sets: 3, reps: 12, weight: 50 },
      { id: cid(), libraryId: 'barbell-curl',     name: 'Barbell Curl',     primaryMuscle: 'Biceps', secondaryMuscles: ['Forearms'],          sets: 3, reps: 10, weight: 30 },
      { id: cid(), libraryId: 'hammer-curl',      name: 'Hammer Curl',      primaryMuscle: 'Biceps', secondaryMuscles: ['Forearms'],          sets: 3, reps: 12, weight: 15 }
    ]
  },
  {
    id: 'w-legs',
    name: 'Leg Day',
    targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    exercises: [
      { id: cid(), libraryId: 'back-squat',        name: 'Back Squat',          primaryMuscle: 'Quads',      secondaryMuscles: ['Glutes','Hamstrings'], sets: 4, reps: 8,  weight: 100 },
      { id: cid(), libraryId: 'romanian-deadlift', name: 'Romanian Deadlift',   primaryMuscle: 'Hamstrings', secondaryMuscles: ['Glutes','Back'],       sets: 4, reps: 8,  weight: 90 },
      { id: cid(), libraryId: 'hip-thrust',        name: 'Hip Thrust',          primaryMuscle: 'Glutes',     secondaryMuscles: ['Hamstrings'],          sets: 3, reps: 10, weight: 80 },
      { id: cid(), libraryId: 'leg-curl',          name: 'Leg Curl',            primaryMuscle: 'Hamstrings', secondaryMuscles: [],                      sets: 3, reps: 12, weight: 40 },
      { id: cid(), libraryId: 'calf-raise',        name: 'Standing Calf Raise', primaryMuscle: 'Calves',     secondaryMuscles: [],                      sets: 4, reps: 15, weight: 60 }
    ]
  }
])

function emptyUser(username) {
  return {
    username,
    totalXP: 0,
    weeklyXP: 0,
    weekStart: startOfWeek().toISOString(),
    streak: 0,
    lastWorkoutDate: null,
    muscles: createInitialMuscles(),
    personalBests: {}
  }
}

// Local cache only stores per-user workouts + history (not synced to cloud yet).
function loadLocalFor(username) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const all = JSON.parse(raw)
    return all[username] || null
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
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
function saveSession(s) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  else localStorage.removeItem(SESSION_KEY)
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

// State shape:
//   status: 'loading' | 'unauthed' | 'authed'
//   session: { username, pin_hash } | null
//   user:    cloud-synced profile
//   workouts, history: local per-user
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
      return {
        status: 'authed',
        session: action.session,
        user,
        workouts: local.workouts,
        history: local.history
      }
    }

    case 'SIGN_OUT':
      return { ...state, status: 'unauthed', session: null, user: null, workouts: [], history: [] }

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

    case 'PATCH_USER':
      return { ...state, user: { ...state.user, ...action.patch } }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const saveTimer = useRef(null)
  const lastSaved = useRef(null)

  // Boot: if there's a session, log in silently. Otherwise show login.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = loadSession()
      if (!s) { dispatch({ type: 'BOOT_UNAUTHED' }); return }
      try {
        // Re-login uses the cached pin_hash via a thin RPC: easier to just call app_login
        // by treating pin_hash as a sentinel — but app_login expects pin (plain). So we
        // call save with no-op state to verify? Simpler: trust cached session, then
        // refresh the user on next save. To be safe, hit app_login with a flag in code:
        // We instead fetch via app_save_state with the current (unchanged) state — but
        // we don't have the state yet. So: we expose a "rehydrate" via app_save_state
        // by sending an empty patch — but easier: call app_login through a helper that
        // accepts the already-hashed pin. We'll keep it pragmatic: store username + hash
        // and call app_save_state with the locally-cached user as the truth source.
        const local = loadLocalFor(s.username)
        const userCache = local?.userCache
        if (userCache) {
          // Optimistic: hydrate from cache, then immediately sync to server.
          if (cancelled) return
          dispatch({ type: 'AUTH_SUCCESS', session: s, user: userCache })
          // fire-and-forget refresh
          try {
            const fresh = await rpcSaveState(s.username, s.pin_hash, userCache)
            if (!cancelled) dispatch({ type: 'PATCH_USER', patch: rpcUserToClient(fresh) })
          } catch (e) {
            // bad pin_hash etc — drop session
            saveSession(null)
            if (!cancelled) dispatch({ type: 'BOOT_UNAUTHED' })
          }
        } else {
          // No cache — sign user out and let them log in fresh
          saveSession(null)
          dispatch({ type: 'BOOT_UNAUTHED' })
        }
      } catch {
        if (!cancelled) dispatch({ type: 'BOOT_UNAUTHED' })
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Persist local slice (workouts/history) + user cache whenever state changes.
  useEffect(() => {
    if (state.status !== 'authed' || !state.user) return
    saveLocalFor(state.user.username, {
      workouts: state.workouts,
      history: state.history,
      userCache: state.user
    })
  }, [state.workouts, state.history, state.user, state.status])

  // Debounced cloud sync of user profile.
  useEffect(() => {
    if (state.status !== 'authed' || !state.session || !state.user) return
    if (lastSaved.current === state.user) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const fresh = await rpcSaveState(state.session.username, state.session.pin_hash, state.user)
        lastSaved.current = state.user
        // Don't dispatch — would loop. Server values match what we sent.
      } catch (e) {
        console.warn('Cloud sync failed:', e.message)
      }
    }, 1200)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [state.user, state.session, state.status])

  const signup = useCallback(async (username, pin) => {
    const { user, pin_hash } = await rpcSignup(username, pin, createInitialMuscles())
    const session = { username: user.username, pin_hash }
    saveSession(session)
    dispatch({ type: 'AUTH_SUCCESS', session, user: rpcUserToClient(user) })
  }, [])

  const login = useCallback(async (username, pin) => {
    const { user, pin_hash } = await rpcLogin(username, pin)
    const session = { username: user.username, pin_hash }
    saveSession(session)
    dispatch({ type: 'AUTH_SUCCESS', session, user: rpcUserToClient(user) })
  }, [])

  const signOut = useCallback(() => {
    saveSession(null)
    dispatch({ type: 'SIGN_OUT' })
  }, [])

  const value = useMemo(() => ({
    state,
    dispatch,
    actions: {
      signup, login, signOut,
      saveWorkout: (w) => dispatch({ type: 'SAVE_WORKOUT', workout: w }),
      deleteWorkout: (id) => dispatch({ type: 'DELETE_WORKOUT', id }),
      logWorkout: ({ workoutId, loggedExercises, durationSec }) =>
        dispatch({ type: 'LOG_WORKOUT', workoutId, loggedExercises, durationSec })
    }
  }), [state, signup, login, signOut])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

// Map DB row (snake_case) → client shape (camelCase) used by the UI.
function rpcUserToClient(row) {
  return {
    username: row.username,
    totalXP: row.total_xp ?? 0,
    weeklyXP: row.weekly_xp ?? 0,
    weekStart: row.week_start ?? startOfWeek().toISOString(),
    streak: row.streak ?? 0,
    lastWorkoutDate: row.last_workout_date ?? null,
    muscles: (row.muscles && row.muscles.length) ? row.muscles : createInitialMuscles(),
    personalBests: row.personal_bests ?? {}
  }
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

export { cid }
