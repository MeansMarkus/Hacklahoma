import {
  getMountainPath,
  getSummitCapPath,
  getLedgePositions,
  getClimberPosition,
} from '../utils/mountain'

export default function Mountain({ goal, tasks }) {
  const total = tasks.length
  const doneCount = tasks.filter((t) => t.done).length
  const ledgeCount = Math.max(total, 3)
  const pathD = getMountainPath(ledgeCount)
  const capD = getSummitCapPath()
  const ledges = getLedgePositions(ledgeCount, doneCount)
  const climber = getClimberPosition(total, doneCount)
  const isSummitReached = total > 0 && doneCount === total

  return (
    <section className="relative min-h-[320px]">
      {/* Summit banner */}
      <div
        className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md max-w-[90%] text-center flex items-center justify-center gap-2 border ${
          isSummitReached
            ? 'border-gold text-gold bg-sky-mid/90'
            : 'border-slate-400/20 text-slate-200 bg-sky-mid/90'
        }`}
      >
        <span>🏔️</span>
        <span id="goal-label">{goal || 'Your summit'}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[300px]">
        <svg
          className="w-full h-full block"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
        >
          <defs>
            <linearGradient id="mountainGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="snowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={pathD} fill="url(#mountainGrad)" className="transition-opacity duration-300" />
          <g>
            {ledges.map((ledge, i) => (
              <rect
                key={i}
                x={ledge.x - ledge.width / 2}
                y={ledge.y - 6}
                width={ledge.width}
                height={12}
                rx={4}
                fill={ledge.reached ? '#34d399' : 'rgba(71, 85, 105, 0.95)'}
                stroke={ledge.reached ? '#34d399' : 'rgba(148, 163, 184, 0.35)'}
                strokeWidth={1.5}
                className={`transition-all duration-400 ${ledge.reached ? 'drop-shadow-[0_0_6px_#34d399]' : ''}`}
              />
            ))}
          </g>
          <path
            d={capD}
            fill="url(#snowGrad)"
            filter="url(#glow)"
            className={isSummitReached ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}
          />
          <circle
            cx={climber.x}
            cy={climber.y}
            r={8}
            fill="#fbbf24"
            filter="url(#glow)"
            className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          />
        </svg>
      </div>
    </section>
  )
}
