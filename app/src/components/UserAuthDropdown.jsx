import { useState, useRef, useEffect } from 'react'

export default function UserAuthDropdown({
  user,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit, // Handle Sign In
  onSignUp, // Handle Sign Up
  onSignOut,
  error,
  busy,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative pointer-events-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-200 transition hover:border-cyan-400 hover:text-cyan-400 focus:outline-none"
        aria-label="User Menu"
      >
        {user ? (
          // Authenticated User Icon (Initials or Profile)
          <span className="font-semibold text-sm">
            {user.email ? user.email[0].toUpperCase() : 'U'}
          </span>
        ) : (
          // Guest / Login Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-700/60 bg-slate-900/90 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50">
          {user ? (
            // Logged In View
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Signed in as
                </div>
                <div className="truncate text-sm font-medium text-slate-200">
                  {user.email}
                </div>
              </div>
              <button
                onClick={() => {
                  onSignOut()
                  setIsOpen(false)
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-rose-900/30 hover:text-rose-200 hover:border-rose-900/50"
              >
                Sign Out
              </button>
            </div>
          ) : (
             // Logged Out View - Just a prompt to open the main login modal
             <div className="flex flex-col gap-3">
                <div className="text-sm font-semibold text-slate-200 px-1">
                   Expedition Access
                </div>
                <button
                   onClick={() => {
                      onSubmit(); // Re-using onSubmit as "Require Login" signal
                      setIsOpen(false);
                   }}
                   className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
                >
                   Log In / Sign Up
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  )
}
