import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hvadkwejztulqonqprmr.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YWRrd2VqenR1bHFvbnFwcm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDIwNDEsImV4cCI6MjA5NjAxODA0MX0.WhA3o2QPoRYVpChBOovA0PPA_vB_3iD5gl6OccJ4vqw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
})

const SALT = 'liftit::v1'
export async function hashPin(pin) {
  const data = new TextEncoder().encode(`${SALT}::${pin}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function rpcSignup(username, pin, initialMuscles) {
  const pin_hash = await hashPin(pin)
  const { data, error } = await supabase.rpc('app_signup', {
    p_username: username, p_pin_hash: pin_hash, p_initial_muscles: initialMuscles
  })
  if (error) throw new Error(error.message)
  return { user: data, pin_hash }
}

export async function rpcLogin(username, pin) {
  const pin_hash = await hashPin(pin)
  const { data, error } = await supabase.rpc('app_login', {
    p_username: username, p_pin_hash: pin_hash
  })
  if (error) throw new Error(error.message)
  return { user: data, pin_hash }
}

export async function rpcSaveState(username, pin_hash, state) {
  const { data, error } = await supabase.rpc('app_save_state', {
    p_username: username, p_pin_hash: pin_hash, p_state: state
  })
  if (error) throw new Error(error.message)
  return data
}

export async function rpcLeaderboard() {
  const { data, error } = await supabase.rpc('app_leaderboard')
  if (error) throw new Error(error.message)
  return data || []
}

export async function rpcSavePumpPhoto(username, pin_hash, { image_url, taken_at, caption, xp_bonus }) {
  const { data, error } = await supabase.rpc('app_save_pump_photo', {
    p_username: username, p_pin_hash: pin_hash,
    p_image_url: image_url, p_taken_at: taken_at, p_caption: caption, p_xp_bonus: xp_bonus
  })
  if (error) throw new Error(error.message)
  return data
}

export async function rpcGetPumpPhotos(username) {
  const { data, error } = await supabase.rpc('app_get_pump_photos', { p_username: username })
  if (error) throw new Error(error.message)
  return data || []
}

export async function rpcGetGymStatus() {
  const { data, error } = await supabase.rpc('app_get_gym_status')
  if (error) throw new Error(error.message)
  return data
}

const GYM_STATUS_CHANNEL = 'gym-status-updates'
let gymStatusChannel = null
let gymStatusChannelReady = false
const LEADERBOARD_CHANNEL = 'leaderboard-updates'
let leaderboardChannel = null
let leaderboardChannelReady = false

export function subscribeToGymStatus(onChange) {
  const channel = supabase
    .channel(GYM_STATUS_CHANNEL)
    .on('broadcast', { event: 'gym_status_updated' }, payload => onChange(payload.payload))
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'gym_status', filter: 'id=eq.1' },
      payload => onChange(payload.new)
    )
    .subscribe(status => {
      gymStatusChannelReady = status === 'SUBSCRIBED'
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[Liftit] Gym status realtime subscription failed:', status)
      }
    })

  gymStatusChannel = channel
  return () => {
    if (gymStatusChannel === channel) gymStatusChannel = null
    gymStatusChannelReady = false
    supabase.removeChannel(channel)
  }
}

export async function broadcastGymStatus(status) {
  if (!gymStatusChannel || !gymStatusChannelReady) {
    console.warn('[Liftit] Gym status broadcast skipped: realtime channel is not subscribed yet.')
    return
  }
  const result = await gymStatusChannel.send({
    type: 'broadcast',
    event: 'gym_status_updated',
    payload: status
  })
  if (result !== 'ok') console.warn('[Liftit] Gym status broadcast failed:', result)
}

export function subscribeToLeaderboardUpdates(onChange) {
  const channel = supabase
    .channel(LEADERBOARD_CHANNEL)
    .on('broadcast', { event: 'leaderboard_updated' }, () => onChange())
    .subscribe(status => {
      leaderboardChannelReady = status === 'SUBSCRIBED'
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[Liftit] Leaderboard realtime subscription failed:', status)
      }
    })

  leaderboardChannel = channel
  return () => {
    if (leaderboardChannel === channel) leaderboardChannel = null
    leaderboardChannelReady = false
    supabase.removeChannel(channel)
  }
}

export async function broadcastLeaderboardUpdate() {
  const send = channel => channel.send({
    type: 'broadcast',
    event: 'leaderboard_updated',
    payload: { at: new Date().toISOString() }
  })
  if (!leaderboardChannel || !leaderboardChannelReady) {
    const temp = supabase.channel(`${LEADERBOARD_CHANNEL}-send-${Date.now()}`)
    await new Promise(resolve => {
      temp.subscribe(async status => {
        if (status !== 'SUBSCRIBED') return
        const result = await send(temp)
        if (result !== 'ok') console.warn('[Liftit] Leaderboard broadcast failed:', result)
        await supabase.removeChannel(temp)
        resolve()
      })
      setTimeout(async () => {
        await supabase.removeChannel(temp)
        resolve()
      }, 3000)
    })
    return
  }
  const result = await send(leaderboardChannel)
  if (result !== 'ok') console.warn('[Liftit] Leaderboard broadcast failed:', result)
}

export async function rpcAdminUpdateGymStatus(username, pin_hash, status) {
  const { data, error } = await supabase.rpc('app_admin_update_gym_status', {
    p_username: username,
    p_pin_hash: pin_hash,
    p_status: status
  })
  if (error) throw new Error(error.message)
  return data
}

export async function rpcAdminListUsers(username, pin_hash) {
  const { data, error } = await supabase.rpc('app_admin_list_users', {
    p_username: username,
    p_pin_hash: pin_hash
  })
  if (error) throw new Error(error.message)
  return data || []
}

// ─── Storage helpers ───────────────────────────────────────────────────
// Public bucket "user-content" must exist (see schema.sql comments).

export async function uploadImage(file, folder, username) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg'
  const key = `${folder}/${username}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
  const { error } = await supabase.storage.from('user-content').upload(key, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg'
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('user-content').getPublicUrl(key)
  return data.publicUrl
}
