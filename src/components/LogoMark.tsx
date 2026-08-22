import QFreeMark from './QFreeMark';

/*
 * Marks render as ink rather than in their brand colours: four saturated palettes
 * stacked against warm paper read as four guest appearances rather than one page.
 *
 * Two mechanisms, because the marks are not the same kind of file. Netlight,
 * Ascend and Computas are alpha-transparent rasters whose counters are holes in
 * the alpha channel, so greyscale plus opacity flattens them to a single ink
 * weight correctly. Q-Free is two-tone -- opaque white counters painted over a
 * red body -- so the same filter erases its counters; it ships as a component
 * that recolours from theme tokens instead. See QFreeMark.
 */

type MarkComponent = React.FC<{ className?: string; label?: string }>;

/*
 * Marks that ship as components, keyed by the file name they are stored under.
 *
 * Deliberately an exact-match registry rather than a substring test on the URL.
 * Dispatching on `url.includes('qfree') || url.endsWith('.svg')` would render
 * *any* future SVG logo as Q-Free's mark -- a silently wrong company on the
 * page, which is worse than a badly filtered one. An unrecognised file, SVG or
 * not, falls through to the image branch. Adding a mark is one entry here.
 *
 * Keyed on the file name because the URL is all this component is given; the
 * durable fix is a discriminator stored with the organisation in R2.
 */
const MARKS: Record<string, MarkComponent> = {
    'logo-qfree': QFreeMark,
    'q-free': QFreeMark,
    'q-free_logo': QFreeMark,
    'qfree': QFreeMark,
};

/** Last path segment of a URL, without query, fragment or extension, lowercased. */
const markKey = (url: string): string =>
    url.split(/[?#]/)[0].split('/').pop()?.replace(/\.[^./]+$/, '').toLowerCase() ?? '';

interface LogoMarkProps {
    url?: string;
    // Optical size correction. Marks differ in ink coverage, so identical boxes
    // do not give identical visual weight. Default 1.
    scale?: number;
    // Empty (the default) makes the mark decorative, which is right wherever the
    // company name is already rendered as text beside it.
    alt?: string;
}

const LogoMark: React.FC<LogoMarkProps> = ({ url, scale = 1, alt = '' }) => {
    /*
     * Nothing at all rather than a reserved empty box: no organisation carries a
     * logo yet, and an always-present slot would indent every company name past
     * blank space. A row that wants its names aligned should reserve the slot
     * itself -- that depends on the organisation's siblings, which this component
     * cannot see.
     */
    if (!url) return null;

    const Mark = MARKS[markKey(url)];

    return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            {/* Optical correction: equal boxes do not give equal visual weight. */}
            <span
                style={{ transform: `scale(${scale})` }}
                className="flex h-full w-full items-center justify-center"
            >
                {Mark
                    ? <Mark className="max-h-full max-w-full opacity-80" label={alt} />
                    : (
                        <img
                            src={url}
                            alt={alt}
                            className="max-h-full max-w-full object-contain grayscale contrast-90 opacity-60 dark:invert dark:opacity-70"
                        />
                    )}
            </span>
        </span>
    );
};

export default LogoMark;
