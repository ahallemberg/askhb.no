import React from 'react'

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            {/*
             * The full ring is drawn in --rule, the same hairline the section
             * headings sit on, and only the leading arc is accent -- so the
             * thing that spins is a mark on the page's own rule rather than a
             * blue fragment. Both are non-text, where WCAG 1.4.11 asks 3:1:
             * accent is 8.03:1 (light) / 6.82:1 (dark) against paper, and the
             * ring behind it is deliberately below that, being decoration that
             * the accent arc does not depend on.
             */}
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-rule border-b-accent mb-4"></div>
            {/*
             * The uppercase micro-label the meta lines use, so the one piece of
             * text on an otherwise empty screen still reads as this site.
             * ink-muted rather than the ink-faint those lines take: at 11px
             * ink-faint is 4.61:1 / 4.80:1, over AA but only just, and this
             * label has nothing around it to be subordinate to. 9.06:1 / 8.64:1.
             */}
            <p className="text-[11px] uppercase tracking-[0.13em] text-ink-muted">Loading...</p>
        </div>
    )
}

export default LoadingSpinner