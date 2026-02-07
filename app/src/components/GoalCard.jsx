import { useState } from 'react'

export default function GoalCard({ currentGoal, onSetGoal }) {
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
    <div className="rounded-xl border border-slate-400/20 bg-sky-mid/90 backdrop-blur-md p-5">
      <h2 className="text-lg font-bold mb-1">Set your summit</h2>
      <p className="text-sm text-slate-400 mb-4">Your big goal — the peak you're climbing toward.</p>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
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
    </div>
  )
}
