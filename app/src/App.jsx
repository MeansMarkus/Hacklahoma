import { useState, useEffect, useCallback, useMemo } from 'react'
// import Sky from './components/Sky' // Removed
import Mountain3D from './components/Mountain3D'
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

      // New format: { mountains: [...], currentIndex: 0 }
      if (parsed.mountains && Array.isArray(parsed.mountains)) {
        return {
          mountains: parsed.mountains,
          currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0
        }
      }

      // Old format migration: { goal: '...', tasks: [...] }
      return {
        mountains: [{
          id: 'default',
          goal: parsed.goal || '',
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : []
        }],
        currentIndex: 0
      }
    }
  } catch (_) { }

  // Default empty state
  return {
    mountains: [{ id: Date.now().toString(), goal: '', tasks: [] }],
    currentIndex: 0
  }
}

function saveState(mountains, currentIndex) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ mountains, currentIndex }))
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
  const [mountains, setMountains] = useState(() => initialState.mountains)
  const [currentMountainIndex, setCurrentMountainIndex] = useState(() => initialState.currentIndex)

  const currentMountain = mountains[currentMountainIndex] || mountains[0]
  const goal = currentMountain.goal
  const tasks = currentMountain.tasks

  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const [taskCount, setTaskCount] = useState(DEFAULT_TASK_COUNT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showTasks, setShowTasks] = useState(true)
  const [showMountainList, setShowMountainList] = useState(false)

  useEffect(() => {
    saveState(mountains, currentMountainIndex)
  }, [mountains, currentMountainIndex])

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

  const handleNextMountain = useCallback(() => {
    const nextIndex = currentMountainIndex + 1;
    if (nextIndex < mountains.length) {
      setCurrentMountainIndex(nextIndex);
    } else {
      // Create new mountain
      setMountains(prev => [...prev, { id: Date.now().toString(), goal: '', tasks: [] }]);
      setCurrentMountainIndex(nextIndex);
    }
    // Reset generic UI states when switching
    setShowCelebration(false);
    setCelebrated(false);
  }, [currentMountainIndex, mountains.length]);

  const handlePrevMountain = useCallback(() => {
    if (currentMountainIndex > 0) {
      setCurrentMountainIndex(currentMountainIndex - 1);
      setShowCelebration(false);
      setCelebrated(false);
    }
  }, [currentMountainIndex]);

  const updateCurrentMountain = useCallback((updater) => {
    setMountains(prev => {
      const newMountains = [...prev];
      newMountains[currentMountainIndex] = updater(newMountains[currentMountainIndex]);
      return newMountains;
    });
  }, [currentMountainIndex]);

  const handleSetGoal = useCallback((text) => {
    const doneCount = tasks.filter(t => t.done).length
    const total = tasks.length
    const summitReached = total > 0 && doneCount === total

    if (summitReached) {
      updateCurrentMountain(m => ({ ...m, tasks: [], goal: text }));
      setCelebrated(false)
      setShowCelebration(false)
    } else {
      updateCurrentMountain(m => ({ ...m, goal: text }));
    }
  }, [tasks, updateCurrentMountain])

  const handleAddTask = useCallback((text) => {
    updateCurrentMountain(m => ({
      ...m,
      tasks: [...m.tasks, {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        text,
        done: false,
      }]
    }));
  }, [updateCurrentMountain])

  const handleToggleTask = useCallback((id) => {
    updateCurrentMountain(m => ({
      ...m,
      tasks: m.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    }));
  }, [updateCurrentMountain])

  const handleRemoveTask = useCallback((id) => {
    updateCurrentMountain(m => ({
      ...m,
      tasks: m.tasks.filter((t) => t.id !== id)
    }));
  }, [updateCurrentMountain])

  const handlePhotoUpdate = useCallback((id, photoData) => {
    updateCurrentMountain(m => ({
      ...m,
      tasks: m.tasks.map((t) => (t.id === id ? { ...t, photo: photoData } : t))
    }));
  }, [updateCurrentMountain])

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

        .slice(0, count)

      updateCurrentMountain(m => {
        const existing = new Set(m.tasks.map((t) => normalizeForCompare(t.text)))
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

        return additions.length ? { ...m, tasks: [...m.tasks, ...additions] } : m
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate ledges.'
      setGenerateError(message)
    } finally {
      setIsGenerating(false)
    }
  }, [goal, taskCount, updateCurrentMountain])

  return (
    <>
      <div className={`relative min-h-screen overflow-hidden ${isSummitReached ? 'summit-reached' : ''}`}>

        {/* Navigation Arrows */}
        <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-between px-4">
          {/* Left Arrow */}
          <button
            onClick={handlePrevMountain}
            className={`pointer-events-auto p-3 rounded-full bg-slate-800/50 backdrop-blur-sm text-white border border-slate-600/50 transition-all hover:bg-slate-700/80 hover:scale-110 ${currentMountainIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 shadow-xl'}`}
            disabled={currentMountainIndex === 0}
            title="Previous Mountain"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNextMountain}
            className="pointer-events-auto p-3 rounded-full bg-slate-800/50 backdrop-blur-sm text-white border border-slate-600/50 transition-all hover:bg-slate-700/80 hover:scale-110 shadow-xl"
            title={currentMountainIndex === mountains.length - 1 ? "Start New Mountain" : "Next Mountain"}
          >
            {currentMountainIndex === mountains.length - 1 ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mountain Indicator */}
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-slate-900/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/50 text-xs font-semibold text-slate-300 shadow-lg">
            Mountain {currentMountainIndex + 1} {currentMountainIndex + 1 > mountains.length ? '(New)' : ''}
          </div>
        </div>


        {/* Fullscreen 3D Mountain Background */}
        <Mountain3D goal={goal} tasks={tasks} onPhotoUpdate={handlePhotoUpdate} />

        {/* Header / Top Navigation */}
        <header className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">

          {/* Left Side: Mountain List Toggle & Altitude */}
          <div className="flex flex-col gap-4 pointer-events-auto">
            <button
              onClick={() => setShowMountainList(!showMountainList)}
              className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-xl text-slate-100 hover:bg-slate-800 transition-colors flex items-center gap-2 group self-start"
              title="My Expeditions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span className="font-semibold text-sm hidden group-hover:inline-block animate-slide-in">Expeditions</span>
            </button>

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

        {/* Mountain List Sidebar */}
        <div
          className={`fixed top-20 left-4 w-72 max-w-[calc(100vw-2rem)] z-50 transition-all duration-300 transform origin-top-left ${showMountainList ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-4 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h2 className="text-lg font-bold text-slate-100">My Expeditions</h2>
              <button onClick={() => setShowMountainList(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex flex-col gap-2">
              {mountains.map((m, idx) => {
                const mProgress = getProgress(m.tasks);
                return (
                  <button
                    key={m.id}
                    onClick={() => { setCurrentMountainIndex(idx); setShowMountainList(false); }}
                    className={`text-left p-3 rounded-xl border transition-all group ${currentMountainIndex === idx
                        ? 'bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/20'
                        : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${currentMountainIndex === idx ? 'text-cyan-400' : 'text-slate-500'}`}>
                        Mountain {idx + 1}
                      </span>
                      {currentMountainIndex === idx && <span className="text-xs text-cyan-400">Active</span>}
                    </div>
                    <div className="font-medium text-slate-200 truncate text-sm mb-1.5">
                      {m.goal || "Untitled Expedition"}
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${mProgress === 100 ? 'bg-emerald-400' : 'bg-cyan-500'}`}
                        style={{ width: `${mProgress}%` }}
                      />
                    </div>
                  </button>
                )
              })}

              <button
                onClick={() => {
                  setMountains(prev => [...prev, { id: Date.now().toString(), goal: '', tasks: [] }]);
                  setCurrentMountainIndex(mountains.length);
                  setShowMountainList(false);
                }}
                className="mt-2 p-3 rounded-xl border border-dashed border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/30 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <span>+</span> Start New Expedition
              </button>
            </div>
          </div>
        </div>

        {/* Task Dropdown / Overlay */}
        <div
          className={`fixed top-20 right-4 w-[25rem] max-w-[calc(100vw-2rem)] z-50 transition-all duration-300 transform origin-top-right ${showTasks ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
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

            <div className="flex flex-col gap-6">

              {/* Top: Set Your Summit (Goal) */}
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

              {/* Middle: Ledges (Active Tasks) */}
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

              {/* Bottom: History & Motivation */}
              <div className="flex flex-col gap-4">
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
