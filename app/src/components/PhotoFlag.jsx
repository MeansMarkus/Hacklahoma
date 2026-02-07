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
        <button
          onClick={() => setShowModal(true)}
          className="text-3xl hover:scale-125 transition-transform cursor-pointer drop-shadow-lg"
          title="Click to view/upload photo"
        >
          🚩
        </button>
      </div>

      {showModal && (
        <PhotoModal
          photo={photo}
          onClose={() => setShowModal(false)}
          onRemove={() => {
            onPhotoUpdate(taskId, null)
            setShowModal(false)
          }}
          onReplace={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (event) => {
              const base64 = event.target.result
              onPhotoUpdate(taskId, base64)
            }
            reader.readAsDataURL(file)
          }}
        />
      )}
    </>
  )
}
