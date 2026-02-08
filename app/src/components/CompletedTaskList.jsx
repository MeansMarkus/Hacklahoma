import { useState } from 'react'

export default function CompletedTaskList({ tasks, onToggle, onRemove }) {
    const [isOpen, setIsOpen] = useState(false)

    if (tasks.length === 0) return null

    return (
        <div className="rounded-xl border border-slate-400/20 bg-slate-900/50 backdrop-blur-md overflow-hidden transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-emerald-400">🏆</span>
                    <span className="font-bold text-slate-300">Past Victories</span>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            {isOpen && (
                <ul className="border-t border-slate-400/10 bg-slate-900/30">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className="flex items-center gap-3 p-3 border-b border-slate-400/5 last:border-0 hover:bg-slate-800/30 transition-colors group"
                        >
                            <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => onToggle(task.id)}
                                className="w-4 h-4 accent-emerald-500 cursor-pointer opacity-60 hover:opacity-100"
                            />
                            <span className="flex-1 text-sm text-slate-500 line-through decoration-slate-600 select-none">
                                {task.text}
                            </span>
                            <button
                                onClick={() => onRemove(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                                aria-label="Remove task"
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
