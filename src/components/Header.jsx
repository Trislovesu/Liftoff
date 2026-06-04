import { Link } from 'react-router-dom'

export default function Header({ title, back, right }) {
  return (
    <div className="flex items-center justify-between px-1 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        {back && (
          <Link to={back} className="w-9 h-9 rounded bg-white/5 hover:bg-accent/10 flex items-center justify-center">
            <span className="text-lg">←</span>
          </Link>
        )}
        <h1 className="text-xl font-extrabold tracking-tight truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}
