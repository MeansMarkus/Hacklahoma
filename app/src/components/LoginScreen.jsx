export default function LoginScreen({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSignUp,
  error,
  busy,
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6 py-10">
      <div className="login-backdrop absolute inset-0" aria-hidden="true" />
      <div className="login-panel login-appear relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/80 shadow-[0_30px_80px_rgba(2,6,23,0.75)] backdrop-blur-xl">
        <div className="grid gap-0 md:grid-cols-[1.1fr,0.9fr]">
          <div className="relative p-8 md:p-10">
            <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div className="flex flex-col gap-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Base Camp Access
                </div>
                <h1 className="font-display text-3xl leading-tight text-slate-50 md:text-4xl">
                  Step into your peak.
                </h1>
                <p className="text-sm text-slate-300 md:text-base">
                  Log your ledges, track altitude, and celebrate each summit with a mountain that grows with you.
                </p>
              </div>

              <div className="grid gap-4 text-sm text-slate-200">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  <div>
                    <div className="font-semibold text-slate-100">Dynamic checkpoints</div>
                    <div className="text-xs text-slate-400">Your mountain updates as you conquer tasks.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                  <div>
                    <div className="font-semibold text-slate-100">Summit celebrations</div>
                    <div className="text-xs text-slate-400">Trigger a toast when every ledge is cleared.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]" />
                  <div>
                    <div className="font-semibold text-slate-100">Photo flags</div>
                    <div className="text-xs text-slate-400">Capture proof from each checkpoint.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative border-t border-slate-700/50 bg-slate-900/70 p-8 md:border-l md:border-t-0 md:p-10">
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Expedition Login
                </div>
                <div className="text-2xl font-semibold text-slate-100">Welcome back</div>
                <p className="text-sm text-slate-400">
                  Use your email to return to your latest climb.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="auth-email">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="name@basecamp.io"
                  className="rounded-xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="auth-password">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={onSignUp}
                  disabled={busy}
                  className="rounded-xl border border-slate-700/80 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-60"
                >
                  Create account
                </button>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                  {error}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
