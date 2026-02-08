import { MOTIVATION } from '../constants'

export default function MotivationCard({ goal, tasks, progress, className = '' }) {
  const total = tasks.length
  let text = MOTIVATION.empty
  if (goal && total === 0) text = MOTIVATION.goalOnly
  else if (total > 0 && progress === 0) text = MOTIVATION.hasTasks
  else if (total > 0) text = MOTIVATION.progress(progress)

  const isSummitReached = total > 0 && progress === 100

  return (
    <div
      className={`rounded-2xl border backdrop-blur-md px-4 py-2 flex items-center min-h-[4rem] ${isSummitReached
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-slate-900/80 border-slate-700/50'
        } ${className}`}
    >
      <p className="text-sm font-semibold text-slate-100 leading-snug">{text}</p>
    </div>
  )
}
