import { useState } from 'react'

const MAX_PROMPT_LENGTH = 200

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
  taskGenerationPrompt,
  onTaskGenerationPromptChange
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

  const handlePromptChange = (e) => {
    const text = e.target.value
    if (text.length <= MAX_PROMPT_LENGTH) {
      onTaskGenerationPromptChange(text)
    }
  }

  return (
    <div className="rounded-xl border border-slate-400/20 bg-sky-mid/90 backdrop-blur-md p-5">
      <h2 className="text-lg font-bold mb-1">Set your summit</h2>
      <p className="text-sm text-slate-400 mb-4">Name the goal you want to reach.</p>
      
      {/* Goal Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={currentGoal ? 'Change your goal' : 'e.g. Ship my hackathon project'}
          maxLength={60}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-400/20 bg-sky-deep/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 min-h-[44px] rounded-lg font-semibold bg-gradient-to-br from-gold-dim to-gold text-sky-deep hover:shadow-lg hover:shadow-gold/30 active:scale-[0.98] transition-all touch-manipulation"
        >
          Set goal
        </button>
      </form>

      {/* Generation Settings */}
      <div className="space-y-4 pt-4 border-t border-slate-700/50">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label className="text-sm font-medium text-slate-300">
              What should the steps focus on?
            </label>
            <span className="text-xs text-slate-500">
              {(taskGenerationPrompt || '').length}/{MAX_PROMPT_LENGTH}
            </span>
          </div>

          <textarea
            value={taskGenerationPrompt || ''}
            onChange={handlePromptChange}
            placeholder="Type the kind of work you want help with (e.g., research, outreach, writing, design)."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-400/20 bg-sky-deep/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none text-sm"
          />
        </div>

        <button
          type="button"
          onClick={onGenerateTasks}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 min-h-[44px] rounded-lg font-semibold bg-gradient-to-br from-slate-100 to-slate-200 text-sky-deep hover:shadow-lg hover:shadow-slate-200/40 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating steps...' : 'Generate steps'}
        </button>
      </div>

      {generateError ? (
        <p className="mt-3 text-sm text-rose-300">{generateError}</p>
      ) : null}
    </div>
  )
}
