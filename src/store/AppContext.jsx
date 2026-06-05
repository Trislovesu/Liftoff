import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { createInitialMuscles } from '../data/muscles.js'
import { EXERCISE_BY_ID } from '../data/exerciseLibrary.js'
import { applyMuscleXP, xpForSet, WORKOUT_COMPLETION_BONUS, PUMP_PIC_BONUS } from '../lib/xp.js'
import { todayKey, daysBetween, startOfWeek } from '../lib/dates.js'
import { broadcastLeaderboardUpdate, rpcLogin, rpcSignup, rpcSaveState } from '../lib/supabase.js'

const AppCtx = createContext(null)

const SESSION_KEY = 'liftit.session.v1'
const LOCAL_KEY   = 'liftit.local.v1'

export const BIG_THREE_LIFTS = [
  { key: 'bench', label: 'Bench Press', match: /bench press/i },
  { key: 'squat', label: 'Squat', match: /squat/i },
  { key: 'deadlift', label: 'Deadlift', match: /deadlift/i }
]

function cid() { return 'id_' + Math.random().toString(36).slice(2, 10) }

function publicWorkoutsFrom(workouts = []) {
  return workouts
    .filter(w => w.isPublic)
    .slice(0, 30)
    .map(w => ({
      id: w.id,
      name: w.name,
      targetMuscles: w.targetMuscles || [],
      exercises: (w.exercises || []).slice(0, 20).map(ex => ({
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles || [],
        sets: Number(ex.sets) || 0,
        reps: Number(ex.reps) || 0,
        weight: Number(ex.weight) || 0
      }))
    }))
}

function topCompletedSetForLift(loggedExercises = [], lift) {
  let top = null
  for (const ex of loggedExercises) {
    if (!lift.match.test(ex.name || '')) continue
    for (const set of ex.sets || []) {
      if (!set.completed) continue
      const weight = Number(set.weight) || 0
      const reps = Number(set.reps) || 0
      const score = weight * Math.max(1, reps)
      if (!top || score > top.score) top = { exerciseName: ex.name, weight, reps, score }
    }
  }
  return top
}

