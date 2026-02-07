import { useEffect, useState } from 'react'

export default function SummitCelebration({ show, onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    setVisible(true)
    const hideAt = setTimeout(() => setVisible(false), 2800)
    const doneAt = setTimeout(() => onDone?.(), 3200)
    return () => {
      clearTimeout(hideAt)
      clearTimeout(doneAt)
    }
  }, [show, onDone])

  if (!show) return null

  return (
    <div
      className={`fixed bottom-8 left-1/2 z-50 px-6 py-3.5 rounded-xl font-bold text-sky-deep text-center shadow-xl transition-all duration-400 ${
        visible
          ? 'opacity-100 -translate-x-1/2 translate-y-0'
          : 'opacity-0 -translate-x-1/2 translate-y-5'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.95), rgba(251, 191, 36, 0.9))',
        boxShadow: '0 10px 40px rgba(52, 211, 153, 0.4)',
      }}
    >
      🏔️ Summit reached — new heights unlocked!
    </div>
  )
}
