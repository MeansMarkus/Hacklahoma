import { MOUNTAIN_STYLES } from '../utils/mountainStyles'

export default function MountainStylePicker({ currentStyle, onStyleChange }) {
  return (
    <div className="rounded-xl border border-slate-400/20 bg-sky-mid/90 backdrop-blur-md p-4">
      <h3 className="text-sm font-semibold mb-3 text-slate-200">Choose Your Peak</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(MOUNTAIN_STYLES).map(([key, style]) => (
          <button
            key={key}
            onClick={() => onStyleChange(key)}
            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentStyle === key
                ? 'bg-gradient-to-br from-gold-dim to-gold text-sky-deep shadow-lg'
                : 'bg-slate-600/30 text-slate-200 hover:bg-slate-600/50 border border-slate-400/20'
            }`}
          >
            <div className="font-semibold">{style.name}</div>
            <div className="text-xs opacity-70">{style.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
