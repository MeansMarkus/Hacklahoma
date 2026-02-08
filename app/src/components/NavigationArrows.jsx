import React from 'react'

export default function NavigationArrows({ onPrev, onNext, canGoPrev, isLast }) {
    return (
        <>
            {canGoPrev && (
                <button
                    onClick={onPrev}
                    className="fixed left-4 top-1/2 -translate-y-1/2 z-40 p-4 bg-slate-900/50 hover:bg-slate-800/80 text-white rounded-full backdrop-blur-sm transition-all hover:scale-110 shadow-lg border border-slate-700/50 group"
                    title="Previous Mountain"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 group-hover:-translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
            )}

            <button
                onClick={onNext}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-40 p-4 bg-slate-900/50 hover:bg-slate-800/80 text-white rounded-full backdrop-blur-sm transition-all hover:scale-110 shadow-lg border border-slate-700/50 group"
                title={isLast ? "New Adventure" : "Next Mountain"}
            >
                {isLast ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 group-hover:translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                )}
            </button>
        </>
    )
}
