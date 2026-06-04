import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import { useApp } from '../store/AppContext.jsx'
import { broadcastGymStatus, rpcAdminListUsers, rpcAdminUpdateGymStatus, rpcGetGymStatus, subscribeToGymStatus } from '../lib/supabase.js'
import { DEFAULT_GYM_STATUS, GYM_LOCATIONS, normalizeGymStatus, STATUS_OPTIONS, statusMeta } from '../lib/gymStatus.js'

const SEEN_STATUS_KEY = 'liftit.gymStatusSeen.v1'
const SEEN_MESSAGE_KEY = 'liftit.gymStatusMessageSeen.v1'

function isAdminUser(user) {
  return user?.username?.toLowerCase() === 'tris'
}

export default function AppTopBar({ user }) {
  const { state } = useApp()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(DEFAULT_GYM_STATUS)
  const [notice, setNotice] = useState(false)
  const [messageAlert, setMessageAlert] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(DEFAULT_GYM_STATUS)
  const admin = isAdminUser(user)

  function applyStatus(nextStatus, { announce = false } = {}) {
    const next = normalizeGymStatus(nextStatus)
    setStatus(next)
    setDraft(next)
    const seenStatus = localStorage.getItem(SEEN_STATUS_KEY)
    const seenMessage = localStorage.getItem(SEEN_MESSAGE_KEY)
    const message = next.message?.trim()
    if (announce && next.updated_at && next.updated_at !== seenStatus) {
      setNotice(true)
    }
    if (announce && next.updated_at && next.updated_at !== seenMessage && message) {
      setMessageAlert({ ...next, message })
      setOpen(false)
    }
  }

  async function refreshStatus({ announce = false } = {}) {
    try {
      applyStatus(await rpcGetGymStatus(), { announce })
    } catch {
      setStatus(DEFAULT_GYM_STATUS)
      setDraft(DEFAULT_GYM_STATUS)
    }
  }

  useEffect(() => {
    refreshStatus({ announce: true })
    const unsubscribe = subscribeToGymStatus(next => applyStatus(next, { announce: true }))
    const t = setInterval(() => refreshStatus({ announce: true }), 60000)
    return () => {
      clearInterval(t)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!open || !admin) return
    rpcAdminListUsers(state.session.username, state.session.pin_hash).then(setAccounts).catch(() => setAccounts([]))
  }, [open, admin])

  const overall = useMemo(() => {
    if (status.locations.some(l => l.status === 'closed')) return statusMeta('closed')
    if (status.locations.some(l => l.status === 'closing_soon')) return statusMeta('closing_soon')
    return statusMeta('open')
  }, [status.locations])

  function markSeen() {
    if (status.updated_at) localStorage.setItem(SEEN_STATUS_KEY, status.updated_at)
    setNotice(false)
  }

  async function saveAdminStatus() {
    setSaving(true)
    try {
      const next = normalizeGymStatus(await rpcAdminUpdateGymStatus(
        state.session.username,
        state.session.pin_hash,
        draft
      ))
      setStatus(next)
      setDraft(next)
      setNotice(false)
      if (next.updated_at) localStorage.setItem(SEEN_STATUS_KEY, next.updated_at)
      if (next.updated_at) localStorage.setItem(SEEN_MESSAGE_KEY, next.updated_at)
      await broadcastGymStatus(next)
    } catch (e) {
      alert(e.message || 'Could not update gym status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-bg-900/75 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-md mx-auto h-14 px-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 active:scale-[0.98] transition">
          <Avatar user={user} size={32} ring="#ff0033" />
          <span className="font-extrabold tracking-tight text-accent text-xl leading-none">LIFTIT</span>
        </Link>
        <div className="relative">
          <button
            onClick={() => { setOpen(v => !v); markSeen() }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition relative"
            aria-label="Gym status"
          >
            <span
              className="text-2xl font-extrabold text-accent drop-shadow-[0_0_10px_rgba(255,0,51,0.8)]"
              style={{ fontFamily: 'Sora, Geist, system-ui, sans-serif' }}
            >
              Z
            </span>
            <span
              className="absolute -right-1 -bottom-1 w-3 h-3 rounded-full border border-bg-900"
              style={{ background: overall.color, boxShadow: `0 0 10px ${overall.color}` }}
            />
            {notice && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] glass-card p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-accent">Zion Fitness Status</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="space-y-3">
                {status.locations.map(location => {
                  const meta = statusMeta(location.status)
                  return (
                    <div key={location.key} className="bg-bg-950/50 border border-white/10 rounded-2xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-extrabold">{location.key === 'zion' ? 'Highway Plaza' : location.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
                          <span className="w-3 h-3 rounded-full" style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {admin && (
                <AdminPanel
                  accounts={accounts}
                  draft={draft}
                  setDraft={setDraft}
                  saving={saving}
                  onSave={saveAdminStatus}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {messageAlert && (
        <StatusMessageAlert
          status={messageAlert}
          onClose={() => {
            if (messageAlert.updated_at) localStorage.setItem(SEEN_MESSAGE_KEY, messageAlert.updated_at)
            setMessageAlert(null)
          }}
        />
      )}
    </header>
  )
}

function StatusMessageAlert({ status, onClose }) {
  return (
    <div className="fixed inset-x-0 top-20 z-[60] px-4 pointer-events-none">
      <div className="max-w-md mx-auto glass-card border-accent/40 p-4 rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.6),0_0_28px_rgba(255,0,51,0.18)] pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/35 flex items-center justify-center text-accent shrink-0">
            <span className="material-symbols-outlined text-xl">priority_high</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="metric-label text-accent mb-1">Zion Fitness Update</p>
            <p className="text-sm font-semibold leading-relaxed text-white/90">{status.message}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white/45 hover:text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminPanel({ accounts, draft, setDraft, saving, onSave }) {
  function patchLocation(key, status) {
    setDraft(d => ({
      ...d,
      locations: GYM_LOCATIONS.map(base => {
        const found = d.locations?.find(l => l.key === base.key)
        return { ...base, status: base.key === key ? status : (found?.status || 'open') }
      })
    }))
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="metric-label text-accent mb-3">Admin</p>
      <div className="space-y-3">
        {GYM_LOCATIONS.map(location => {
          const current = draft.locations?.find(l => l.key === location.key)?.status || 'open'
          return (
            <label key={location.key} className="block">
              <div className="text-xs text-white/55 mb-1">{location.name}</div>
              <select
                value={current}
                onChange={e => patchLocation(location.key, e.target.value)}
                className="input w-full"
              >
                {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )
        })}
        <label className="block">
          <div className="text-xs text-white/55 mb-1">Update message</div>
          <input
            value={draft.message || ''}
            onChange={e => setDraft(d => ({ ...d, message: e.target.value }))}
            className="input w-full"
            placeholder="Gym status updated"
          />
        </label>
        <button onClick={onSave} disabled={saving} className="btn-primary w-full justify-center disabled:opacity-50">
          {saving ? 'Saving...' : 'Save status'}
        </button>
      </div>

      <div className="mt-4">
        <p className="metric-label mb-2">Created accounts</p>
        <div className="max-h-40 overflow-auto space-y-1 pr-1">
          {accounts.map(account => (
            <div key={account.username} className="flex items-center justify-between text-xs bg-bg-950/50 rounded-lg px-2 py-1.5">
              <span className="font-semibold">{account.username}</span>
              <span className="text-white/45">{(account.total_xp || 0).toLocaleString()} XP</span>
            </div>
          ))}
          {accounts.length === 0 && <div className="text-xs text-white/35">No accounts loaded.</div>}
        </div>
      </div>
    </div>
  )
}
