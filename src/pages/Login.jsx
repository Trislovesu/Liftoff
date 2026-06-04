import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'

export default function Login() {
  const { actions } = useApp()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    const u = username.trim()
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(u)) { setError('Username: 2-20 letters, numbers, or underscore.'); return }
    if (!/^\d{4,8}$/.test(pin)) { setError('PIN must be 4-8 digits.'); return }
    if (mode === 'signup' && pin !== pin2) { setError("PINs don't match."); return }
    setBusy(true)
    try {
      if (mode === 'signup') { await actions.signup(u, pin) }
      else { await actions.login(u, pin) }
    } catch (err) { setError(err.message || 'Something went wrong.') }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-10">
      <div className="mesh-gradient" />
      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <header className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-bg-800 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-accent opacity-10" />
            <span className="material-symbols-outlined text-5xl text-accent drop-shadow-[0_0_12px_rgba(255,0,51,0.6)]">fitness_center</span>
          </div>
          <h1 className="text-5xl font-extrabold text-accent tracking-tight leading-none">LIFTIT</h1>
          <p className="text-2xl font-bold text-white/90 mt-2">Level up your lifts</p>
        </header>

        <form onSubmit={submit} className="space-y-4">
          <div className="glass-input flex flex-col">
            <label className="metric-label mb-1">Username</label>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white/45 text-xl">person</span>
              <input
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your handle"
                className="bg-transparent border-none p-0 w-full focus:outline-none text-white text-lg placeholder:text-white/25"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
          </div>

          <div className="glass-input flex flex-col">
            <label className="metric-label mb-1">Secure PIN</label>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white/45 text-xl">lock_open</span>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="••••"
                className="bg-transparent border-none p-0 w-full focus:outline-none text-white text-3xl font-extrabold tracking-[0.35em] placeholder:text-white/25"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="glass-input flex flex-col">
              <label className="metric-label mb-1">Confirm PIN</label>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white/45 text-xl">verified_user</span>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin2}
                  onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="••••"
                  className="bg-transparent border-none p-0 w-full focus:outline-none text-white text-3xl font-extrabold tracking-[0.35em] placeholder:text-white/25"
                />
              </div>
            </div>
          )}

          {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}

          <button type="submit" disabled={busy} className="w-full h-14 bg-accent text-white font-extrabold rounded-xl shadow-[0_0_30px_rgba(255,0,51,0.35)] flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50">
            {busy ? 'WORKING' : (mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN')}
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="material-symbols-outlined text-accent text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            <p className="metric-label">PIN hashed locally</p>
          </div>
        </form>

        <footer className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <button type="button" className="metric-label hover:text-accent transition">Forgot PIN</button>
            <div className="w-1.5 h-1.5 rounded-full bg-bg-700" />
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="metric-label hover:text-accent transition"
            >
              {mode === 'login' ? 'Create account' : 'Log in'}
            </button>
          </div>
          <div className="pt-6 opacity-40 flex gap-4 text-accent">
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="material-symbols-outlined">monitoring</span>
            <span className="material-symbols-outlined">timer</span>
          </div>
        </footer>
      </motion.main>
      <div className="fixed bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />
    </div>
  )
}
