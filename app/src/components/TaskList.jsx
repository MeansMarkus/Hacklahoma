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
    <div className="rounded-xl border border-slate-400/20 bg-sky-mid/90 backdrop-blur-md p-3">
      <h2 className="text-sm font-bold mb-0.5">Your ledges</h2>
      <p className="text-[0.7rem] text-slate-400 mb-2">Each task is a ledge. Complete them to climb higher.</p>
      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task (ledge)"
          maxLength={50}
          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-400/20 bg-sky-deep/60 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        />
        <button
          type="submit"
          className="px-2.5 py-1.5 min-h-[32px] rounded-md text-xs font-semibold bg-gradient-to-br from-gold-dim to-gold text-sky-deep hover:shadow-lg hover:shadow-gold/30 active:scale-[0.98] transition-all touch-manipulation"
        >
          Add
        </button>
      </form>
      <ul className="list-none">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-center gap-2 py-1.5 border-b border-slate-400/10 last:border-0 animate-slide-in ${
              task.done ? 'opacity-80' : ''
            }`}
          >
            <input
              type="checkbox"
              id={`task-${task.id}`}
              checked={task.done}
              onChange={() => onToggle(task.id)}
              className="w-3.5 h-3.5 min-w-[16px] min-h-[16px] accent-success cursor-pointer shrink-0"
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 cursor-pointer select-none text-xs ${task.done ? 'line-through text-slate-400' : ''}`}
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
