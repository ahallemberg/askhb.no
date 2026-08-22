import React from 'react'

interface ErrorMessageProps {
    message: string
    onRetry?: () => void
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            {/*
             * The accent, not a borrowed red-500. --color-accent is oxblood in
             * light and terracotta in dark, which is the only alarm register
             * this palette owns, and importing a foreign red for one screen
             * would put a colour on the site that appears nowhere else.
             *
             * It does not overload the section-label accent either: Portfolio
             * returns this instead of the page, so nothing labelled in accent
             * is ever on screen beside it -- this is the only accent here.
             * 8.03:1 (light) / 6.82:1 (dark) on paper.
             */}
            <div className="text-accent mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            {/* Serif, like every other heading on the site. 16.63:1 / 15.48:1. */}
            <h2 className="font-serif text-xl font-medium tracking-tight text-ink mb-2">Something went wrong</h2>
            {/* The message is a fetch error string, so it takes body-copy ink-muted: 9.06:1 / 8.64:1. */}
            <p className="text-ink-muted mb-4">{message}</p>
            {onRetry && (
                <button
                onClick={onRetry}
                /*
                 * The outlined button Portfolio's Download CV already
                 * established, rather than a filled one -- a solid accent
                 * block is the heaviest thing that would ever appear on this
                 * site, and it would appear only in its error state.
                 * ink-muted on paper 9.06:1 / 8.64:1, accent hovered
                 * 8.03:1 / 6.82:1.
                 */
                className="border-rule text-ink-muted hover:border-accent hover:text-accent focus-visible:outline-accent rounded-[2px] border px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                Try again
                </button>
            )}
        </div>
    )
}

export default ErrorMessage