import { useState, useEffect, useCallback } from 'react'
import Sky from './components/Sky'
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
  } catch (_) {}
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
  const [goal, setGoal] = useState('')
  const [tasks, setTasks] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrated, setCelebrated] = useState(false)

  useEffect(() => {
    const { goal: g, tasks: t } = loadState()
    setGoal(g)
    setTasks(t)
  }, [])

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

  return (
    <>
      <Sky />
      <div className={`relative z-10 ${isSummitReached ? 'summit-reached' : ''}`}>
        <Header progress={progress} altitude={altitude} />
        <main className="grid grid-cols-1 gap-6 px-4 pb-8 max-w-6xl mx-auto md:grid-cols-[1.2fr_1fr] md:items-start">
          <section className="mountain-section">
            <Mountain goal={goal} tasks={tasks} />
          </section>
          <section className="flex flex-col gap-4">
            <GoalCard currentGoal={goal} onSetGoal={handleSetGoal} />
            <TaskList
              tasks={tasks}
              onToggle={handleToggleTask}
              onRemove={handleRemoveTask}
              onAdd={handleAddTask}
            />
            <MotivationCard goal={goal} tasks={tasks} progress={progress} />
          </section>
        </main>
        <footer className="relative z-10 text-center py-4 text-sm text-slate-400">
          Hacklahoma — Life as a Mountain · Reach new heights, one ledge at a time.
        </footer>
      </div>
      <SummitCelebration
        show={showCelebration}
        onDone={() => setShowCelebration(false)}
      />
    </>
  )
}
