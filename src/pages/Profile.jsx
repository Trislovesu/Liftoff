import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import { levelFromXP, rankFor } from '../lib/xp.js'
import XPProgressBar from '../components/XPProgressBar.jsx'
import RankBadge from '../components/RankBadge.jsx'
import Avatar, { AVATAR_EMOJI_OPTIONS } from '../components/Avatar.jsx'
import { uploadImage } from '../lib/supabase.js'

export default function Profile() {
  const { state, actions } = useApp()
  const { user, history } = state
  const lvl = levelFromXP(user.totalXP)
  const { current, next, xpToNext } = rankFor(user.totalXP)
  const [picOpen, setPicOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    e.target.value = ''
    setUploading(true)
    try {
      const url = await uploadImage(f, 'avatars', user.username)
      actions.setProfilePic(url)
      setPicOpen(false)
    } catch (e) { alert(e.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div>
      <Header title="Profile" />

      <div className="card-grad p-5 mb-4 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setPicOpen(true)} className="relative">
            <Avatar user={user} size={64} ring={current.color} />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-bg-700 border border-white/20 flex items-center justify-center text-xs">✎</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-xl truncate">{user.username}</div>
            <div className="text-xs text-white/50 mt-0.5">
              Level {lvl.level} • {current.name}
              {next ? ` • ${xpToNext.toLocaleString()} XP to ${next.name}` : ' • Max rank'}
            </div>
          </div>
          <RankBadge rank={current} size={36} />
        </div>
        <XPProgressBar value={lvl.progress} color="#ff0033" label={`${user.totalXP.toLocaleString()} XP`} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Workouts" value={user.totalWorkouts || 0} />
        <Stat label="Weekly"   value={user.weeklyXP.toLocaleString()} />
        <Stat label="Total XP" value={user.totalXP.toLocaleString()} />
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2 px-1">History</h2>
      {history.length === 0 ? (
        <div className="card p-6 text-center text-white/50 text-sm">No workouts yet.</div>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <Link key={h.id} to={`/history/${h.id}`}
              className="card p-3 flex items-center gap-3 hover:bg-white/5 transition">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">🏋️</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{h.workoutName}</div>
                <div className="text-xs text-white/40">
                  {new Date(h.date).toLocaleString()} • {h.exercises.length} exercises
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-xp">+{h.xp}</div>
                <div className="text-[10px] text-white/40">XP</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button onClick={() => { if (confirm('Sign out?')) actions.signOut() }} className="btn-ghost text-sm">
          Sign Out
        </button>
      </div>

      {picOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur p-3"
          onClick={() => setPicOpen(false)}>
          <div className="card w-full max-w-sm p-5"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-3">
              <h3 className="text-lg font-extrabold">Profile Photo</h3>
            </div>
            <button onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-primary w-full mb-3">
              {uploading ? 'Uploading…' : '📤 Upload Photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <div className="text-xs text-white/40 text-center mb-2">— or pick an emoji —</div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {AVATAR_EMOJI_OPTIONS.map(em => (
                <button key={em}
                  onClick={() => { actions.setProfilePic(em); setPicOpen(false) }}
                  className="aspect-square text-2xl rounded bg-white/5 hover:bg-accent/10 border border-bg-700">
                  {em}
                </button>
              ))}
            </div>
            <button onClick={() => setPicOpen(false)} className="btn-ghost w-full text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</div>
      <div className="text-lg font-extrabold mt-0.5">{value}</div>
    </div>
  )
}
