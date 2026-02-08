import { useState, useEffect, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'
import { auth, db, storage, firebaseReady } from './firebase'
import Mountain3D from './components/Mountain3D'
import GoalCard from './components/GoalCard'
import TaskList from './components/TaskList'
import CompletedTaskList from './components/CompletedTaskList'
import MotivationCard from './components/MotivationCard'
import SummitCelebration from './components/SummitCelebration'
import LoginScreen from './components/LoginScreen'
import NavigationArrows from './components/NavigationArrows'
import MountainListTab from './components/MountainListTab'
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  MAX_ALTITUDE,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  DEFAULT_TASK_COUNT,
  MIN_TASK_COUNT,
  MAX_TASK_COUNT,
} from './constants'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const timeOfDay = typeof parsed.timeOfDay === 'string' ? parsed.timeOfDay : 'night'

      // Migration check: if 'mountains' exists, return it, else migrate single goal
      if (Array.isArray(parsed.mountains)) {
        return {
          mountains: parsed.mountains,
          currentMountainId: parsed.currentMountainId || parsed.mountains[0]?.id,
          taskGenerationPrompt: parsed.taskGenerationPrompt || '',
          timeOfDay
        }
      }

      // Old format migration (Single goal -> Array of mountains)
      const initialMountain = {
        id: generateId(),
        goal: parsed.goal || '',
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        createdAt: Date.now()
      }
      return {
        mountains: [initialMountain],
        currentMountainId: initialMountain.id,
        taskGenerationPrompt: parsed.taskGenerationPrompt || '',
        timeOfDay
      }
    }
  } catch (_) { }

  // Default fresh state
  const newMountain = { id: generateId(), goal: '', tasks: [], createdAt: Date.now() }
  return {
    mountains: [newMountain],
    currentMountainId: newMountain.id,
    taskGenerationPrompt: '',
    timeOfDay: 'night'
  }
}

