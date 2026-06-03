import React from 'react'
import { statusForLevel } from '../data/muscles.js'

// Renders one tappable muscle zone (SVG element) with fill / glow scaled by level.
// `shape` is an already-positioned SVG element (e.g. <ellipse ... />).
// We clone it and inject color, opacity, stroke, and a wrapping <g> for the click handler.
export default function MuscleZone({ muscle, shape, isSelected, isRecent, onClick }) {
  const status = statusForLevel(muscle.level)
  const intensity = Math.min(1, muscle.level / 18)
  const fillOpacity = muscle.level === 0 ? 0.05 : 0.18 + intensity * 0.55
  const glow = muscle.level === 0 ? 0 : 3 + intensity * 12
  const strokeColor = isSelected ? '#ffffff' : muscle.level === 0 ? 'rgba(255,255,255,0.18)' : `${status.color}cc`
  const strokeWidth = isSelected ? 2.4 : muscle.level === 0 ? 1 : 1.2

  return (
    <g
      onClick={onClick}
      style={{
        cursor: 'pointer',
        filter: glow ? `drop-shadow(0 0 ${glow}px ${status.color})` : undefined
      }}
      className={isRecent ? 'muscle-pulse' : ''}
    >
      {React.cloneElement(shape, {
        fill: muscle.level === 0 ? 'rgba(255,255,255,0.06)' : status.color,
        fillOpacity,
        stroke: strokeColor,
        strokeWidth
      })}
    </g>
  )
}
