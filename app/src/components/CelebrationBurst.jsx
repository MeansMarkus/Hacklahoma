import { useMemo } from 'react'

const TASK_COLORS = ['#34d399', '#fbbf24', '#38bdf8', '#f472b6', '#a78bfa']
const SUMMIT_COLORS = ['#fbbf24', '#f59e0b', '#34d399', '#22d3ee', '#f472b6', '#f97316']

function createRng(seed) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => (value = (value * 16807) % 2147483647) / 2147483647
}

export default function CelebrationBurst({ variant = 'task', seed = 1, origin }) {
  const particles = useMemo(() => {
    const rng = createRng(seed)
    const isSummit = variant === 'summit'
    const particleCount = isSummit ? 36 : 14
    const spread = isSummit ? 140 : 90
    const rise = isSummit ? 160 : 110
    const colors = isSummit ? SUMMIT_COLORS : TASK_COLORS

    return Array.from({ length: particleCount }, () => {
      const angle = rng() * Math.PI * 2
      const distance = spread * (0.4 + rng() * 0.6)
      const x = Math.cos(angle) * distance
      const y = -Math.abs(Math.sin(angle)) * rise * (0.5 + rng() * 0.6)
      const size = isSummit ? 5 + rng() * 6 : 4 + rng() * 4
      const delay = rng() * (isSummit ? 180 : 120)
      const spin = rng() * 720 - 360
      const color = colors[Math.floor(rng() * colors.length)]

      return { x, y, size, delay, spin, color }
    })
  }, [seed, variant])

  const style = origin
    ? { left: `${origin.x}px`, top: `${origin.y}px` }
    : undefined

  return (
    <div
      className={`celebration-burst ${variant === 'summit' ? 'summit' : 'task'}`}
      style={style}
      aria-hidden
    >
      {particles.map((particle, index) => (
        <span
          key={index}
          className="particle"
          style={{
            '--x': `${particle.x}px`,
            '--y': `${particle.y}px`,
            '--size': `${particle.size}px`,
            '--delay': `${particle.delay}ms`,
            '--spin': `${particle.spin}deg`,
            '--color': particle.color,
          }}
        />
      ))}
    </div>
  )
}