function prIntensity(weight = 0, reps = 0) {
  const score = Number(weight) * Math.max(1, Number(reps))
  if (score >= 2500) return 'legend'
  if (score >= 1500) return 'heavy'
  if (score >= 750) return 'strong'
  return 'calm'
}

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
function loadSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
    localStorage.removeItem(SESSION_KEY)
    return session
  } catch { return null }
}
function saveSession(s) {
  try {
    localStorage.removeItem(SESSION_KEY)
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

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

function isDiannaProfile(username) {
  return username?.toLowerCase() === 'dianna'
}

function activeElapsed(activeWorkout) {
  if (!activeWorkout) return 0
  return Math.floor((Date.now() - activeWorkout.startedAt) / 1000)
}

function initialState() {
  return { status: 'loading', session: null, user: null, workouts: [], history: [], activeWorkout: null, intro: null }
}

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT_UNAUTHED':
      return { ...state, status: 'unauthed', session: null, user: null, workouts: [], history: [], intro: null }

    case 'AUTH_SUCCESS': {
      const local = loadLocalFor(action.user.username) || { workouts: sampleWorkouts(), history: [] }
      const user = rolloverWeekIfNeeded(action.user)
      // Backfill totalWorkouts from local history for older users
      if (!user.totalWorkouts && local.history?.length) user.totalWorkouts = local.history.length
      user.publicWorkouts = publicWorkoutsFrom(local.workouts)
      if (action.isNew) user.needsOnboarding = true
      const intro = action.justLoggedIn && isDiannaProfile(user.username) ? 'dianna' : null
      return { status: 'authed', session: action.session, user, workouts: local.workouts, history: local.history, activeWorkout: local.activeWorkout || null, intro }
    }

    case 'SIGN_OUT':
      return { ...state, status: 'unauthed', session: null, user: null, workouts: [], history: [], activeWorkout: null, intro: null }

    case 'SAVE_WORKOUT': {
      const w = { ...action.workout, isPublic: !!action.workout.isPublic }
      const existing = state.workouts.findIndex(x => x.id === w.id)
      const next = [...state.workouts]
      if (existing >= 0) next[existing] = w; else next.unshift(w)
      return { ...state, workouts: next, user: { ...state.user, publicWorkouts: publicWorkoutsFrom(next) } }
    }

    case 'DELETE_WORKOUT':
      {
        const next = state.workouts.filter(w => w.id !== action.id)
        return {
          ...state,
          workouts: next,
          user: {
            ...state.user,
            publicWorkouts: publicWorkoutsFrom(next),
            featuredPRs: state.user.featuredPRs || {}
          }
        }
      }

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

      const featuredLiftKeys = user.featuredLiftKeys || []
      if (featuredLiftKeys.length) {
        const nextPRs = { ...(user.featuredPRs || {}) }
        for (const lift of BIG_THREE_LIFTS) {
          if (!featuredLiftKeys.includes(lift.key)) continue
          const liftTop = topCompletedSetForLift(loggedExercises, lift)
          if (!liftTop) continue
          const prev = nextPRs[lift.key]
          const delta = prev ? liftTop.weight - (Number(prev.weight) || 0) : null
          if (!prev || liftTop.score >= ((Number(prev.weight) || 0) * Math.max(1, Number(prev.reps) || 0))) {
            nextPRs[lift.key] = {
              liftKey: lift.key,
              liftName: lift.label,
              exerciseName: liftTop.exerciseName,
              weight: liftTop.weight,
              reps: liftTop.reps,
              tag: prev ? (delta > 0 ? `+${delta} lbs` : '') : 'NEW',
              intensity: prIntensity(liftTop.weight, liftTop.reps),
              date: new Date().toISOString()
            }
          }
        }
        user.featuredPRs = nextPRs
      }

      const entry = {
        id: cid(), workoutId, workoutName: workout.name,
        date: new Date().toISOString(), durationSec: durationSec || 0,
        xp: totalXP, completionBonus, pumpPicBonus: picBonus,
        exercises: exerciseSummaries, muscleGain
      }

      return { ...state, user, activeWorkout: null, history: [entry, ...state.history].slice(0, 200) }
    }

    case 'START_ACTIVE_WORKOUT':
      return {
        ...state,
        activeWorkout: {
          workoutId: action.workoutId,
          logged: action.logged,
          startedAt: Date.now(),
          background: false,
          leavePrompted: false
        }
      }

    case 'PATCH_ACTIVE_WORKOUT':
      return state.activeWorkout ? { ...state, activeWorkout: { ...state.activeWorkout, ...action.patch } } : state

    case 'END_ACTIVE_WORKOUT':
      return { ...state, activeWorkout: null }

    case 'PATCH_USER':
      return { ...state, user: { ...state.user, ...action.patch } }

    case 'DISMISS_INTRO':
      return { ...state, intro: null }

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
      workouts: state.workouts, history: state.history, activeWorkout: state.activeWorkout, userCache: state.user
    })
  }, [state.workouts, state.history, state.activeWorkout, state.user, state.status])

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
    dispatch({ type: 'AUTH_SUCCESS', session, user: rpcUserToClient(user), justLoggedIn: true })
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

  const setBodyWeight = useCallback((bodyWeightLbs) => {
    const value = Number(bodyWeightLbs) || 0
    dispatch({ type: 'PATCH_USER', patch: { bodyWeightLbs: value, bodyWeightUpdatedAt: new Date().toISOString() } })
  }, [])

  const setFeaturedLiftKeys = useCallback((featuredLiftKeys) => {
    const allowed = new Set(BIG_THREE_LIFTS.map(l => l.key))
    const nextKeys = [...new Set(featuredLiftKeys.filter(key => allowed.has(key)))]
    const nextPRs = Object.fromEntries(Object.entries(state.user.featuredPRs || {}).filter(([key]) => nextKeys.includes(key)))
    dispatch({ type: 'PATCH_USER', patch: { featuredLiftKeys: nextKeys, featuredPRs: nextPRs } })
  }, [state.user])

  const setZionMemberCode = useCallback((zionMemberCode) => {
    const code = String(zionMemberCode || '').replace(/\D/g, '').slice(0, 5)
    if (code.length !== 5) throw new Error('Enter a 5 digit Zion Fitness House code')
    dispatch({ type: 'PATCH_USER', patch: { zionMemberCode: code, zionVerified: true } })
  }, [])

  const clearAdminNotice = useCallback(() => {
    dispatch({ type: 'PATCH_USER', patch: { adminNotice: null } })
  }, [])

  const value = useMemo(() => ({
    state, dispatch,
    actions: {
      signup, login, signOut, setProfilePic, setTrainingLocation, completeOnboarding, setBodyWeight, setFeaturedLiftKeys, setZionMemberCode, clearAdminNotice,
      saveWorkout: (w) => dispatch({ type: 'SAVE_WORKOUT', workout: w }),
      deleteWorkout: (id) => dispatch({ type: 'DELETE_WORKOUT', id }),
      logWorkout: ({ workoutId, loggedExercises, durationSec, pumpPicBonus }) =>
        dispatch({ type: 'LOG_WORKOUT', workoutId, loggedExercises, durationSec, pumpPicBonus }),
      startActiveWorkout: (workoutId, logged) => dispatch({ type: 'START_ACTIVE_WORKOUT', workoutId, logged }),
      patchActiveWorkout: (patch) => dispatch({ type: 'PATCH_ACTIVE_WORKOUT', patch }),
      endActiveWorkout: () => dispatch({ type: 'END_ACTIVE_WORKOUT' }),
      activeElapsed
    }
  }), [state, signup, login, signOut, setProfilePic, setTrainingLocation, completeOnboarding, setBodyWeight, setFeaturedLiftKeys, setZionMemberCode, clearAdminNotice])

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
    gymType: row.gym_type ?? null,
    bodyWeightLbs: row.body_weight_lbs ?? null,
    bodyWeightUpdatedAt: row.body_weight_updated_at ?? null,
    featuredPRs: row.featured_pr && !row.featured_pr.workoutId ? row.featured_pr : {},
    featuredLiftKeys: row.featured_pr && !row.featured_pr.workoutId ? Object.keys(row.featured_pr) : [],
    publicWorkouts: row.public_workouts ?? [],
    zionMemberCode: row.zion_member_code ?? null,
    zionVerified: row.zion_verified ?? false,
    adminNotice: row.admin_notice ?? null
  }
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

export { cid }
