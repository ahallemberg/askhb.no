import React, { useState, useEffect } from 'react';

const DarkModeToggle: React.FC = () => {
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        return savedTheme === 'dark' || (!savedTheme && prefersDark);
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
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
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {darkMode ? (
                // Sun Icon
                <svg
                    className="w-6 h-6"
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
            ) : (
                // Moon Icon 
                <svg
                    className="w-6 h-6"
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
            )}
        </button>
    );
};

export default DarkModeToggle;