import { useState, useEffect, useCallback, useMemo } from 'react'
import Sky from './components/Sky'
import Header from './components/Header'
import Mountain from './components/Mountain'
import GoalCard from './components/GoalCard'
import TaskList from './components/TaskList'
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
      <Sky />
      <div className={`relative z-10 ${isSummitReached ? 'summit-reached' : ''}`}>
        <Header progress={progress} altitude={altitude} />
        <main className="grid grid-cols-1 gap-6 px-4 pb-8 max-w-6xl mx-auto md:grid-cols-[1.2fr_1fr] md:items-start">
          <section className="mountain-section">
            <Mountain goal={goal} tasks={tasks} onPhotoUpdate={handlePhotoUpdate} />
          </section>
          <section className="flex flex-col gap-4">
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
            <TaskList
              tasks={tasks}
              onToggle={handleToggleTask}
              onRemove={handleRemoveTask}
              onAdd={handleAddTask}
              onPhotoUpdate={handlePhotoUpdate}
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
