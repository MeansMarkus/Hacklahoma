const MOUNTAIN_BASE_Y = 480
const SUMMIT_X = 400
const SUMMIT_Y = 80
const LEFT_BASE_X = 120
const RIGHT_BASE_X = 800 - 120

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function getMountainPath(ledgeCount) {
  const n = Math.max(ledgeCount, 3)
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

export function getSummitCapPath() {
  const capWidth = 72
  const capHeight = 48
  return `M ${SUMMIT_X - capWidth / 2} ${SUMMIT_Y + capHeight} L ${SUMMIT_X} ${SUMMIT_Y} L ${SUMMIT_X + capWidth / 2} ${SUMMIT_Y + capHeight} Z`
}

export function getLedgePositions(ledgeCount, doneCount) {
  const positions = []
  for (let i = 0; i < ledgeCount; i++) {
    const t = (i + 0.5) / ledgeCount
    const x = lerp(LEFT_BASE_X, SUMMIT_X, t)
    const y = lerp(MOUNTAIN_BASE_Y, SUMMIT_Y, 1 - (1 - t) * (1 - t))
    const ledgeWidth = 44 + (1 - t) * 36
    positions.push({ x, y, width: ledgeWidth, reached: i < doneCount })
  }
  return positions
}

export function getClimberPosition(totalTasks, doneCount) {
  let x = LEFT_BASE_X + 25
  let y = MOUNTAIN_BASE_Y - 25
  if (totalTasks > 0) {
    const idx = Math.min(doneCount, totalTasks)
    const t = (idx - 0.25) / totalTasks
    if (t > 0) {
      x = lerp(LEFT_BASE_X, SUMMIT_X, t)
      y = lerp(MOUNTAIN_BASE_Y, SUMMIT_Y, 1 - (1 - t) * (1 - t)) - 12
    }
  }
  return { x, y }
}