function saveState(mountains, currentMountainId, taskGenerationPrompt, timeOfDay) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: STORAGE_VERSION,
    mountains,
    currentMountainId,
    taskGenerationPrompt,
    timeOfDay
  }))
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
  const [mountains, setMountains] = useState([])
  const [currentMountainId, setCurrentMountainId] = useState(null)

  // Note: taskGenerationPrompt is basically a user preference, so it can remain global 
  // rather than per-mountain for now, unless requested otherwise.
  const [taskGenerationPrompt, setTaskGenerationPrompt] = useState('')

  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const [taskCount, setTaskCount] = useState(DEFAULT_TASK_COUNT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showTasks, setShowTasks] = useState(true)
  const [timeOfDay, setTimeOfDay] = useState('night')
  const [user, setUser] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Initialization & Auth
  useEffect(() => {
    if (!firebaseReady) {
      const local = loadState()
      setMountains(local.mountains)
      setCurrentMountainId(local.currentMountainId)
      setTaskGenerationPrompt(local.taskGenerationPrompt)
      setTimeOfDay(local.timeOfDay)
      setIsHydrated(true)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      try {
        if (nextUser) {
          const docRef = doc(db, 'users', nextUser.uid, 'state', 'current')
          const snapshot = await getDoc(docRef)

          if (snapshot.exists()) {
            const data = snapshot.data() || {}

            // Handle migration from single goal to mountains array
            if (Array.isArray(data.mountains)) {
              setMountains(data.mountains)
              setCurrentMountainId(data.currentMountainId || data.mountains[0]?.id)
              setTaskGenerationPrompt(data.taskGenerationPrompt || '')
              setTimeOfDay(typeof data.timeOfDay === 'string' ? data.timeOfDay : 'night')
            } else {
              // Migrate existing single goal
              const initialMountain = {
                id: generateId(),
                goal: typeof data.goal === 'string' ? data.goal : '',
                tasks: Array.isArray(data.tasks) ? data.tasks : [],
                createdAt: Date.now()
              }
              setMountains([initialMountain])
              setCurrentMountainId(initialMountain.id)
              setTaskGenerationPrompt(typeof data.taskGenerationPrompt === 'string' ? data.taskGenerationPrompt : '')
              setTimeOfDay(typeof data.timeOfDay === 'string' ? data.timeOfDay : 'night')
            }
          } else {
            // New user, create initial mountain
            const newMountain = { id: generateId(), goal: '', tasks: [], createdAt: Date.now() }
            const initialData = {
              mountains: [newMountain],
              currentMountainId: newMountain.id,
              taskGenerationPrompt: '',
              timeOfDay: 'night',
              updatedAt: serverTimestamp(),
            }
            await setDoc(docRef, initialData)
            setMountains(initialData.mountains)
            setCurrentMountainId(initialData.currentMountainId)
            setTaskGenerationPrompt('')
            setTimeOfDay(initialData.timeOfDay)
          }
        } else {
          const local = loadState()
          setMountains(local.mountains)
          setCurrentMountainId(local.currentMountainId)
          setTaskGenerationPrompt(local.taskGenerationPrompt)
          setTimeOfDay(local.timeOfDay)
        }
      } catch (error) {
        console.error('Failed to load user state', error)
      } finally {
        setIsHydrated(true)
      }
    })

    return () => unsubscribe()
  }, [])

  // Persistence (Save on Change)
  useEffect(() => {
    if (!isHydrated) return

    if (firebaseReady && user) {
      const docRef = doc(db, 'users', user.uid, 'state', 'current')
      const payload = {
        mountains,
        currentMountainId,
        taskGenerationPrompt,
        timeOfDay,
        updatedAt: serverTimestamp()
      }
      const timeout = setTimeout(() => {
        setDoc(docRef, payload, { merge: true }).catch((error) => {
          console.error('Failed to save user state', error)
        })
      }, 400)

      return () => clearTimeout(timeout)
    }

    saveState(mountains, currentMountainId, taskGenerationPrompt, timeOfDay)
  }, [mountains, currentMountainId, taskGenerationPrompt, timeOfDay, user, isHydrated, firebaseReady])

  // Derive Current Mountain Data
  const currentMountainIndex = mountains.findIndex(m => m.id === currentMountainId)
  const currentMountain = mountains[currentMountainIndex] || { goal: '', tasks: [] }
  const { goal, tasks } = currentMountain

  const progress = getProgress(tasks)
  const altitude = getAltitude(tasks)
  const isSummitReached = tasks.length > 0 && progress === 100
  const showLogin = firebaseReady && !user

  // Celebration Check
  useEffect(() => {
    if (isSummitReached && !celebrated) {
      setShowCelebration(true)
      setCelebrated(true)
    }
    if (!isSummitReached) setCelebrated(false)
  }, [isSummitReached, celebrated])


  // --- Mountain Updaters Helper ---
  const updateCurrentMountain = useCallback((updater) => {
    setMountains(prev => prev.map(m => {
      if (m.id === currentMountainId) {
        return updater(m)
      }
      return m
    }))
  }, [currentMountainId])


  // --- Handlers ---

  const handleSetGoal = useCallback((text) => {
    // Check if we need to reset tasks (new adventure logic)
    const doneCount = tasks.filter(t => t.done).length
    const total = tasks.length
    const summitReached = total > 0 && doneCount === total

    updateCurrentMountain(m => {
      if (summitReached) {
        setCelebrated(false)
        setShowCelebration(false)
        return { ...m, goal: text, tasks: [] }
      }
      return { ...m, goal: text }
    })
  }, [tasks, updateCurrentMountain])

  const handleAddTask = useCallback((text) => {
    updateCurrentMountain(m => ({
      ...m,
      tasks: [
        ...m.tasks,
        {
          id: generateId(),
          text,
          done: false,
        }
      ]
    }))
  }, [updateCurrentMountain])

  const handleToggleTask = useCallback((taskId) => {
    updateCurrentMountain(m => ({
      ...m,
      tasks: m.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    }))
  }, [updateCurrentMountain])

  const handleRemoveTask = useCallback((taskId) => {
    // Side effect: delete photo if exists
    const target = tasks.find(t => t.id === taskId)
    if (firebaseReady && user && storage && target?.photo) {
      const photoRef = ref(storage, `users/${user.uid}/tasks/${taskId}`)
      deleteObject(photoRef).catch(() => { })
    }

    updateCurrentMountain(m => ({
      ...m,
      tasks: m.tasks.filter(t => t.id !== taskId)
    }))
  }, [firebaseReady, user, tasks, updateCurrentMountain])

  const handlePhotoUpdate = useCallback(async (taskId, photoData) => {
    // If local or no storage, just update state
    if (!firebaseReady || !user || !storage) {
      updateCurrentMountain(m => ({
        ...m,
        tasks: m.tasks.map(t => t.id === taskId ? { ...t, photo: photoData } : t)
      }))
      return
    }

    const photoRef = ref(storage, `users/${user.uid}/tasks/${taskId}`)

    if (!photoData) {
      deleteObject(photoRef).catch(() => { })
      updateCurrentMountain(m => ({
        ...m,
        tasks: m.tasks.map(t => t.id === taskId ? { ...t, photo: null } : t)
      }))
      return
    }

    try {
      await uploadString(photoRef, photoData, 'data_url')
      const url = await getDownloadURL(photoRef)
      updateCurrentMountain(m => ({
        ...m,
        tasks: m.tasks.map(t => t.id === taskId ? { ...t, photo: url } : t)
      }))
    } catch (error) {
      console.error('Failed to upload photo', error)
    }
  }, [firebaseReady, user, updateCurrentMountain])


  // --- Navigation & Mountain Management ---

  const handleNextMountain = useCallback(() => {
    const idx = mountains.findIndex(m => m.id === currentMountainId)
    if (idx === -1) return

    if (idx < mountains.length - 1) {
      setCurrentMountainId(mountains[idx + 1].id)
    } else {
      // Create new mountain
      const newMountain = { id: generateId(), goal: '', tasks: [], createdAt: Date.now() }
      setMountains(prev => [...prev, newMountain])
      setCurrentMountainId(newMountain.id)
    }
  }, [mountains, currentMountainId])

  const handlePrevMountain = useCallback(() => {
    const idx = mountains.findIndex(m => m.id === currentMountainId)
    if (idx > 0) {
      setCurrentMountainId(mountains[idx - 1].id)
    }
  }, [mountains, currentMountainId])

  const handleSelectMountain = useCallback((id) => {
    setCurrentMountainId(id)
  }, [])

  const handleDeleteMountain = useCallback((id) => {
    if (mountains.length <= 1) return // Prevent deleting last mountain

    // Determine new ID to switch to if we are deleting the current one
    let newId = currentMountainId
    if (id === currentMountainId) {
      const idx = mountains.findIndex(m => m.id === id)
      // Try to go to previous, otherwise next
      if (idx > 0) {
        newId = mountains[idx - 1].id
      } else {
        newId = mountains[idx + 1].id
      }
    }

    setMountains(prev => prev.filter(m => m.id !== id))
    setCurrentMountainId(newId)
  }, [mountains, currentMountainId])


  // --- Auth & AI Helpers (Unchanged logic, just dependencies) ---

  const handleSignIn = useCallback(async (event) => {
    event?.preventDefault()
    if (!firebaseReady || !auth) return
    setAuthBusy(true)
    setAuthError('')
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword)
    } catch (error) {
      setAuthError(error?.message || 'Failed to sign in.')
    } finally {
      setAuthBusy(false)
    }
  }, [authEmail, authPassword])

  const handleSignUp = useCallback(async () => {
    if (!firebaseReady || !auth) return
    setAuthBusy(true)
    setAuthError('')
    try {
      await createUserWithEmailAndPassword(auth, authEmail, authPassword)
    } catch (error) {
      setAuthError(error?.message || 'Failed to create account.')
    } finally {
      setAuthBusy(false)
    }
  }, [authEmail, authPassword])

  const handleSignOut = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
    localStorage.removeItem(STORAGE_KEY)
    // Reset to fresh state
    const newMountain = { id: generateId(), goal: '', tasks: [], createdAt: Date.now() }
    setMountains([newMountain])
    setCurrentMountainId(newMountain.id)
    setTaskGenerationPrompt('')
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
    const promptPreference = taskGenerationPrompt.trim()

    const promptGuidance = promptPreference
      ? `Focus area: ${promptPreference}`
      : ''

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
${promptGuidance}
Generate exactly ${count} tasks.
Constraints:
Tasks should be actionable, specific, and small (30-60 minutes).
Start each task with a verb.
No duplicates.
Keep each task text under 70 characters.
Order tasks from easiest (base) to hardest (summit).
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

      // Add generated tasks to current mountain
      updateCurrentMountain(m => {
        const existing = new Set(m.tasks.map((t) => normalizeForCompare(t.text)))
        const additions = []

        for (const text of normalizedTasks) {
          const key = normalizeForCompare(text)
          if (!existing.has(key)) {
            existing.add(key)
            additions.push({
              id: generateId(),
              text,
              done: false,
            })
          }
        }
        return { ...m, tasks: [...m.tasks, ...additions] }
      })

    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate ledges.'
      setGenerateError(message)
    } finally {
      setIsGenerating(false)
    }
  }, [goal, taskCount, updateCurrentMountain, taskGenerationPrompt])

  return (
    <>
      <div className={`relative min-h-screen overflow-hidden ${isSummitReached ? 'summit-reached' : ''}`}>
        {/* Fullscreen 3D Mountain Background */}
        <Mountain3D
          goal={goal}
          tasks={tasks}
          onPhotoUpdate={handlePhotoUpdate}
          mountainId={currentMountainId}
          timeOfDay={timeOfDay}
        />

        {showLogin ? (
          <LoginScreen
            email={authEmail}
            password={authPassword}
            onEmailChange={setAuthEmail}
            onPasswordChange={setAuthPassword}
            onSubmit={handleSignIn}
            onSignUp={handleSignUp}
            error={authError}
            busy={authBusy}
          />
        ) : (
          <>
            {/* Header / Top Navigation */}
            <header className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">
              <div className="pointer-events-auto flex flex-col gap-3">
                {!firebaseReady ? (
                  <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-xl w-72">
                    <div className="text-xs text-slate-400 font-bold tracking-wider uppercase">Local mode</div>
                    <p className="text-xs text-amber-200 mt-2">
                      Firebase env vars missing. Add the values in .env to enable sign-in.
                    </p>
                  </div>
                ) : user ? (
                  <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-xl w-72">
                    <div className="text-xs text-slate-400 font-bold tracking-wider uppercase">Signed in</div>
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="text-sm text-slate-200 truncate">{user.email}</div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-3 py-2 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-xl flex w-72 flex-col gap-1">
                  <div className="text-xs text-slate-400 font-bold tracking-wider uppercase">Altitude</div>
                  <div className="text-2xl font-mono text-cyan-400">{altitude}m</div>
                  <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <MountainListTab
                  mountains={mountains}
                  currentId={currentMountainId}
                  onSelect={handleSelectMountain}
                  onDelete={handleDeleteMountain}
                />

                <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-xl flex w-full flex-col gap-2 pointer-events-auto">
                  <div className="text-xs text-slate-400 font-bold tracking-wider uppercase">Time of day</div>
                  <div className="flex items-center gap-2 justify-between">
                    {[
                      { id: 'day', label: 'Day', icon: '☀️' },
                      { id: 'sunset', label: 'Sunset', icon: '🌅' },
                      { id: 'night', label: 'Night', icon: '🌙' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTimeOfDay(option.id)}
                        className={`flex-1 px-2 py-1.5 rounded-full text-xs font-semibold transition border flex items-center justify-center ${timeOfDay === option.id
                          ? 'bg-slate-200/90 text-slate-900 border-slate-100'
                          : 'bg-slate-800/70 text-slate-200 border-slate-700/70 hover:border-slate-500'
                          }`}
                      >
                        <span className="mr-1">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowTasks((prev) => !prev)}
                className="pointer-events-auto bg-slate-800/90 text-white p-3 rounded-full hover:bg-slate-700 transition-colors shadow-lg border border-slate-600 backdrop-blur-sm group"
                title="Toggle Tasks"
                id="toggle-tasks-btn"
              >
                {/* Hamburger Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </header>

            {/* New Navigation Features */}
            <NavigationArrows
              onPrev={handlePrevMountain}
              onNext={handleNextMountain}
              canGoPrev={currentMountainIndex > 0}
              isLast={currentMountainIndex === mountains.length - 1}
            />


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
                    taskGenerationPrompt={taskGenerationPrompt}
                    onTaskGenerationPromptChange={setTaskGenerationPrompt}
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

            <SummitCelebration
              show={showCelebration}
              onDone={() => setShowCelebration(false)}
            />
          </>
        )}
      </div>
    </>
  )
}
