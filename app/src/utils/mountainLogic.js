export function lerp(a, b, t) {
    return a + (b - a) * t
}

// New path specifically for the "Climber" to follow
// We'll define a series of points that look like they go up the mountain ridge
// The reference image has a main peak at roughly x=400, y=100 (top)
// We can have the climber start from the bottom left or right. 
// Let's assume they spiral up or go up the main ridge.
// For simplicity and matching the previous logic, let's go from bottom-right (or bottom-left) to the top.
// The previous logic was RIGHT_BASE to SUMMIT.
// Let's keep it similar but match the new visual curvature.

const POINTS = [
    { x: 700, y: 500 }, // Start at bottom right
    { x: 600, y: 400 },
    { x: 500, y: 250 },
    { x: 450, y: 180 },
    { x: 400, y: 100 }  // Summit
];

export function getClimberPosition(totalTasks, doneCount) {
    if (totalTasks === 0) return { x: 720, y: 500 };

    // Calculate progress 0 to 1
    const progress = Math.min(doneCount / totalTasks, 1);

    // Find which segment we are on
    // We have POINTS.length - 1 segments
    const totalSegments = POINTS.length - 1;
    const scaledProgress = progress * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
    const segmentT = scaledProgress - segmentIndex;

    const p1 = POINTS[segmentIndex];
    const p2 = POINTS[segmentIndex + 1];

    return {
        x: lerp(p1.x, p2.x, segmentT),
        y: lerp(p1.y, p2.y, segmentT)
    };
}

export function getLedgePositions(ledgeCount, doneCount) {
    const positions = [];
    // Use the same path logic to place ledges along the route
    for (let i = 0; i < ledgeCount; i++) {
        const t = i / (ledgeCount - 1 || 1);

        // Interpolate using the same multi-point logic
        const totalSegments = POINTS.length - 1;
        const scaledT = t * totalSegments;
        const idx = Math.min(Math.floor(scaledT), totalSegments - 1);
        const segT = scaledT - idx;

        const p1 = POINTS[idx];
        const p2 = POINTS[idx + 1];

        positions.push({
            x: lerp(p1.x, p2.x, segT),
            y: lerp(p1.y, p2.y, segT),
            reached: i < doneCount,
            width: 40 // Fixed width for simplicity or vary it
        });
    }
    return positions;
}
