import {
  getMountainPath,
  getSummitCapPath,
  getLedgePositions,
  getClimberPosition,
} from '../utils/mountain'
import PhotoFlag from './PhotoFlag'

export default function Mountain({ goal, tasks, onPhotoUpdate }) {
  const total = tasks.length
  const doneCount = tasks.filter((t) => t.done).length
  const ledgeCount = Math.max(total, 3)
  const pathD = getMountainPath(ledgeCount)
  const capD = getSummitCapPath()
  const ledges = getLedgePositions(ledgeCount, doneCount)
  const climber = getClimberPosition(total, doneCount)
  const isSummitReached = total > 0 && doneCount === total

  return (
    <section className="mountain-section">
      {/* Summit banner */}
      <div className={`summit-banner ${isSummitReached ? 'summit-reached' : ''}`}>
        <span className="summit-flag">🏔️</span>
        <span id="goal-label">{goal || 'Your summit'}</span>
      </div>

      <div className="mountain-container">
        {/* Photos positioned inline with SVG */}
        <svg
          className="mountain-svg"
          style={{position: 'absolute', inset: 0}}
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMax meet"
          pointerEvents="none"
        >
          {ledges.map((ledge, i) => {
            const task = tasks[i]
            if (!task) return null
            return (
              <foreignObject
                key={`photo-${i}`}
                x={ledge.x - 16}
                y={ledge.y - 30}
                width={32}
                height={32}
                style={{ pointerEvents: 'auto' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoFlag
                    taskId={task.id}
                    photo={task.photo}
                    onPhotoUpdate={onPhotoUpdate}
                  />
                </div>
              </foreignObject>
            )
          })}
        </svg>

        <svg
          className="mountain-svg"
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
          <path 
            d={pathD} 
            fill="url(#mountainGrad)" 
            className="mountain-path"
            id="mountainRock"
          />
          {/* Left slope */}
          <path 
            d="M 400 100 L 100 500 L 400 500 Z" 
            fill="url(#snowGrad)" 
            className="mountain-path"
            id="mountainSnow"
          />
          <g>
            {ledges.map((ledge, i) => (
              <rect
                key={i}
                className={`ledge transition-all duration-400 ${ledge.reached ? 'reached' : ''}`}
                x={ledge.x - ledge.width / 2}
                y={ledge.y - 6}
                width={ledge.width}
                height={12}
                rx={4}
                fill={ledge.reached ? '#34d399' : 'rgba(71, 85, 105, 0.95)'}
                stroke={ledge.reached ? '#34d399' : 'rgba(148, 163, 184, 0.35)'}
                strokeWidth={1.5}
                style={{
                  filter: ledge.reached ? 'drop-shadow(0 0 6px #34d399)' : 'none'
                }}
              />
            ))}
          </g>
          <path
            d={capD}
            fill="url(#snowGrad)"
            filter="url(#glow)"
            className="summit-cap"
            id="mountainSnow"
            style={{
              filter: isSummitReached ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' : 'none'
            }}
          />
          
          {/* Climber character */}
          <g
            transform={`translate(${climber.x}, ${climber.y})`}
            className="climber-dot"
            style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Rope/harness */}
            <line x1="0" y1="-8" x2="0" y2="-16" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
            {/* Body */}
            <circle cx="0" cy="0" r="6" fill="#fbbf24" filter="url(#glow)" />
            {/* Head */}
            <circle cx="0" cy="-8" r="4" fill="#fbbf24" filter="url(#glow)" />
            {/* Arms */}
            <line x1="-5" y1="-3" x2="5" y2="-3" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            {/* Legs climbing pose */}
            <line x1="-3" y1="5" x2="-6" y2="12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="5" x2="6" y2="10" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </section>
  )
}
