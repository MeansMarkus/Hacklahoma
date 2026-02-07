export default function Sky() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 40%, #334155 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.4), transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.3), transparent),
            radial-gradient(2px 2px at 50px 160px, rgba(255,255,255,0.35), transparent),
            radial-gradient(2px 2px at 90px 40px, rgba(255,255,255,0.25), transparent)
          `,
          backgroundSize: '200px 200px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.06) 30%, rgba(251, 191, 36, 0.04) 60%, transparent 100%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(251, 191, 36, 0.08))',
        }}
      />
    </div>
  )
}
