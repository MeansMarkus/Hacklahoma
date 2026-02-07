import { useState } from 'react'
import PhotoModal from './PhotoModal'

export default function PhotoFlag({ taskId, photo, onPhotoUpdate }) {
  const [showModal, setShowModal] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      onPhotoUpdate(taskId, base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="relative group">
        {photo ? (
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-gold shadow-lg hover:scale-110 transition-transform cursor-pointer"
            title="Click to view photo"
          >
            <img src={photo} alt="Progress" className="w-full h-full object-cover" />
          </button>
        ) : (
          <label className="w-8 h-8 rounded-full border-2 border-dashed border-slate-400/40 hover:border-gold bg-slate-500/10 hover:bg-gold/10 flex items-center justify-center cursor-pointer transition-all group-hover:scale-110 text-xs font-bold text-slate-400 hover:text-gold">
            📸
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload photo for this ledge"
            />
          </label>
        )}
      </div>

      {showModal && (
        <PhotoModal
          photo={photo}
          onClose={() => setShowModal(false)}
          onRemove={() => {
            onPhotoUpdate(taskId, null)
            setShowModal(false)
          }}
          onReplace={handleFileUpload}
        />
      )}
    </>
  )
}
