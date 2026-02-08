export default function MountainSelector({
  mountains,
  selectedMountainId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}) {
  const count = mountains.length
  const selectedIndex = mountains.findIndex((mountain) => mountain.id === selectedMountainId)
  const safeIndex = selectedIndex === -1 ? 0 : selectedIndex
  const hasMultiple = count > 1
  const hasAny = count > 0
  const prevIndex = hasAny ? (safeIndex - 1 + count) % count : -1
  const nextIndex = hasAny ? (safeIndex + 1) % count : -1

  const selectedMountain = hasAny ? mountains[safeIndex] : null
  const prevMountain = hasMultiple ? mountains[prevIndex] : null
  const nextMountain = hasMultiple ? mountains[nextIndex] : null
  const canDelete = hasMultiple
  const canMoveLeft = hasMultiple
  const canMoveRight = hasMultiple

  const handleRename = () => {
    if (!selectedMountainId) return
    const currentGoal = selectedMountain?.goal ?? ''
    const nextGoal = window.prompt('Rename mountain', currentGoal)
    if (nextGoal === null) return
    onRename(selectedMountainId, nextGoal.trim())
  }

  const handleDelete = () => {
    if (!selectedMountainId || !canDelete) return
    const title = (selectedMountain?.goal ?? '').trim() || 'Untitled mountain'
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`)
    if (!confirmed) return
    onDelete(selectedMountainId)
  }

  const handleMove = (direction) => {
    if (!hasMultiple) return
    const nextIndex = (safeIndex + direction + count) % count
    const target = mountains[nextIndex]
    if (target) onSelect(target.id)
  }

  const renderCard = (mountain, tone) => {
    if (!mountain) {
      if (!hasAny) {
        return (
          <div className="w-full max-w-[160px] min-w-0 rounded-xl border border-slate-700/50 bg-slate-900/30 px-3 py-2 opacity-40">
            <div className="text-xs font-semibold text-slate-500">No mountain</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800/80" />
          </div>
        )
      }
      return null
    }

    const goalLabel = (mountain.goal || '').trim() || 'Untitled mountain'
    const total = mountain.tasks.length
    const done = mountain.tasks.filter((task) => task.done).length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    const isSelected = tone !== 'faded' && mountain.id === selectedMountainId

    return (
      <button
        key={mountain.id}
        type="button"
        onClick={() => onSelect(mountain.id)}
        className={`w-full max-w-[160px] min-w-0 rounded-xl border px-3 py-2 text-left transition-all ${
          isSelected
            ? 'bg-slate-800/90 border-cyan-400/70 ring-2 ring-cyan-400/40'
            : 'bg-slate-800/40 border-slate-700/60'
        } ${tone === 'faded' ? 'opacity-50' : ''}`}
      >
        <div className="text-xs font-semibold text-slate-200 truncate">{goalLabel}</div>
        <div className="mt-1 text-[11px] text-slate-400">
          {done}/{total || 0} ledges
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700/70 overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>
    )
  }

  const renderSpacer = () => (
    <div className="w-full max-w-[160px] min-w-0" aria-hidden="true" />
  )

  return (
    <div className="rounded-xl border border-slate-400/20 bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Your mountains</h3>
        <button
          type="button"
          onClick={onCreate}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-br from-gold-dim to-gold text-sky-deep hover:shadow-lg hover:shadow-gold/30 active:scale-[0.98] transition-all"
        >
          + New
        </button>
      </div>
      <div className="flex items-center gap-2 overflow-hidden">
        <button
          type="button"
          onClick={() => handleMove(-1)}
          disabled={!canMoveLeft}
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-slate-700/60 bg-slate-800/60 text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous mountain"
        >
          ←
        </button>
        <div className="grid grid-cols-3 gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden place-items-center">
          {hasAny && !hasMultiple ? renderSpacer() : renderCard(prevMountain, 'faded')}
          {renderCard(selectedMountain, 'active')}
          {hasAny && !hasMultiple ? renderSpacer() : renderCard(nextMountain, 'faded')}
        </div>
        <button
          type="button"
          onClick={() => handleMove(1)}
          disabled={!canMoveRight}
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-slate-700/60 bg-slate-800/60 text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next mountain"
        >
          →
        </button>
      </div>
      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete}
          className="px-6 py-2 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={canDelete ? 'Delete this mountain' : 'At least one mountain is required'}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
