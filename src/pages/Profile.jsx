import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BIG_THREE_LIFTS, useApp } from '../store/AppContext.jsx'
import Header from '../components/Header.jsx'
import { levelFromXP, rankFor } from '../lib/xp.js'
import XPProgressBar from '../components/XPProgressBar.jsx'
import RankBadge from '../components/RankBadge.jsx'
import Avatar, { AVATAR_EMOJI_OPTIONS } from '../components/Avatar.jsx'
import VerifiedName from '../components/VerifiedName.jsx'
import { uploadImage } from '../lib/supabase.js'

export default function Profile() {
  const { state, actions } = useApp()
  const { user, history } = state
  const lvl = levelFromXP(user.totalXP)
  const { current, next, xpToNext } = rankFor(user.totalXP)
  const [picOpen, setPicOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [prOpen, setPrOpen] = useState(null)
  const [prDraft, setPrDraft] = useState({ weight: '', reps: '' })
  const [prError, setPrError] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [weightDraft, setWeightDraft] = useState(user.bodyWeightLbs ? String(user.bodyWeightLbs) : '')
  const [memberCode, setMemberCode] = useState(user.zionMemberCode || '')
  const [verifyError, setVerifyError] = useState('')
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
            <VerifiedName user={user} className="font-extrabold text-xl" />
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

      {!user.zionVerified && (
        <button
          onClick={() => setVerifyOpen(true)}
          className="w-full mb-4 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3 text-accent font-extrabold flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(255,0,51,0.18)] active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          Get verified
        </button>
      )}

      <div className="glass-card p-4 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Body Weight</h2>
            <div className="text-xs text-white/35">
              {user.bodyWeightUpdatedAt ? `Changed ${timeAgo(user.bodyWeightUpdatedAt)}` : 'Add this for profile viewers'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold">{user.bodyWeightLbs ? `${user.bodyWeightLbs} lbs` : '--'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={weightDraft}
            inputMode="numeric"
            onChange={e => setWeightDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="lbs"
            className="input flex-1"
          />
          <button
            onClick={() => {
              const next = Number(weightDraft)
              if (!next) return
              actions.setBodyWeight(next)
            }}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>

      <FeaturedPrGrid prs={user.featuredPRs || {}} />

      <div className="glass-card p-4 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Featured PRs</h2>
            <div className="text-xs text-white/35">Choose any Big 3 lifts to show on your profile.</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BIG_THREE_LIFTS.map(lift => {
            const active = (user.featuredLiftKeys || []).includes(lift.key)
            const pr = user.featuredPRs?.[lift.key]
            return (
              <button
                key={lift.key}
                onClick={() => {
                  setPrOpen(lift)
                  setPrDraft({ weight: pr?.weight ? String(pr.weight) : '', reps: pr?.reps ? String(pr.reps) : '' })
                  setPrError('')
                }}
                className={`rounded-2xl border px-3 py-3 text-xs font-extrabold transition ${active ? 'bg-accent/15 border-accent/50 text-accent shadow-[0_0_14px_rgba(255,0,51,0.16)]' : 'bg-white/[0.03] border-white/10 text-white/45'}`}
              >
                <span className="block">{lift.label}</span>
                <span className="block mt-1 text-[10px] text-white/35">{pr ? `${pr.weight} x ${pr.reps}` : 'Enter PR'}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card p-3">
        <button
          onClick={() => setHistoryOpen(v => !v)}
          className="w-full flex items-center justify-between gap-3"
        >
          <div className="text-left">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">History</h2>
            <div className="text-xs text-white/35">{history.length} logged workouts</div>
          </div>
          <span className="material-symbols-outlined text-accent transition" style={{ transform: historyOpen ? 'rotate(180deg)' : undefined }}>expand_more</span>
        </button>
        {historyOpen && (
          <div className="space-y-2 mt-3">
            {history.length === 0 ? (
              <div className="p-4 text-center text-white/50 text-sm">No workouts yet.</div>
            ) : history.map(h => (
              <Link key={h.id} to={`/history/${h.id}`}
                className="bg-bg-950/40 border border-white/10 rounded-2xl p-3 flex items-center gap-3 hover:bg-white/5 transition">
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
      </div>

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

      {verifyOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur p-3"
          onClick={() => setVerifyOpen(false)}>
          <div className="card w-full max-w-sm p-5"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/35 mx-auto mb-3 flex items-center justify-center shadow-[0_0_24px_rgba(255,0,51,0.22)]">
                <span className="material-symbols-outlined text-accent text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <h3 className="text-lg font-extrabold">Get verified</h3>
              <p className="text-sm text-white/45 mt-2">Enter the 5 digit code before your name on Zion scan-in.</p>
            </div>
            <input
              value={memberCode}
              inputMode="numeric"
              onChange={e => { setVerifyError(''); setMemberCode(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
              className="input w-full text-3xl font-extrabold text-center tracking-[0.25em] mb-3"
              placeholder="12345"
            />
            {verifyError && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2 mb-3">{verifyError}</div>}
            <button
              onClick={() => {
                try {
                  actions.setZionMemberCode(memberCode)
                  setVerifyOpen(false)
                } catch (error) {
                  setVerifyError(error.message)
                }
              }}
              disabled={memberCode.length !== 5}
              className="btn-primary w-full mb-3 disabled:opacity-40"
            >
              Verify
            </button>
            <button onClick={() => setVerifyOpen(false)} className="btn-ghost w-full text-sm">Close</button>
          </div>
        </div>
      )}

      {prOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur p-3"
          onClick={() => setPrOpen(null)}>
          <div className="card w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/35 mx-auto mb-3 flex items-center justify-center text-accent shadow-[0_0_24px_rgba(255,0,51,0.2)]">
                <span className="material-symbols-outlined text-3xl">fitness_center</span>
              </div>
              <h3 className="text-xl font-extrabold">{prOpen.label} PR</h3>
              <p className="text-sm text-white/45 mt-1">Enter your best weight and reps.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label>
                <div className="label mb-1">Weight</div>
                <input
                  value={prDraft.weight}
                  inputMode="numeric"
                  onChange={e => setPrDraft(d => ({ ...d, weight: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="input w-full text-center text-2xl font-extrabold"
                  placeholder="225"
                />
              </label>
              <label>
                <div className="label mb-1">Reps</div>
                <input
                  value={prDraft.reps}
                  inputMode="numeric"
                  onChange={e => setPrDraft(d => ({ ...d, reps: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                  className="input w-full text-center text-2xl font-extrabold"
                  placeholder="5"
                />
              </label>
            </div>
            {prError && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2 mb-3">{prError}</div>}
            <button
              onClick={() => {
                try {
                  actions.setManualFeaturedPR(prOpen.key, prDraft)
                  setPrOpen(null)
                } catch (error) {
                  setPrError(error.message)
                }
              }}
              className="btn-primary w-full mb-3"
            >
              Save PR
            </button>
            <button onClick={() => setPrOpen(null)} className="btn-ghost w-full text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeaturedPrGrid({ prs }) {
  const items = BIG_THREE_LIFTS.map(lift => ({ lift, pr: prs[lift.key] })).filter(item => item.pr)
  if (items.length === 0) {
    return (
      <div className="glass-card p-4 mb-4 border-white/10">
        <div className="metric-label text-accent mb-1">Featured PRs</div>
        <div className="text-sm text-white/45">Choose Bench Press, Squat, or Deadlift and log it to show PRs here.</div>
      </div>
    )
  }
  return <div className="space-y-3 mb-4">{items.map(({ lift, pr }) => <FeaturedPrCard key={lift.key} pr={pr} />)}</div>
}

function FeaturedPrCard({ pr }) {
  const style = prStyle(pr.intensity)
  return (
    <div className={`glass-card p-4 mb-4 relative overflow-hidden ${style.className}`}>
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={style.bg} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="metric-label text-accent mb-1">Featured PR</div>
            <div className="font-extrabold text-xl">{pr.liftName || pr.workoutName}</div>
            <div className="text-xs text-white/45">{pr.exerciseName} · {timeAgo(pr.date)}</div>
          </div>
          {pr.tag && <span className="px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs font-extrabold">{pr.tag}</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Weight" value={`${pr.weight} lbs`} />
          <Stat label="Reps" value={pr.reps} />
        </div>
      </div>
    </div>
  )
}

function prStyle(intensity) {
  if (intensity === 'legend') return {
    className: 'border-accent/70 shadow-[0_0_36px_rgba(255,0,51,0.35)] animate-pulse',
    bg: { background: 'radial-gradient(circle at top right, rgba(255,0,51,0.35), transparent 45%)' }
  }
  if (intensity === 'heavy') return {
    className: 'border-orange-400/60 shadow-[0_0_28px_rgba(251,146,60,0.24)]',
    bg: { background: 'linear-gradient(135deg, rgba(251,146,60,0.18), transparent)' }
  }
  if (intensity === 'strong') return {
    className: 'border-teal-300/50 shadow-[0_0_22px_rgba(45,212,191,0.16)]',
    bg: { background: 'linear-gradient(135deg, rgba(45,212,191,0.14), transparent)' }
  }
  return {
    className: 'border-white/10',
    bg: { background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)' }
  }
}

function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.max(0, Math.floor(diff / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function Stat({ label, value }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</div>
      <div className="text-lg font-extrabold mt-0.5">{value}</div>
    </div>
  )
}
