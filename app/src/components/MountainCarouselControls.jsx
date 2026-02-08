function getProgress(mountain) {
  if (!mountain || !Array.isArray(mountain.tasks)) return 0
  const total = mountain.tasks.length
  if (total === 0) return 0
  const done = mountain.tasks.filter((task) => task.done).length
  return Math.round((done / total) * 100)
}

import MountainPreviewScene from './MountainPreviewScene'

function PreviewCard({ mountain, onSelect, disabled, ariaLabel }) {
  if (!mountain) {
    return (
      <div className="min-w-[160px] rounded-xl border border-slate-700/50 bg-slate-900/30 px-3 py-2 opacity-40">
        <div className="text-xs font-semibold text-slate-500">No mountain</div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800/80" />
      </div>
    )
  }

  const goalLabel = (mountain.goal || '').trim() || 'Untitled mountain'
  const total = mountain.tasks.length
  const done = mountain.tasks.filter((task) => task.done).length
  const progress = getProgress(mountain)

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel}
      className="min-w-[160px] rounded-xl border border-slate-700/60 bg-slate-800/50 px-3 py-2 text-left opacity-60 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      title={goalLabel}
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

function SidePreviewPanel({
  mountain,
  onSelect,
  disabled,
  ariaLabel,
  direction = 'left',
  tintHue = 200,
}) {
  if (!mountain) return null

  const goalLabel = (mountain.goal || '').trim() || 'Untitled mountain'
  const total = mountain.tasks.length
  const done = mountain.tasks.filter((task) => task.done).length
  const progress = getProgress(mountain)
  const scrimClass =
    direction === 'left'
      ? 'bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent'
      : 'bg-gradient-to-l from-slate-950/80 via-slate-950/40 to-transparent'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel}
      className="group relative h-full w-full overflow-hidden rounded-3xl border border-slate-700/40 bg-slate-900/40 text-left transition-all hover:border-slate-500/60 hover:bg-slate-900/60 disabled:opacity-40 disabled:cursor-not-allowed"
      title={goalLabel}
    >
      <MountainPreviewScene hue={tintHue} className="absolute inset-0 scale-[1.05]" />
      <div className={`absolute inset-0 ${scrimClass}`} />
      <div className="absolute inset-x-5 bottom-6 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-3 backdrop-blur-md shadow-lg">
        <div className="text-sm font-semibold text-slate-100 leading-tight max-h-[2.6rem] overflow-hidden">
          {goalLabel}
        </div>
        <div className="mt-1 text-[11px] text-slate-300">
          {done}/{total || 0} ledges
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700/70 overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </button>
  )
}

export default function MountainCarouselControls({
  mountains,
  selectedMountainId,
  onMove,
  isDisabled = false,
}) {
  const count = mountains.length
  if (count === 0) return null

  const selectedIndex = mountains.findIndex((mountain) => mountain.id === selectedMountainId)
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0
  const hasMultiple = count > 1

  const prevIndex = hasMultiple ? (safeIndex - 1 + count) % count : safeIndex
  const nextIndex = hasMultiple ? (safeIndex + 1) % count : safeIndex
  const prevMountain = hasMultiple ? mountains[prevIndex] : null
  const nextMountain = hasMultiple ? mountains[nextIndex] : null

  const disableControls = !hasMultiple || isDisabled

  const prevGoalLabel = (prevMountain?.goal || '').trim() || 'Untitled mountain'
  const nextGoalLabel = (nextMountain?.goal || '').trim() || 'Untitled mountain'
  const prevTint = 210 + (prevIndex * 29) % 110
  const nextTint = 210 + (nextIndex * 29) % 110

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div className="hidden md:flex absolute inset-y-10 left-0 w-[30vw] max-w-[420px] min-w-[240px] px-4 pointer-events-auto">
        {hasMultiple ? (
          <SidePreviewPanel
            mountain={prevMountain}
            onSelect={() => onMove(-1)}
            disabled={disableControls}
            ariaLabel={`Select previous mountain: ${prevGoalLabel}`}
            direction="left"
            tintHue={prevTint}
          />
        ) : null}
      </div>
      <div className="hidden md:flex absolute inset-y-10 right-0 w-[30vw] max-w-[420px] min-w-[240px] px-4 pointer-events-auto">
        {hasMultiple ? (
          <SidePreviewPanel
            mountain={nextMountain}
            onSelect={() => onMove(1)}
            disabled={disableControls}
            ariaLabel={`Select next mountain: ${nextGoalLabel}`}
            direction="right"
            tintHue={nextTint}
          />
        ) : null}
      </div>
      <div className="flex md:hidden items-center justify-between px-2 sm:px-6 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={disableControls}
            aria-label="Previous mountain"
            className="h-11 w-11 rounded-full border border-slate-700/60 bg-slate-800/70 text-slate-100 shadow-lg transition-colors hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous mountain"
          >
            ←
          </button>
          {hasMultiple ? (
            <PreviewCard
              mountain={prevMountain}
              onSelect={() => onMove(-1)}
              disabled={disableControls}
              ariaLabel={`Select previous mountain: ${prevGoalLabel}`}
            />
          ) : null}
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          {hasMultiple ? (
            <PreviewCard
              mountain={nextMountain}
              onSelect={() => onMove(1)}
              disabled={disableControls}
              ariaLabel={`Select next mountain: ${nextGoalLabel}`}
            />
          ) : null}
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={disableControls}
            aria-label="Next mountain"
            className="h-11 w-11 rounded-full border border-slate-700/60 bg-slate-800/70 text-slate-100 shadow-lg transition-colors hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next mountain"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
