import { useState } from 'react'

export default function GoalCard({
  currentGoal,
  onSetGoal,
  onGenerateTasks,
  taskCount,
  onTaskCountChange,
  minTaskCount,
  maxTaskCount,
  isGenerating,
  generateError,
}) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e?.preventDefault()
    const text = value.trim()
    if (text) {
      onSetGoal(text)
      setValue('')
    }
  }

  return (
    <div className="rounded-xl border border-slate-400/20 bg-sky-mid/90 backdrop-blur-md p-3">
      <h2 className="text-sm font-bold mb-0.5">Set your summit</h2>
      <p className="text-[0.7rem] text-slate-400 mb-2">Your big goal — the peak you're climbing toward.</p>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={currentGoal ? 'Change your goal' : 'e.g. Ship my hackathon project'}
          maxLength={60}
          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-400/20 bg-sky-deep/60 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        />
        <button
          type="submit"
          className="px-2.5 py-1.5 min-h-[32px] rounded-md text-xs font-semibold bg-gradient-to-br from-gold-dim to-gold text-sky-deep hover:shadow-lg hover:shadow-gold/30 active:scale-[0.98] transition-all touch-manipulation"
        >
          Set goal
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[0.7rem] text-slate-300">
          Task count
          <input
            type="number"
            min={minTaskCount}
            max={maxTaskCount}
            value={taskCount}
            onChange={(e) => onTaskCountChange(e.target.value)}
            className="w-14 px-2 py-1 rounded-md border border-slate-400/20 bg-sky-deep/60 text-xs text-slate-100 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <button
          type="button"
          onClick={onGenerateTasks}
          disabled={isGenerating}
          className="px-2.5 py-1.5 min-h-[32px] rounded-md text-xs font-semibold bg-gradient-to-br from-slate-100 to-slate-200 text-sky-deep hover:shadow-lg hover:shadow-slate-200/40 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate ledges'}
        </button>
      </div>
      {generateError ? (
        <p className="mt-1.5 text-[0.7rem] text-rose-300">{generateError}</p>
      ) : null}
    </div>
  )
}
