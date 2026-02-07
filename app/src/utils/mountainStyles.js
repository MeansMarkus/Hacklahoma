// Different mountain path generators for different styles

export const MOUNTAIN_STYLES = {
  snowy: {
    name: 'Snowy Peak',
    description: 'Classic snow-capped summit',
    mainColor: '#475569',
    peakColor: '#f1f5f9',
  },
  rocky: {
    name: 'Rocky Mountain',
    description: 'Rugged, dramatic peaks',
    mainColor: '#92400e',
    peakColor: '#b45309',
  },
  everest: {
    name: 'Everest',
    description: 'The world\'s highest challenge',
    mainColor: '#334155',
    peakColor: '#e2e8f0',
  },
  colorful: {
    name: 'Sunset Peak',
    description: 'Vibrant gradient mountain',
    mainColor: '#c2410c',
    peakColor: '#fbbf24',
  },
}

export function getMountainPathByStyle(ledgeCount, style = 'snowy') {
  const n = Math.max(ledgeCount, 3)
  const SUMMIT_X = 400
  const SUMMIT_Y = 80
  const LEFT_BASE_X = 120
  const RIGHT_BASE_X = 680
  const MOUNTAIN_BASE_Y = 480

  const lerp = (a, b, t) => a + (b - a) * t

  const pathLeft = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const x = lerp(LEFT_BASE_X, SUMMIT_X, t)
    const y = lerp(MOUNTAIN_BASE_Y, SUMMIT_Y, 1 - (1 - t) * (1 - t))
    pathLeft.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
  }

  const pathRight = []
  for (let i = 1; i <= 40; i++) {
    const t = i / 40
    const x = lerp(SUMMIT_X, RIGHT_BASE_X, t)
    const y = lerp(SUMMIT_Y, MOUNTAIN_BASE_Y, t * t)
    pathRight.push(`L ${x} ${y}`)
  }

  return pathLeft.join(' ') + ' ' + pathRight.join(' ') + ' Z'
}
