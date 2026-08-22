import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import DarkModeToggle from '../components/DarkModeToggle';

/*
 * Same column and the same tokens as Portfolio, deliberately: this div -- not
 * body -- is what paints a full viewport, so a grey shell here would leave one
 * route rendering cool grey against a warm-paper site.
 *
 * It does not need the editorial structure, only the palette, so the "404" takes
 * the ruled-label treatment SectionHeading uses and the rest is one serif line.
 */
const COLUMN = 'mx-auto w-full max-w-[36rem] px-6';

const NotFound: React.FC = () => {
    return (
        <div className="bg-paper text-ink min-h-screen font-sans">
            <div className={`${COLUMN} flex justify-end pt-6`}>
                <DarkModeToggle />
            </div>

            <FadeIn>
                <main className={`${COLUMN} py-24 text-center`}>
                    <p className="font-serif text-[11.5px] font-medium tracking-[0.2em] text-accent uppercase">404</p>
                    <h1 className="font-serif text-3xl font-medium tracking-tight text-ink mt-4">Page not found</h1>
                    <p className="text-ink-muted mt-3 leading-relaxed">
                        There is nothing at this address.
                    </p>
                    {/*
                     * Underlined rather than accent-coloured alone: accent against
                     * the copy beside it is nowhere near the 3:1 WCAG 1.4.1 wants
                     * of a colour-only link cue. Same treatment as RoleBlock's.
                     */}
                    <Link
                        to="/"
                        className="text-accent hover:text-ink mt-8 inline-block text-[13px] underline decoration-1 underline-offset-4 transition-colors"
                    >
                        <span aria-hidden="true">←</span> Back to the portfolio
                    </Link>
                </main>
            </FadeIn>
        </div>
    );
};

export default NotFound;
