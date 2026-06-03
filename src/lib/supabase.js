import { createClient } from '@supabase/supabase-js'

// Public anon key — safe to commit. All real auth is enforced by the
// SECURITY DEFINER RPCs in supabase/schema.sql.
const SUPABASE_URL = 'https://hvadkwejztulqonqprmr.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YWRrd2VqenR1bHFvbnFwcm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDIwNDEsImV4cCI6MjA5NjAxODA0MX0.WhA3o2QPoRYVpChBOovA0PPA_vB_3iD5gl6OccJ4vqw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
})

// Web Crypto SHA-256 hashing — no extra deps.
// PIN is salted with a constant app secret so identical PINs across users
// don't collide and so the DB hash isn't a generic rainbow-table target.
const SALT = 'liftit::v1'

export async function hashPin(pin) {
  const data = new TextEncoder().encode(`${SALT}::${pin}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function rpcSignup(username, pin, initialMuscles) {
  const pin_hash = await hashPin(pin)
  const { data, error } = await supabase.rpc('app_signup', {
    p_username: username,
    p_pin_hash: pin_hash,
    p_initial_muscles: initialMuscles
  })
  if (error) throw new Error(error.message)
  return { user: data, pin_hash }
}

export async function rpcLogin(username, pin) {
  const pin_hash = await hashPin(pin)
  const { data, error } = await supabase.rpc('app_login', {
    p_username: username,
    p_pin_hash: pin_hash
  })
  if (error) throw new Error(error.message)
  return { user: data, pin_hash }
}

export async function rpcSaveState(username, pin_hash, state) {
  const { data, error } = await supabase.rpc('app_save_state', {
    p_username: username,
    p_pin_hash: pin_hash,
    p_state: state
  })
  if (error) throw new Error(error.message)
  return data
}

export async function rpcLeaderboard() {
  const { data, error } = await supabase.rpc('app_leaderboard')
  if (error) throw new Error(error.message)
  return data || []
}
