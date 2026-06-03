import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'
import { uploadImage } from '../lib/supabase.js'
import { AVATAR_EMOJI_OPTIONS } from '../components/Avatar.jsx'

export default function Login() {
  const { state, actions } = useApp()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState('auth') // 'auth' | 'avatar'

  async function submit(e) {
    e.preventDefault(); setError('')
    const u = username.trim()
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(u)) { setError('Username: 2–20 letters, numbers, or underscore.'); return }
    if (!/^\d{4,8}$/.test(pin)) { setError('PIN must be 4–8 digits.'); return }
    if (mode === 'signup' && pin !== pin2) { setError("PINs don't match."); return }
    setBusy(true)
    try {
      if (mode === 'signup') { await actions.signup(u, pin); setStep('avatar') }
      else                   { await actions.login(u, pin) }
    } catch (err) { setError(err.message || 'Something went wrong.') }
    finally { setBusy(false) }
  }

  if (step === 'avatar' && state.user) {
    return <AvatarSetup onDone={() => {/* auth flow ends; routing will move to dashboard */}} />
  }

  return (
    <div className="min-h-[80vh] flex items-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-grad p-6 w-full relative overflow-hidden">
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">💪</div>
          <h1 className="text-2xl font-extrabold">Liftit</h1>
          <p className="text-sm text-white/50">Level up your lifts.</p>
        </div>
        <div className="card p-1 flex mb-4">
          {[{ id: 'login', label: 'Log In' }, { id: 'signup', label: 'Sign Up' }].map(t => (
            <button key={t.id} onClick={() => { setMode(t.id); setError('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                mode === t.id ? 'bg-accent text-white shadow-glow' : 'text-white/60'
              }`}>{t.label}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <div className="label mb-1">Username</div>
            <input autoFocus value={username} onChange={e => setUsername(e.target.value)}
              placeholder="e.g. tristan" className="input w-full"
              autoCapitalize="off" autoCorrect="off" />
          </label>
          <label className="block">
            <div className="label mb-1">PIN (4–8 digits)</div>
            <input type="password" inputMode="numeric" value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="••••" className="input w-full tracking-widest" />
          </label>
          {mode === 'signup' && (
            <label className="block">
              <div className="label mb-1">Confirm PIN</div>
              <input type="password" inputMode="numeric" value={pin2}
                onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="••••" className="input w-full tracking-widest" />
            </label>
          )}
          {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" disabled={busy} className="btn-primary w-full text-base py-3 disabled:opacity-50">
            {busy ? '...' : (mode === 'signup' ? 'Create Account' : 'Log In')}
          </button>
        </form>
        <p className="text-[11px] text-white/30 text-center mt-4">
          PIN is hashed before leaving your device.
        </p>
      </motion.div>
    </div>
  )
}

function AvatarSetup({ onDone }) {
  const { state, actions } = useApp()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true); setErr('')
    try {
      const url = await uploadImage(f, 'avatars', state.user.username)
      actions.setProfilePic(url)
      onDone()
    } catch (e) { setErr(e.message || 'Upload failed') }
    finally { setBusy(false) }
  }

  return (
    <div className="card-grad p-6 mt-10">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">📸</div>
        <h2 className="text-xl font-extrabold">Pick a profile photo</h2>
        <p className="text-sm text-white/50">Upload one or grab an emoji. You can change it later.</p>
      </div>
      <label className="btn-primary w-full justify-center mb-3 cursor-pointer">
        {busy ? 'Uploading…' : '📤 Upload Photo'}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
      </label>
      <div className="text-xs text-white/40 text-center mb-2">— or pick an emoji —</div>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {AVATAR_EMOJI_OPTIONS.map(em => (
          <button key={em} onClick={() => { actions.setProfilePic(em); onDone() }}
            className="aspect-square text-2xl rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
            {em}
          </button>
        ))}
      </div>
      {err && <div className="text-sm text-danger mb-2">{err}</div>}
      <button onClick={onDone} className="btn-ghost w-full">Skip for now</button>
    </div>
  )
}
