export default function PhotoModal({ photo, onClose, onRemove, onReplace }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-sky-deep border border-slate-400/20 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full animate-slide-in">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">Journey Photo</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <img
              src={photo}
              alt="Progress photo"
              className="w-full max-h-96 object-cover rounded-lg"
            />

            <div className="flex gap-3">
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
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-gradient-to-br from-gold-dim to-gold text-sky-deep hover:shadow-lg transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
