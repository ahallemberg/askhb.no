import React, { useEffect, useState } from 'react';

/*
 * Stateless on purpose. The bootstrap script in index.html has already put the
 * theme class on <html> before first paint, and that class stays the single
 * source of truth: both icons are always in the markup and the same
 * class-based variant the rest of the page uses decides which one shows.
 * Holding the theme in React state instead gives this component a different
 * first render on the server (no storage, no media queries) than in the
 * browser, which is a hydration mismatch on a prerendered page.
 */
const DarkModeToggle: React.FC = () => {
    /*
     * null until mounted. The icon swap is CSS-driven and needs no state, but
     * assistive tech cannot see CSS visibility, so aria-pressed is its only
     * signal of the current mode. The server cannot know the theme, so the
     * first render carries no aria-pressed on either side (hydration-safe);
     * the effect fills it in once the class on <html> is readable.
     */
    const [isDark, setIsDark] = useState<boolean | null>(null);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleDarkMode = () => {
        const nowDark = document.documentElement.classList.toggle('dark');
        setIsDark(nowDark);

        try {
            localStorage.setItem('theme', nowDark ? 'dark' : 'light');
        } catch {
            // Storage unavailable: the choice still applies to this page view,
            // it just cannot outlive it.
        }
    };

    return (
        <button
            onClick={toggleDarkMode}
            /*
             * Deliberately not the accent hover the social links take: this
             * sits in the same header corner as them, and two accent hovers a
             * few pixels apart would read as one control. It wakes to full ink
             * on a rule-faint plate instead -- 14.33:1 (light) / 13.34:1
             * (dark) on that plate, up from 4.61:1 / 4.80:1 at rest, both of
             * which clear the 3:1 WCAG 1.4.11 asks of an icon either way.
             */
            className="text-ink-faint hover:text-ink hover:bg-rule-faint focus-visible:outline-accent rounded-[2px] p-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Toggle dark mode"
            aria-pressed={isDark ?? undefined}
        >
            {/* Sun: visible only when the page is dark. */}
            <svg
                className="hidden h-6 w-6 dark:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
            {/* Moon: visible only when the page is light. */}
            <svg
                className="h-6 w-6 dark:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
            </svg>
        </button>
    );
};

export default DarkModeToggle;
