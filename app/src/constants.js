export const STORAGE_KEY = 'life-as-a-mountain'
export const MAX_ALTITUDE = 4000

export const MOTIVATION = {
  empty: "Set your summit and add ledges. Every step takes you higher.",
  goalOnly: "Add tasks — each one is a ledge on your way to the summit.",
  hasTasks: "Complete tasks to climb. You've got this.",
  progress: (p) => {
    if (p <= 25) return "You're on the trail. Keep moving."
    if (p <= 50) return "Halfway up — the view is already changing."
    if (p <= 75) return "So close. One ledge at a time."
    if (p < 100) return "The summit is right there. Finish strong."
    return "You reached the summit. New heights unlocked."
  },
}
