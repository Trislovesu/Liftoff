import BodyFigure from './BodyFigure.jsx'

export default function FrontBackBodyMap({ musclesByName, selectedName, onSelect }) {
  return (
    <div className="rounded-3xl bg-bg-800/40 border border-white/5 p-4 mb-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grad opacity-30 pointer-events-none" />
      <div className="relative grid grid-cols-2 gap-2">
        <BodyFigure
          side="front"
          label="Front"
          musclesByName={musclesByName}
          selectedName={selectedName}
          onSelect={onSelect}
        />
        <BodyFigure
          side="back"
          label="Back"
          musclesByName={musclesByName}
          selectedName={selectedName}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}
