export default function Header({ progress, altitude }) {
  return (
    <header className="relative z-10 pt-6 px-4 pb-4 text-center">
      <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-wide text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-slate-400">
        Life as a Mountain
      </h1>
      <p className="text-accent font-medium text-sm mt-1 tracking-wider">
        Technology that helps you reach new heights
      </p>
      <div className="mt-4 max-w-[280px] mx-auto">
        <span className="block text-xs text-slate-400 uppercase tracking-widest mb-1.5">
          Your altitude
        </span>
        <div className="h-2 bg-sky-mid/80 rounded-full overflow-hidden border border-slate-400/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="block text-sm font-semibold text-gold mt-1">{altitude} m</span>
      </div>
    </header>
  )
}
