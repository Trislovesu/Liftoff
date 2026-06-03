// Hex-style rank badge used in the rankings list and on the featured card.
// Pass a tier object: { name, sub, label, color, isUnranked }.
export default function TierBadge({ tier, size = 32, showSub = true }) {
  const text = (showSub && tier.sub) ? tier.sub : (tier.name?.[0] || '?')
  return (
    <div
      className="relative flex items-center justify-center font-extrabold select-none"
      style={{
        width: size,
        height: size,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: tier.isUnranked
          ? `linear-gradient(135deg, ${tier.color}88, ${tier.color}55)`
          : `linear-gradient(135deg, ${tier.color}, ${tier.color}aa 60%, ${tier.color}66)`,
        boxShadow: tier.isUnranked ? 'none' : `0 0 ${size * 0.5}px ${tier.color}66`,
        fontSize: size * 0.36,
        color: '#0a0b10',
        textShadow: '0 1px 0 rgba(255,255,255,0.2)'
      }}
      title={tier.label}
    >
      {text}
    </div>
  )
}
