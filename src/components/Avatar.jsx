// Universal avatar. profilePicUrl can hold either:
//  - a Supabase Storage URL (starts with http)
//  - an emoji string (1-4 chars, no protocol)
//  - null → falls back to username initial in a gradient bubble

export const AVATAR_EMOJI_OPTIONS = ['💪', '🏋️', '🔥', '⚡', '🦾', '🚀', '🦁', '🐺', '🦅', '🥷']

function isUrl(v) { return typeof v === 'string' && /^https?:\/\//i.test(v) }
function isEmoji(v) { return typeof v === 'string' && v.length > 0 && v.length <= 4 && !isUrl(v) }

export default function Avatar({ user, size = 40, ring }) {
  const v = user?.profilePicUrl
  const initial = (user?.username?.[0] || '?').toUpperCase()
  const fontSize = Math.round(size * 0.42)

  const inner = isUrl(v)
    ? <img src={v} alt={user?.username || 'avatar'} className="w-full h-full object-cover" draggable={false} />
    : isEmoji(v)
      ? <span style={{ fontSize: Math.round(size * 0.58), lineHeight: 1 }}>{v}</span>
      : <span style={{ fontSize }} className="font-extrabold text-white">{initial}</span>

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
        isUrl(v) ? '' : 'bg-gradient-to-br from-bg-700 to-bg-600 border border-white/10'
      }`}
      style={{
        width: size, height: size,
        boxShadow: ring ? `0 0 0 2px ${ring}, 0 0 12px ${ring}55` : undefined
      }}
    >
      {inner}
    </div>
  )
}
