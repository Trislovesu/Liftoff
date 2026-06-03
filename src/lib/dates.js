export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(a, b) {
  const ms = 1000 * 60 * 60 * 24
  return Math.round((new Date(b) - new Date(a)) / ms)
}

export function startOfWeek(d = new Date()) {
  const x = new Date(d)
  const day = x.getDay() // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7 // make Monday the first day
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - diff)
  return x
}
