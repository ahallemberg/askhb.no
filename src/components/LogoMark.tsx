import QFreeMark from './QFreeMark';

/*
 * Marks render as ink rather than in their brand colours: four saturated palettes
 * stacked against warm paper read as four guest appearances rather than one page.
 *
 * Two mechanisms, because the marks are not the same kind of file. Netlight,
 * Ascend and Computas are alpha-transparent rasters whose counters are holes in
 * the alpha channel, so a greyscale filter is safe on them. Q-Free is two-tone
 * -- opaque white counters painted over a red body -- so the same filter erases
 * its counters; it ships as a component that recolours from theme tokens
 * instead, and carries its own weight correction. See QFreeMark.
 *
 * The raster filter is measured, not guessed. Greyscale does not flatten a mark
 * to one ink weight: over their opaque pixels these three carry two to four
 * distinct tonal bands each -- Computas' navy ring against its cyan disc,
 * Netlight's overlapping planes -- and at the old weight the lightest band
 * washed out (1.39:1 against paper for Ascend). Flattening to a silhouette
 * would fix the weight but cost the structure, turning Computas into a
 * featureless black circle. So the bands are kept and the whole range is
 * shifted: brightness() sets where the faintest band lands, opacity() sets the
 * overall level. Both themes run ~2.4:1 at the faintest band to ~7:1 at the
 * strongest -- subordinate to --color-ink (16.6:1 light, 15.5:1 dark), present
 * but clearly not competing with the company name beside them.
 *
 * Dark mode inverts, which reverses that arithmetic, so brightness() is placed
 * *before* invert(): it then reads as 255 - b*g, raising the floor the faintest
 * band sits on. Placed after invert() it is a plain multiplier on the whole
 * range, and lifting that band would need b > 1.4, which clips Computas' ring
 * to pure white -- brighter than the body text next to it.
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
                {/*
                 * No weight correction applied here. A component mark paints from
                 * the tokens and knows its own ink coverage, so it sets its own
                 * alpha; a blanket one at this level would be a number tuned for
                 * one mark silently multiplying every other's. See QFreeMark.
                 */}
                {Mark
                    ? <Mark className="max-h-full max-w-full" label={alt} />
                    : (
                        <img
                            src={url}
                            alt={alt}
                            className="max-h-full max-w-full object-contain [filter:grayscale(1)_brightness(0.7)_opacity(0.75)] dark:[filter:grayscale(1)_brightness(0.75)_invert(1)_opacity(0.7)]"
                        />
                    )}
            </span>
        </span>
    );
};

export default LogoMark;
