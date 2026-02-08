import { useState } from 'react'
import PhotoModal from './PhotoModal'

export default function PhotoFlag({ taskId, photo, onPhotoUpdate }) {
  const [showModal, setShowModal] = useState(false)

  // Helper to resize image
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const MAX_SIZE = 1024

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const resizedBase64 = await resizeImage(file)
      onPhotoUpdate(taskId, resizedBase64)
    } catch (err) {
      console.error("Image resize failed", err)
    }
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
          onReplace={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              const resizedBase64 = await resizeImage(file)
              onPhotoUpdate(taskId, resizedBase64)
            } catch (err) {
              console.error("Image resize failed", err)
            }
          }}
        />
      )}
    </>
  )
}
