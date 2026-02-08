import { useState, useEffect, useCallback, useMemo } from 'react'
// import Sky from './components/Sky' // Removed
import Mountain from './components/Mountain'
import GoalCard from './components/GoalCard'
import TaskList from './components/TaskList'
import CompletedTaskList from './components/CompletedTaskList'
import MotivationCard from './components/MotivationCard'
import SummitCelebration from './components/SummitCelebration'
import {
  STORAGE_KEY,
  MAX_ALTITUDE,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  DEFAULT_TASK_COUNT,
  MIN_TASK_COUNT,
  MAX_TASK_COUNT,
} from './constants'

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

function normalizeTaskText(text) {
  return text.trim().replace(/\s+/g, ' ')
}

function normalizeForCompare(text) {
  return normalizeTaskText(text).toLowerCase()
}

function extractJsonFromText(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response.')
  }
  return text.slice(start, end + 1)
}

export default function App() {
  const initialState = useMemo(() => loadState(), [])
  const [goal, setGoal] = useState(() => initialState.goal)
  const [tasks, setTasks] = useState(() => initialState.tasks)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const [taskCount, setTaskCount] = useState(DEFAULT_TASK_COUNT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showTasks, setShowTasks] = useState(true)

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

  const handleSetGoal = useCallback((text) => {
    // If we've reached the summit (all tasks done), setting a new goal implies a new adventure.
    // Reset tasks and celebration state.
    const doneCount = tasks.filter(t => t.done).length
    const total = tasks.length
    const summitReached = total > 0 && doneCount === total

    if (summitReached) {
      setTasks([])
      setCelebrated(false)
      setShowCelebration(false)
    }
    setGoal(text)
  }, [tasks])
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

  const handleTaskCountChange = useCallback((value) => {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    const clamped = Math.min(MAX_TASK_COUNT, Math.max(MIN_TASK_COUNT, parsed))
    setTaskCount(clamped)
  }, [])

  const handleGenerateTasks = useCallback(async () => {
    const trimmedGoal = goal.trim()
    if (!trimmedGoal) {
      setGenerateError('Set a goal before generating ledges.')
      return
    }

    setIsGenerating(true)
    setGenerateError('')

    const count = Math.min(MAX_TASK_COUNT, Math.max(MIN_TASK_COUNT, taskCount))
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          messages: [
            {
              role: 'system',
              content:
                'You are a planning assistant that generates actionable tasks. Return ONLY valid JSON. No markdown. No commentary.',
            },
            {
              role: 'user',
              content: `Goal: ${trimmedGoal}
Generate exactly ${count} tasks.
Constraints:
Tasks should be actionable, specific, and small (30-120 minutes).
Start each task with a verb.
No duplicates.
Keep each task text under 70 characters.
Order tasks from first-to-do to last-to-do.
Output schema exactly:
{ "tasks": [ { "text": "..." } ] }`,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error('Ollama request failed. Is Ollama running?')
      }

      const payload = await response.json()
      const rawContent = payload?.message?.content
      if (!rawContent || typeof rawContent !== 'string') {
        throw new Error('No response content from Ollama.')
      }

      const jsonText = extractJsonFromText(rawContent)
      const parsed = JSON.parse(jsonText)
      const incoming = Array.isArray(parsed?.tasks) ? parsed.tasks : null
      if (!incoming) {
        throw new Error('Invalid task list from model.')
      }

      const normalizedTasks = incoming
        .map((item) => (item && typeof item.text === 'string' ? item.text : ''))
        .map((text) => normalizeTaskText(text))
        .filter((text) => text.length > 0)
        .slice(0, count)

      setTasks((prev) => {
        const existing = new Set(prev.map((t) => normalizeForCompare(t.text)))
        const additions = []

        for (const text of normalizedTasks) {
          const key = normalizeForCompare(text)
          if (!existing.has(key)) {
            existing.add(key)
            additions.push({
              id: Date.now().toString(36) + Math.random().toString(36).slice(2),
              text,
              done: false,
            })
          }
        }

        return additions.length ? [...prev, ...additions] : prev
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate ledges.'
      setGenerateError(message)
    } finally {
      setIsGenerating(false)
    }
  }, [goal, taskCount])

  return (
    <>
      <div className={`relative min-h-screen overflow-hidden ${isSummitReached ? 'summit-reached' : ''}`}>
        {/* Fullscreen Mountain Background */}
        <Mountain goal={goal} tasks={tasks} onPhotoUpdate={handlePhotoUpdate} />

        {/* Header / Top Navigation */}
        <header className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
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
          className={`fixed top-20 right-4 w-[50rem] max-w-[calc(100vw-2rem)] z-50 transition-all duration-300 transform origin-top-right ${showTasks ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
            }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">

            {/* Header with Close Button */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <h2 className="text-xl font-bold text-slate-100">Expedition Log</h2>
              <button onClick={() => setShowTasks(false)} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Ledges (Active Tasks) */}
              <div className="flex flex-col gap-4">
                <TaskList
                  tasks={tasks.filter(t => !t.done).slice(0, 3)}
                  onToggle={handleToggleTask}
                  onRemove={handleRemoveTask}
                  onAdd={handleAddTask}
                  onPhotoUpdate={handlePhotoUpdate}
                />
                <div className="text-xs text-center text-slate-500 italic">
                  Showing top 3 active ledges
                </div>
              </div>

              {/* Right Column: Goal & History */}
              <div className="flex flex-col gap-4">
                <GoalCard
                  currentGoal={goal}
                  onSetGoal={handleSetGoal}
                  onGenerateTasks={handleGenerateTasks}
                  taskCount={taskCount}
                  onTaskCountChange={handleTaskCountChange}
                  minTaskCount={MIN_TASK_COUNT}
                  maxTaskCount={MAX_TASK_COUNT}
                  isGenerating={isGenerating}
                  generateError={generateError}
                />

                <CompletedTaskList
                  tasks={tasks.filter(t => t.done)}
                  onToggle={handleToggleTask}
                  onRemove={handleRemoveTask}
                />

                <MotivationCard goal={goal} tasks={tasks} progress={progress} />
              </div>
            </div>
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
