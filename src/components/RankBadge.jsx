export default function RankBadge({ rank, size = 32 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold text-white"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${rank.color}, ${rank.color}88)`,
        boxShadow: `0 0 ${size * 0.5}px ${rank.glow}`,
        fontSize: size * 0.42
      }}
      title={rank.name}
    >
      {rank.name[0]}
    </div>
  )
}
