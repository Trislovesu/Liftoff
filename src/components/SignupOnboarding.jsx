import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../store/AppContext.jsx'
import { uploadImage } from '../lib/supabase.js'
import { AVATAR_EMOJI_OPTIONS } from './Avatar.jsx'

export default function SignupOnboarding() {
  const { state, actions } = useApp()
  const [step, setStep] = useState('avatar')
  const [profilePicUrl, setProfilePicUrl] = useState(state.user.profilePicUrl || '')
  const [gymType, setGymType] = useState(state.user.gymType || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    setErr('')
    try {
      const url = await uploadImage(f, 'avatars', state.user.username)
      setProfilePicUrl(url)
      actions.setProfilePic(url)
      setStep('location')
    } catch (error) {
      setErr(error.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  function chooseEmoji(emoji) {
    setProfilePicUrl(emoji)
    actions.setProfilePic(emoji)
    setStep('location')
  }

  function finish(nextGymType = gymType) {
    actions.completeOnboarding({ profilePicUrl: profilePicUrl || state.user.profilePicUrl || null, gymType: nextGymType })
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-10">
      <div className="mesh-gradient" />
      <AnimatePresence mode="wait">
        {step === 'avatar' ? (
          <motion.section
            key="avatar"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="glass-card p-6 w-full relative z-10"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mx-auto mb-3 flex items-center justify-center shadow-[0_0_24px_rgba(255,0,51,0.18)]">
                <span className="material-symbols-outlined text-accent text-4xl">person_add</span>
              </div>
              <p className="metric-label text-accent mb-1">Set your icon</p>
              <h1 className="text-3xl font-extrabold tracking-tight">Pick your look</h1>
            </div>

            <label className="btn-primary w-full justify-center mb-4 cursor-pointer">
              {busy ? 'Uploading...' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
            </label>

            <div className="metric-label text-center mb-3">Or choose an emoji</div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {AVATAR_EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => chooseEmoji(emoji)}
                  className="aspect-square text-2xl rounded-2xl bg-white/5 hover:bg-accent/10 border border-white/10 hover:border-accent/45 transition-all active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {err && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2 mb-3">{err}</div>}
            <button onClick={() => setStep('location')} className="btn-ghost w-full justify-center">Skip for now</button>
          </motion.section>
        ) : (
          <motion.section
            key="location"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="glass-card p-6 w-full relative z-10"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mx-auto mb-3 flex items-center justify-center shadow-[0_0_24px_rgba(255,0,51,0.18)]">
                <span className="material-symbols-outlined text-accent text-4xl">location_on</span>
              </div>
              <p className="metric-label text-accent mb-1">Training setup</p>
              <h1 className="text-3xl font-extrabold tracking-tight">Where do you train?</h1>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { id: 'gym', label: 'Gym', icon: 'fitness_center' },
                { id: 'home', label: 'Home', icon: 'home' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => { setGymType(option.id); finish(option.id) }}
                  className="glass-card p-5 flex flex-col items-center gap-3 hover:border-accent/55 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-4xl text-accent">{option.icon}</span>
                  <span className="font-extrabold">{option.label}</span>
                </button>
              ))}
            </div>

            <button onClick={() => finish(null)} className="btn-ghost w-full justify-center">Decide later</button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
