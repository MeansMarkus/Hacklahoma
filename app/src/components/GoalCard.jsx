import { useState } from 'react'

const PROMPT_SUGGESTIONS = [
  "Project deliverables",
  "Learning plan",
  "Tiny 30–60 min tasks",
  "Real-world outreach"
]

const MAX_PROMPT_LENGTH = 500

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

  const appendPrompt = (suggestion) => {
    const current = taskGenerationPrompt || ''
    // If current is not empty and doesn't end with whitespace, add a comma and space
    const separator = current.length > 0 && !/\s$/.test(current) ? ', ' : ''
    const newValue = current + separator + suggestion
    if (newValue.length <= MAX_PROMPT_LENGTH) {
      onTaskGenerationPromptChange(newValue)
    }
  }

  return (
    <div className="rounded-xl border border-slate-400/20 bg-sky-mid/90 backdrop-blur-md p-5">
      <h2 className="text-lg font-bold mb-1">Set your summit</h2>
      <p className="text-sm text-slate-400 mb-4">Your big goal — the peak you're climbing toward.</p>
      
      {/* Goal Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
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
              Task generation prompt
            </label>
            <span className="text-xs text-slate-500">
              {(taskGenerationPrompt || '').length}/{MAX_PROMPT_LENGTH}
            </span>
          </div>
          
          <textarea
            value={taskGenerationPrompt || ''}
            onChange={handlePromptChange}
            placeholder="e.g. 'Project-based steps with concrete deliverables', 'interview prep', 'marketing outreach'..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-400/20 bg-sky-deep/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none text-sm"
          />
          
          <div className="flex flex-wrap gap-2 mt-2">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => appendPrompt(suggestion)}
                className="px-2 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Task count
            <input
              type="number"
              min={minTaskCount}
              max={maxTaskCount}
              value={taskCount}
              onChange={(e) => onTaskCountChange(e.target.value)}
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-400/20 bg-sky-deep/60 text-slate-100 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-center"
            />
          </label>
          
          <button
            type="button"
            onClick={onGenerateTasks}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 min-h-[44px] rounded-lg font-semibold bg-gradient-to-br from-slate-100 to-slate-200 text-sky-deep hover:shadow-lg hover:shadow-slate-200/40 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate ledges'}
          </button>
        </div>
      </div>

      {generateError ? (
        <p className="mt-3 text-sm text-rose-300">{generateError}</p>
      ) : null}
    </div>
  )
}
