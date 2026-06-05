export function VerifiedBadge({ size = 'sm' }) {
  const dims = size === 'xs' ? 'w-4 h-4' : 'w-5 h-5'
  const icon = size === 'xs' ? 'text-[12px]' : 'text-[14px]'
  return (
    <span
      title="Verified Zion member"
      className={`${dims} inline-flex items-center justify-center rounded-full bg-accent text-white shadow-[0_0_12px_rgba(255,0,51,0.75)] align-middle shrink-0`}
    >
      <span className={`material-symbols-outlined ${icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
    </span>
  )
}

export default function VerifiedName({ user, className = '', badgeSize = 'sm' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <span className="truncate">{user?.username}</span>
      {user?.zionVerified && <VerifiedBadge size={badgeSize} />}
    </span>
  )
}
