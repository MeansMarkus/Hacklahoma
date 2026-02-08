import React, { useState } from 'react'

export default function MountainListTab({ mountains, currentId, onSelect, onDelete }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Toggle Button */}
            {/* Title Card (Toggle for Drawer) */}
            {/* Title Card (Toggle for Drawer) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-slate-900/80 text-white rounded-2xl hover:bg-slate-800/90 transition-all shadow-xl border border-slate-700/50 backdrop-blur-md flex items-center justify-between group ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                title="Switch Mountain"
            >
                <div className="flex flex-col items-start">
                    <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Current Expedition</span>
                    <span className="text-sm font-semibold text-cyan-400 max-w-[150px] truncate">
                        {mountains.find(m => m.id === currentId)?.goal || 'Untitled Mountain'}
                    </span>
                </div>

                {/* Chevron/Icon to indicate clickable */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>

            {/* Drawer */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-100">Expeditions</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {mountains.map((mountain, index) => {
                            const isActive = mountain.id === currentId
                            const progress = mountain.tasks.length > 0
                                ? Math.round((mountain.tasks.filter(t => t.done).length / mountain.tasks.length) * 100)
                                : 0

                            return (
                                <div
                                    key={mountain.id}
                                    onClick={() => onSelect(mountain.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all group relative ${isActive
                                        ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                        : 'bg-slate-800/50 border-transparent hover:bg-slate-700/50 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-semibold text-sm truncate pr-6 ${isActive ? 'text-cyan-400' : 'text-slate-300'
                                            }`}>
                                            {mountain.goal || 'Untitled Mountain'}
                                        </h3>
                                    </div>

                                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                                        <span>{mountain.tasks.length} tasks</span>
                                        <span>{progress}%</span>
                                    </div>

                                    {/* Delete Button (only if more than 1 mountain) */}
                                    {mountains.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm('Are you sure you want to delete this mountain?')) {
                                                    onDelete(mountain.id)
                                                }
                                            }}
                                            className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            title="Delete Mountain"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                        {mountains.length} Active Expeditions
                    </div>
                </div>
            </div>
        </>
    )
}
