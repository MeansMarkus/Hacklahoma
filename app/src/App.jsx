import { useState, useEffect, useCallback, useMemo } from 'react'
// import Sky from './components/Sky' // Removed
import Header from './components/Header'
import Mountain from './components/Mountain'
import GoalCard from './components/GoalCard'
import TaskList from './components/TaskList'
import MotivationCard from './components/MotivationCard'
import SummitCelebration from './components/SummitCelebration'
import { STORAGE_KEY, MAX_ALTITUDE } from './constants'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        goal: parsed.goal || '',
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      }
    }
  } catch (_) { }
  return { goal: '', tasks: [] }
}

function saveState(goal, tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ goal, tasks }))
}

function getProgress(tasks) {
  const total = tasks.length
  if (total === 0) return 0
  const done = tasks.filter((t) => t.done).length
  return Math.round((done / total) * 100)
}

function getAltitude(tasks) {
  const total = tasks.length
  if (total === 0) return 0
  const done = tasks.filter((t) => t.done).length
  return Math.round((done / total) * MAX_ALTITUDE)
}

export default function App() {
  const initialState = useMemo(() => loadState(), [])
  const [goal, setGoal] = useState(() => initialState.goal)
  const [tasks, setTasks] = useState(() => initialState.tasks)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const [showTasks, setShowTasks] = useState(true) // Default open initially? Or closed. Let's say true to discoverable first time.

  useEffect(() => {
    saveState(goal, tasks)
  }, [goal, tasks])

  const progress = getProgress(tasks)
  const altitude = getAltitude(tasks)
  const isSummitReached = tasks.length > 0 && progress === 100

  useEffect(() => {
    if (isSummitReached && !celebrated) {
      setShowCelebration(true)
      setCelebrated(true)
    }
    if (!isSummitReached) setCelebrated(false)
  }, [isSummitReached, celebrated])

  const handleSetGoal = useCallback((text) => setGoal(text), [])
  const handleAddTask = useCallback((text) => {
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        text,
        done: false,
      },
    ])
  }, [])
  const handleToggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }, [])
  const handleRemoveTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handlePhotoUpdate = useCallback((id, photoData) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, photo: photoData } : t))
    )
  }, [])

  return (
    <>

      <div className={`relative min-h-screen overflow-hidden ${isSummitReached ? 'summit-reached' : ''}`}>
        {/* Fullscreen Mountain Background */}
        <Mountain goal={goal} tasks={tasks} onPhotoUpdate={handlePhotoUpdate} />

        {/* Header / Top Navigation */}
        <header className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
            {/* Existing Header logic could go here or be simplified */}
            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-xl inline-flex flex-col gap-1">
              <div className="text-xs text-slate-400 font-bold tracking-wider uppercase">Altitude</div>
              <div className="text-2xl font-mono text-cyan-400">{altitude}m</div>
              <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowTasks((prev) => !prev)}
            className="pointer-events-auto bg-slate-800/90 text-white p-3 rounded-full hover:bg-slate-700 transition-colors shadow-lg border border-slate-600 backdrop-blur-sm group"
            title="Toggle Tasks"
          >
            {/* Hamburger Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </header>

        {/* Task Dropdown / Overlay */}
        <div
          className={`fixed top-20 right-4 w-96 max-w-[calc(100vw-2rem)] z-50 transition-all duration-300 transform origin-top-right ${showTasks ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
            }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <h2 className="text-lg font-bold text-slate-100">Expedition Log</h2>
              <button onClick={() => setShowTasks(false)} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            <GoalCard currentGoal={goal} onSetGoal={handleSetGoal} />
            <TaskList
              tasks={tasks}
              onToggle={handleToggleTask}
              onRemove={handleRemoveTask}
              onAdd={handleAddTask}
              onPhotoUpdate={handlePhotoUpdate}
            />
            <MotivationCard goal={goal} tasks={tasks} progress={progress} />
          </div>
        </div>
      </div>
      <SummitCelebration
        show={showCelebration}
        onDone={() => setShowCelebration(false)}
      />
    </>
  )
}
