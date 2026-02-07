import { MOTIVATION } from '../constants'

export default function MotivationCard({ goal, tasks, progress }) {
  const total = tasks.length
  let text = MOTIVATION.empty
  if (goal && total === 0) text = MOTIVATION.goalOnly
  else if (total > 0 && progress === 0) text = MOTIVATION.hasTasks
  else if (total > 0) text = MOTIVATION.progress(progress)

  const isSummitReached = total > 0 && progress === 100

  return (
    <div
      className={`rounded-xl border backdrop-blur-md p-5 ${
        isSummitReached
          ? 'bg-success/20 border-success/40'
          : 'bg-accent/10 border-accent/25 border-sky-mid/90'
      }`}
    >
      <p className="text-[0.95rem] font-medium text-slate-100 leading-relaxed">{text}</p>
    </div>
  )
}
