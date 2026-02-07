import {
  getLedgePositions,
  getClimberPosition,
} from '../utils/mountain'
import { MOUNTAIN_PATHS, STARS, TREES_FRONT, TREES_BACK } from '../utils/mountainAssets'
import PhotoFlag from './PhotoFlag'

export default function Mountain({ goal, tasks, onPhotoUpdate }) {
  const total = tasks.length
  const doneCount = tasks.filter((t) => t.done).length
  const ledgeCount = Math.max(total, 3)
  // const pathD = getMountainPath(ledgeCount) // Deprecated
  // const capD = getSummitCapPath() // Deprecated
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

      <div className="mountain-container-fullscreen">
        {/* Photos positioned inline with SVG */}
        <svg
          className="mountain-svg"
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0 }}
          viewBox="-100 -50 1000 600"
          preserveAspectRatio="xMidYMid slice"
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
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0 }}
          viewBox="-100 -50 1000 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="moonGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Sky Background */}
          <rect width="800" height="500" fill="url(#skyGradient)" />

          {/* 2. Stars */}
          <g className="stars">
            {STARS.map((s, i) => (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.size}
                fill="#fff"
                opacity={s.opacity}
                className="animate-pulse"
                style={{ animationDuration: `${2 + Math.random() * 3}s` }}
              />
            ))}
          </g>

          {/* 3. Moon (Top Left) */}
          <g transform="translate(100, 80)">
            <circle cx="0" cy="0" r="40" fill="#e2e8f0" filter="url(#moonGlow)" opacity="0.9" />
            {/* Craters */}
            <circle cx="-10" cy="-10" r="8" fill="#cbd5e1" opacity="0.6" />
            <circle cx="15" cy="5" r="5" fill="#cbd5e1" opacity="0.5" />
            <circle cx="-5" cy="20" r="6" fill="#cbd5e1" opacity="0.5" />
          </g>

          {/* 4. Background Trees */}
          <g fill="#0f172a" opacity="0.8">
            {TREES_BACK.map((t, i) => (
              <path
                key={`tree-back-${i}`}
                d={`M ${t.x} 500 L ${t.x + 20} ${500 - t.h} L ${t.x + 40} 500 Z`}
              />
            ))}
          </g>

          {/* 5. Mountain Main Shapes */}
          {/* Main Peak Light Side */}
          <path d={MOUNTAIN_PATHS.mainPeak.light} fill="#94a3b8" />
          {/* Main Peak Shadow Side */}
          <path d={MOUNTAIN_PATHS.mainPeak.shadow} fill="#475569" />
          {/* Main Peak Snow Cap */}
          <path d={MOUNTAIN_PATHS.mainPeak.snowCap} fill="#f1f5f9" />

          {/* Secondary Peak */}
          <path d={MOUNTAIN_PATHS.secondaryPeak.light} fill="#64748b" />
          <path d={MOUNTAIN_PATHS.secondaryPeak.shadow} fill="#334155" />


          {/* 6. Foreground Trees (Silhouettes) */}
          <g fill="#020617">
            {TREES_FRONT.map((t, i) => (
              <path
                key={`tree-front-${i}`}
                d={`M ${t.x} 500 L ${t.x + 25} ${500 - t.h} L ${t.x + 50} 500 Z`}
              />
            ))}
          </g>

          {/* 7. Ledges (Task Indicators) */}
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
                fill={ledge.reached ? '#34d399' : 'rgba(30, 41, 59, 0.8)'}
                stroke={ledge.reached ? '#34d399' : 'rgba(148, 163, 184, 0.5)'}
                strokeWidth={1.5}
                style={{
                  filter: ledge.reached ? 'drop-shadow(0 0 6px #34d399)' : 'none'
                }}
              />
            ))}
          </g>

          {/* 8. Penguin climber character */}
          <g
            transform={`translate(${climber.x}, ${climber.y})`}
            className="climber-dot"
            style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Body - black oval */}
            <ellipse cx="0" cy="0" rx="7" ry="9" fill="#1a1a1a" />
            
            {/* White belly */}
            <ellipse cx="0" cy="1" rx="5" ry="7" fill="#ffffff" />
            
            {/* Head - black circle */}
            <circle cx="0" cy="-10" r="5" fill="#1a1a1a" />
            
            {/* White face patch */}
            <ellipse cx="0" cy="-10" rx="3.5" ry="4" fill="#ffffff" />
            
            {/* Eyes */}
            <circle cx="-2" cy="-11" r="1" fill="#1a1a1a" />
            <circle cx="2" cy="-11" r="1" fill="#1a1a1a" />
            
            {/* Beak - orange triangle */}
            <path d="M 0 -8 L -2 -7 L 2 -7 Z" fill="#ff8c00" />
            
            {/* Flippers/Wings */}
            <ellipse cx="-7" cy="0" rx="2" ry="5" fill="#1a1a1a" transform="rotate(-20 -7 0)" />
            <ellipse cx="7" cy="0" rx="2" ry="5" fill="#1a1a1a" transform="rotate(20 7 0)" />
            
            {/* Feet - orange */}
            <ellipse cx="-3" cy="9" rx="2.5" ry="1.5" fill="#ff8c00" />
            <ellipse cx="3" cy="9" rx="2.5" ry="1.5" fill="#ff8c00" />
          </g>
        </svg>
      </div>
    </section>
  )
}
