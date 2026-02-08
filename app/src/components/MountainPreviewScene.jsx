import { useId } from 'react'
import { MOUNTAIN_PATHS, STARS } from '../utils/mountainAssets'

export default function MountainPreviewScene({ hue = 210, className = '' }) {
  const uid = useId()
  const skyGradient = `sky-${uid}`
  const mountainGradient = `mountain-${uid}`
  const hazeGradient = `haze-${uid}`
  const blurFilter = `blur-${uid}`

  return (
    <svg
      viewBox="0 0 800 500"
      className={`h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={skyGradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsla(${hue}, 45%, 22%, 0.8)`} />
          <stop offset="100%" stopColor={`hsla(${hue}, 35%, 8%, 0.95)`} />
        </linearGradient>
        <linearGradient id={mountainGradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsla(${hue}, 35%, 58%, 0.35)`} />
          <stop offset="100%" stopColor={`hsla(${hue}, 40%, 30%, 0.5)`} />
        </linearGradient>
        <linearGradient id={hazeGradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={blurFilter} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width="800" height="500" fill={`url(#${skyGradient})`} />

      <g opacity="0.4">
        {STARS.map((star, index) => (
          <circle
            key={`${uid}-star-${index}`}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="rgba(255,255,255,0.7)"
            opacity={star.opacity * 0.5}
          />
        ))}
      </g>

      <g filter={`url(#${blurFilter})`} opacity="0.7">
        <path d={MOUNTAIN_PATHS.base} fill={`url(#${mountainGradient})`} />
        <path d={MOUNTAIN_PATHS.mainPeak.light} fill={`hsla(${hue}, 45%, 70%, 0.35)`} />
        <path d={MOUNTAIN_PATHS.mainPeak.shadow} fill={`hsla(${hue}, 35%, 35%, 0.5)`} />
        <path d={MOUNTAIN_PATHS.mainPeak.snowCap} fill="rgba(255,255,255,0.35)" />
        <path d={MOUNTAIN_PATHS.secondaryPeak.light} fill={`hsla(${hue}, 40%, 60%, 0.3)`} />
        <path d={MOUNTAIN_PATHS.secondaryPeak.shadow} fill={`hsla(${hue}, 35%, 28%, 0.45)`} />
      </g>

      <rect width="800" height="500" fill={`url(#${hazeGradient})`} opacity="0.4" />
    </svg>
  )
}
