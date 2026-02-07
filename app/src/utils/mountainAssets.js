export const MOUNTAIN_PATHS = {
  // Main mountain shape (background silhouette/base)
  base: "M 0 500 L 0 450 L 100 400 L 250 250 L 400 100 L 550 250 L 650 300 L 800 200 L 800 500 Z",
  
  // The detailed mountain shapes
  // Split into left (light/snow) and right (shadow/rock)
  
  // Main Peak (Center)
  mainPeak: {
    // Left side - Snowy/Light
    light: "M 100 500 L 250 350 L 350 180 L 400 100 L 420 220 L 380 300 L 450 400 L 400 500 Z",
    // Right side - Shadow/Rock
    shadow: "M 400 100 L 420 220 L 380 300 L 450 400 L 400 500 L 600 500 L 550 350 L 500 250 L 400 100 Z",
    // Snow cap detail
    snowCap: "M 400 100 L 370 160 L 400 190 L 430 150 Z"
  },

  // Secondary Peak (Right)
  secondaryPeak: {
    light: "M 500 500 L 550 350 L 620 280 L 650 350 L 600 500 Z",
    shadow: "M 620 280 L 750 400 L 800 450 L 800 500 L 600 500 Z"
  }
};

// Generate some random star positions
export const STARS = Array.from({ length: 50 }, () => ({
  x: Math.random() * 800,
  y: Math.random() * 300,
  opacity: Math.random() * 0.8 + 0.2,
  size: Math.random() * 2 + 0.5
}));

// Tree silhouettes for the foreground
export const TREES_FRONT = [
  { x: 50, h: 120 }, { x: 120, h: 150 }, { x: 200, h: 100 }, 
  { x: 300, h: 80 }, { x: 360, h: 110 }, { x: 450, h: 90 },
  { x: 550, h: 140 }, { x: 650, h: 160 }, { x: 750, h: 130 }
];

export const TREES_BACK = [
  { x: 0, h: 100 }, { x: 80, h: 120 }, { x: 160, h: 80 },
  { x: 250, h: 110 }, { x: 330, h: 140 }, { x: 400, h: 90 },
  { x: 500, h: 120 }, { x: 600, h: 140 }, { x: 700, h: 100 },
  { x: 780, h: 110 }
];
