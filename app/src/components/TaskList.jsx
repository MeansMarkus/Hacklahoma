import { useState } from 'react'
import PhotoFlag from './PhotoFlag'

export default function TaskList({ tasks, onToggle, onRemove, onAdd, onPhotoUpdate }) {
  const [input, setInput] = useState('')

  const handleAdd = (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (text) {
      onAdd(text)
      setInput('')
    }
  }

  return (
    <div className="rounded-xl border border-slate-400/20 bg-sky-mid/90 backdrop-blur-md p-5">
      <h2 className="text-lg font-bold mb-1">Your steps</h2>
      <p className="text-sm text-slate-400 mb-4">Keep each step small and concrete.</p>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a step"
          maxLength={50}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-400/20 bg-sky-deep/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 min-h-[44px] rounded-lg font-semibold bg-gradient-to-br from-gold-dim to-gold text-sky-deep hover:shadow-lg hover:shadow-gold/30 active:scale-[0.98] transition-all touch-manipulation"
        >
          Add
        </button>
      </form>
      <ul className="list-none">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-center gap-3 py-2.5 border-b border-slate-400/10 last:border-0 animate-slide-in ${
              task.done ? 'opacity-80' : ''
            }`}
          >
            <input
              type="checkbox"
              id={`task-${task.id}`}
              checked={task.done}
              onChange={() => onToggle(task.id)}
              className="w-5 h-5 min-w-[22px] min-h-[22px] accent-success cursor-pointer shrink-0"
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 cursor-pointer select-none ${task.done ? 'line-through text-slate-400' : ''}`}
            >
              {task.text}
            </label>
            <PhotoFlag
              taskId={task.id}
              photo={task.photo}
              onPhotoUpdate={onPhotoUpdate}
            />
            <button
              type="button"
              onClick={() => onRemove(task.id)}
              className="p-1 text-slate-400 hover:text-red-400 hover:opacity-100 opacity-60 transition-colors"
              aria-label="Remove task"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
