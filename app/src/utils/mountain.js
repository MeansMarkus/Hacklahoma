const MOUNTAIN_BASE_Y = 500
const SUMMIT_X = 400
const SUMMIT_Y = 100
const LEFT_BASE_X = 100
const RIGHT_BASE_X = 700

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function getMountainPath(ledgeCount) {
  // Right slope: Summit to right base
  return `M ${SUMMIT_X} ${SUMMIT_Y} L ${RIGHT_BASE_X} ${MOUNTAIN_BASE_Y} L ${SUMMIT_X} ${MOUNTAIN_BASE_Y} Z`
}

export function getSummitCapPath() {
  // Jagged snow cap on the summit
  return `M ${SUMMIT_X} ${SUMMIT_Y} L 430 180 L 400 210 L 370 190 L 340 240 L 310 200 Z`
}

export function getLedgePositions(ledgeCount, doneCount) {
  const positions = []
  for (let i = 0; i < ledgeCount; i++) {
    const t = (i + 0.5) / ledgeCount
    // Position along the right slope from BASE to SUMMIT (bottom to top)
    const x = lerp(RIGHT_BASE_X, SUMMIT_X, t)
    const y = lerp(MOUNTAIN_BASE_Y, SUMMIT_Y, t)
    const ledgeWidth = 44 + (1 - t) * 36
    positions.push({ x, y, width: ledgeWidth, reached: i < doneCount })
  }
  return positions
}

export function getClimberPosition(totalTasks, doneCount) {
  let x = RIGHT_BASE_X - 25
  let y = MOUNTAIN_BASE_Y - 25
  if (totalTasks > 0) {
    const idx = Math.min(doneCount, totalTasks)
    const t = (idx - 0.25) / totalTasks
    if (t > 0) {
      x = lerp(RIGHT_BASE_X, SUMMIT_X, t)
      y = lerp(MOUNTAIN_BASE_Y, SUMMIT_Y, t) - 12
    }
  }
  return { x, y }
}
