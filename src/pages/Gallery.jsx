import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { rpcGetPumpPhotos, uploadImage, rpcSavePumpPhoto } from '../lib/supabase.js'
import { checkPhotoIsRecent } from '../lib/exifDate.js'
import { randomCompliment } from '../lib/funnyRejects.js'

export default function Gallery() {
  const { state } = useApp()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let dead = false
    setLoading(true); setErr('')
    rpcGetPumpPhotos(state.user.username)
      .then(d => { if (!dead) setPhotos(d) })
      .catch(e => { if (!dead) setErr(e.message) })
      .finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [state.user.username])

  function fmtDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      <UploadButton onUploaded={(p) => setPhotos(ps => [p, ...ps])} />

      {loading && <div className="card p-6 text-center text-white/40">Loading…</div>}
      {err && <div className="card p-4 text-danger">{err}</div>}

      {!loading && !err && photos.length === 0 && (
        <div className="card p-6 text-center text-white/40 text-sm">
          No pump pics yet. Take one after your next workout 📸
        </div>
      )}

      <div className="space-y-4 mt-4">
        {photos.map(p => (
          <div key={p.id} className="card overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">{fmtDate(p.taken_at)}</div>
                <div className="text-[11px] text-white/40 italic">{p.caption || 'Locked in.'}</div>
              </div>
              {p.xp_bonus > 0 && (
                <div className="chip text-xp" style={{ borderColor: '#ff003355' }}>+{p.xp_bonus} XP</div>
              )}
            </div>
            <img src={p.image_url} alt="" className="w-full h-auto block" />
          </div>
        ))}
      </div>
    </div>
  )
}

function UploadButton({ onUploaded }) {
  const { state } = useApp()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function handle(e) {
    const f = e.target.files?.[0]; if (!f) return
    e.target.value = '' // allow re-pick of same file
    setMsg('')
    setBusy(true)
    try {
      const check = await checkPhotoIsRecent(f)
      if (!check.ok) { setMsg(check.reason); return }
      const url = await uploadImage(f, 'pumps', state.user.username)
      const taken_at = new Date(check.ts).toISOString()
      const caption = randomCompliment()
      const saved = await rpcSavePumpPhoto(
        state.session.username, state.session.pin_hash,
        { image_url: url, taken_at, caption, xp_bonus: 0 }
      )
      onUploaded({ id: saved.id, image_url: url, taken_at, caption, xp_bonus: 0 })
    } catch (e) { setMsg(e.message || 'Upload failed') }
    finally { setBusy(false) }
  }

  return (
    <div className="mb-3">
      <label className="btn-primary w-full justify-center cursor-pointer">
        {busy ? 'Checking…' : '📸 Add Pump Pic'}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} disabled={busy} />
      </label>
      {msg && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2 mt-2">
          {msg}
        </div>
      )}
    </div>
  )
}
