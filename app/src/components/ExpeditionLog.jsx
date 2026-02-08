import { useState } from 'react'
import PhotoFlag from './PhotoFlag'

const MAX_PROMPT_LENGTH = 200

export default function ExpeditionLog({
    currentGoal,
    tasks,
    onSetGoal,
    onGenerateTasks,
    taskCount,
    onTaskCountChange,
    minTaskCount,
    maxTaskCount,
    isGenerating,
    generateError,
    taskGenerationPrompt,
    onTaskGenerationPromptChange,
    onToggle,
    onRemove,
    onAdd,
    onPhotoUpdate
}) {
    const [activeTab, setActiveTab] = useState('climb') // 'climb', 'summit', 'log'
    const [taskInput, setTaskInput] = useState('')
    const [goalInput, setGoalInput] = useState('')

    // Handlers
    const handleAddTask = (e) => {
        e?.preventDefault()
        const text = taskInput.trim()
        if (text) {
            onAdd(text)
            setTaskInput('')
        }
    }

    const handleSetGoal = (e) => {
        e?.preventDefault()
        const text = goalInput.trim() || currentGoal
        if (text) {
            onSetGoal(text)
            setGoalInput('')
        }
    }

    const activeTasks = tasks.filter(t => !t.done)
    const completedTasks = tasks.filter(t => t.done)

    return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[80vh]">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-800/80">
                <button
                    onClick={() => setActiveTab('climb')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'climb'
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                        }`}
                >
                    Climb ({activeTasks.length})
                </button>
                <button
                    onClick={() => setActiveTab('summit')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'summit'
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                        }`}
                >
                    Summit
                </button>
                <button
                    onClick={() => setActiveTab('log')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'log'
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                        }`}
                >
                    Log ({completedTasks.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">

                {/* CLIMB TAB */}
                {activeTab === 'climb' && (
                    <div className="flex flex-col gap-4">
                        <form onSubmit={handleAddTask} className="flex gap-2">
                            <input
                                type="text"
                                value={taskInput}
                                onChange={(e) => setTaskInput(e.target.value)}
                                placeholder="Add a new step..."
                                maxLength={60}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm"
                            />
                            <button
                                type="submit"
                                className="px-3 py-2 rounded-lg font-semibold bg-cyan-600 text-white hover:bg-cyan-500 active:scale-95 transition-all text-sm whitespace-nowrap"
                            >
                                Add
                            </button>
                        </form>

                        {activeTasks.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm italic">
                                No active steps. Add one or generate a plan!
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {activeTasks.slice(0, 3).map(task => (
                                    <li
                                        key={task.id}
                                        className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600 transition-all"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={task.done}
                                            onChange={() => onToggle(task.id)}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                                        />
                                        <span className="flex-1 text-slate-200 text-sm">{task.text}</span>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <PhotoFlag
                                                taskId={task.id}
                                                photo={task.photo}
                                                onPhotoUpdate={onPhotoUpdate}
                                            />
                                            <button
                                                onClick={() => onRemove(task.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {activeTasks.length > 3 && (
                                    <div className="text-center text-xs text-slate-500 italic mt-2">
                                        And {activeTasks.length - 3} more...
                                    </div>
                                )}
                            </ul>
                        )}
                    </div>
                )}

                {/* SUMMIT TAB */}
                {activeTab === 'summit' && (
                    <div className="flex flex-col gap-6">
                        {/* Goal Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Goal</label>
                            <form onSubmit={handleSetGoal} className="flex gap-2">
                                <input
                                    type="text"
                                    defaultValue={currentGoal}
                                    onBlur={(e) => setGoalInput(e.target.value)}
                                    placeholder="Set your summit goal..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-2 rounded-lg font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600 active:scale-95 transition-all text-sm whitespace-nowrap"
                                >
                                    Update
                                </button>
                            </form>
                        </div>

                        {/* AI Generation */}
                        <div className="space-y-3 pt-4 border-t border-slate-800">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Assistant</label>
                                <span className="text-xs text-slate-600">
                                    {(taskGenerationPrompt || '').length}/{MAX_PROMPT_LENGTH}
                                </span>
                            </div>

                            <textarea
                                value={taskGenerationPrompt || ''}
                                onChange={(e) => onTaskGenerationPromptChange(e.target.value)}
                                placeholder="Describe how you want help (e.g., 'Break it down into small research tasks')..."
                                rows={3}
                                maxLength={MAX_PROMPT_LENGTH}
                                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none text-sm"
                            />

                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500 block mb-1">Steps to generate: {taskCount}</label>
                                    <input
                                        type="range"
                                        min={minTaskCount}
                                        max={maxTaskCount}
                                        value={taskCount}
                                        onChange={(e) => onTaskCountChange(e.target.value)}
                                        className="w-full accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onGenerateTasks}
                                disabled={isGenerating || !currentGoal}
                                className="w-full py-2.5 rounded-lg font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating Plan...
                                    </>
                                ) : (
                                    'Generate New Plan'
                                )}
                            </button>
                            {generateError && <p className="text-xs text-red-400">{generateError}</p>}
                        </div>
                    </div>
                )}

                {/* LOG TAB */}
                {activeTab === 'log' && (
                    <div className="flex flex-col gap-2">
                        {completedTasks.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm italic">
                                No completed tasks yet. Keep climbing!
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-1">
                                {completedTasks.map(task => (
                                    <li
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/20 border border-slate-800"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={task.done}
                                            onChange={() => onToggle(task.id)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer opacity-70 hover:opacity-100"
                                        />
                                        <span className="flex-1 text-slate-500 line-through text-sm select-none">{task.text}</span>
                                        <button
                                            onClick={() => onRemove(task.id)}
                                            className="p-1 px-2 text-slate-600 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors text-xs"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
