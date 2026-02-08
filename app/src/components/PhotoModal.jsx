import { createPortal } from 'react-dom'

export default function PhotoModal({ photo, onClose, onRemove, onReplace }) {
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="bg-sky-deep border border-slate-400/20 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-slide-in">

          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-700/50 shrink-0">
            <h3 className="text-lg font-bold text-slate-100">
              {photo ? 'Journey Photo' : 'Capture the Moment'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl leading-none px-2"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-slate-900/30 flex flex-col items-center justify-center min-h-[200px]">
            {photo ? (
              <img
                src={photo}
                alt="Progress photo"
                className="w-full h-auto object-contain bg-black/20 rounded-lg shadow-inner"
              />
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-slate-600 rounded-xl w-full flex flex-col items-center gap-4 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all group cursor-pointer relative">
                {/* Clickable Area for Upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onReplace}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-200 group-hover:text-cyan-400">Add a photo</p>
                  <p className="text-xs text-slate-500 mt-1">Click to upload from device</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700/50 shrink-0 bg-sky-deep">
            <div className="flex gap-3">
              {photo ? (
                <>
                  <label className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-slate-600/50 text-slate-100 hover:bg-slate-600 cursor-pointer transition-all text-center">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onReplace}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={onRemove}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                  >
                    Remove
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-gradient-to-br from-sky-500 to-blue-600 text-white hover:shadow-lg transition-all"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <label className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-gradient-to-br from-sky-500 to-blue-600 text-white hover:shadow-lg cursor-pointer transition-all text-center">
                    Add Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        console.log('[PhotoModal] File input onChange fired, file:', e.target.files?.[0]?.name)
                        onReplace(e)
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
