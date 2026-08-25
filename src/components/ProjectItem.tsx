import { type ProjectItemProps } from '../types/props';
import LogoMark from './LogoMark';
import RichText from './RichText';

interface ProjectItemComponentProps {
    project: ProjectItemProps;
}

/*
 * The card sits one step off --paper on --rule-faint. That step is only 1.16:1,
 * the same separation the skill chips already rely on elsewhere, so the hairline
 * border is the second cue rather than decoration -- neither carries the card on
 * its own.
 */
/*
 * The card is also the query container for its own contents, and past 28rem of
 * its width they set the shot beside the text rather than above it. The card's
 * width and not the viewport's, because the same card is ~256px in a shared row
 * and ~528px when it spans one alone -- a viewport query cannot tell those two
 * apart, and it is the wide one that needs the other layout.
 *
 * Stacked, the shot and the text add up: a spanning card ran past 500px tall for
 * a one-line description, half of it screenshot. Set side by side the card is as
 * tall as the taller of the two, which is the text.
 *
 * The width alone is not the whole condition, though, and reading it as if it
 * were made the layout flip twice on the way to being narrower. Below the
 * breakpoint where the grid drops to one column every card is the full measure,
 * so a wide card there is not one spanning a row -- it is the only column there
 * is. Width alone therefore set the shot beside the text across the ~140px band
 * under that breakpoint, for the very cards that had it above them one pixel
 * wider, and above them again 140px further down. So the side-by-side rule asks
 * for both: the card past 28rem, and the grid still in the mode where being that
 * wide means spanning rather than merely being alone.
 */
const CARD_CLASS =
    '@container block h-full rounded-[3px] border border-rule bg-rule-faint';

/*
 * The direction lives on this inner element rather than on the card, because a
 * container query asks about an ancestor: the card that declares itself the
 * container is the one element the query cannot answer for. Written on the card
 * it silently never matches, and the shot -- which does read the card correctly
 * -- takes its side-by-side width while the card is still stacking, which leaves
 * it no height to fill.
 */
const LAYOUT_CLASS = 'flex h-full flex-col sm:@md:flex-row';

/*
 * The ratio is the frame's and the shots are pinned to its inset, which is what
 * lets the frame drop the ratio when it stands beside the text: there it takes
 * its height from the card instead, and the shot crops to whatever that height
 * turns out to be rather than leaving a stripe of empty card beneath it.
 *
 * Stacked, the fixed ratio still earns its keep for the reason it always did -- a
 * tall screenshot would otherwise set the card's height and leave that same
 * stripe under the text. Fixed, so the pair cannot disagree about size either:
 * shots that differed would resize the card when the reader flips the toggle.
 *
 * The frame keeps its hairline against the text on whichever side the layout
 * puts it -- under the shot stacked, beside it otherwise -- and rounds the outer
 * corners it meets there. It rounds and clips them itself because the card no
 * longer can: the stretched link draws its focus ring just outside the card from
 * a pseudo-element inside it, so an ancestor that clipped would cut that ring
 * off. Inside a 1px border on a 3px box the inner curve is 2px.
 */
const SHOT_FRAME_CLASS =
    'relative aspect-[16/10] w-full overflow-hidden rounded-t-[2px] border-b border-rule sm:@md:aspect-auto sm:@md:w-[45%] sm:@md:shrink-0 sm:@md:rounded-tr-none sm:@md:rounded-bl-[2px] sm:@md:border-r sm:@md:border-b-0';

/*
 * Beside the text the frame is narrower than the shot's own proportions, so the
 * crop takes its width from both edges and the site's own logo is the first
 * thing to go. Anchored to the top left there instead, which is where a page
 * keeps the marks that identify it. Stacked the frame is wider than it is tall,
 * nothing is lost sideways, and the top edge is the only one that matters.
 */
const SCREENSHOT_CLASS =
    'absolute inset-0 h-full w-full object-cover object-top sm:@md:object-left-top';

const ProjectItem: React.FC<ProjectItemComponentProps> = ({ project }) => {
    /*
     * Optional here, unlike RoleProps.skills. Same defence either way, because
     * fetchJsonData casts without validating and Portfolio gates the whole page
     * on one isError -- a throw in this component costs every section.
     */
    const skills = project.skills ?? [];

    /*
     * `name` is the one required field the card cannot simply print: it is
     * trimmed, compared and used as the link's accessible name. A project saved
     * with a url but no name yet -- a half-finished entry, which is the likely
     * way this happens -- would throw on the trim and take the whole page with
     * it, since Portfolio gates every section on one isError.
     *
     * So the card renders without its heading rather than disappearing: the
     * entry is real, and an author who has typed a description and a url should
     * see it on the page and notice the missing name, not wonder why nothing
     * saved. The host takes over as the visible label below, because showHost
     * has nothing to match it against.
     */
    const name = typeof project.name === 'string' ? project.name.trim() : '';

    /*
     * Read by type rather than by truthiness, and that is load-bearing here in a
     * way it is not for an organisation: experiences pass through
     * normaliseExperiences field by field, while useProjects casts the bucket's
     * array straight through with no normaliser at all. So these two arrive
     * exactly as the file spelled them.
     *
     * LogoMark calls .split on the url the moment it is truthy, so a logoUrl
     * saved as a number reaches it, throws, and takes the whole page with it --
     * Portfolio gates every section on one isError and there is no
     * ErrorBoundary. The scale is milder, since a wrong type lands in a
     * transform and renders as a dead declaration, but it is read the same way
     * rather than leaving one of a pair guarded and the other not.
     */
    const logoUrl = typeof project.logoUrl === 'string' ? project.logoUrl : undefined;
    const logoScale = typeof project.logoScale === 'number' ? project.logoScale : undefined;

    /*
     * Which shot each theme gets. Either field may be absent, and one on its own
     * serves both themes rather than leaving the card blank -- the entry is real,
     * and the same reasoning applies here as to a project saved without a name.
     */
    const lightShot = project.screenshotUrl ?? project.screenshotUrlDark;
    const darkShot = project.screenshotUrlDark ?? project.screenshotUrl;
    const hasThemedPair = lightShot !== darkShot;

    /*
     * A malformed url would throw out of URL and take the page with it, so the
     * host is best-effort: a bad value still gets an href (dead, but visible in
     * the status bar) and simply loses the printed hostname.
     */
    const host = (() => {
        if (!project.url) return undefined;
        try {
            return new URL(project.url).hostname.replace(/^www\./, '');
        } catch {
            return undefined;
        }
    })();

    /*
     * Both live projects are named for their domain, so printing the host under
     * the name would just repeat it. Printed only when it says something the
     * name does not -- which is also the only case where it works as a check on
     * a wrong url.
     */
    const showHost = host !== undefined && host.toLowerCase() !== name.toLowerCase();

    /*
     * Which element carries the card's link. The name when there is one; the
     * footer line when there is a url but no name yet, so a half-finished entry
     * is still openable rather than being a card that does nothing. Whichever it
     * is stretches a pseudo-element across the card, and that -- not the wrapper
     * -- is the click target, because the description may now hold anchors of its
     * own and an anchor inside an anchor is not valid HTML.
     */
    const url = project.url;
    const stretched: 'name' | 'footer' | 'none' = !url ? 'none' : name ? 'name' : 'footer';

    /*
     * Pinned to the inset of the card, which is the nearest positioned ancestor.
     * It sits at the base of the card's stacking order so the description's own
     * links can be raised over it -- explicitly, rather than by document order,
     * because in the footer case this element comes after the description rather
     * than before it.
     *
     * The ring is drawn on this pseudo-element rather than on the anchor's own
     * box, so focus frames the whole card the way it did when the card was the
     * anchor, instead of drawing a rectangle around the title. That is also why
     * the card above no longer clips its overflow: a clipping ancestor would cut
     * the ring off, and only the image ever needed clipping.
     *
     * The style is restated on the pseudo-element belt-and-braces, not because it
     * is required: the custom property behind it is registered as non-inheriting
     * with an initial value that already draws, so removing the anchor's own ring
     * does not reach in here. Stated anyway so the ring does not depend on a
     * registration detail of the CSS framework staying as it is.
     *
     * The inset and the radius are what put the ring back where it was before the
     * card stopped being the anchor. Absolute insets resolve against the padding
     * box, so without the nudge the ring traces a square-cornered rectangle
     * inside the border instead of following the card's own rounded edge.
     */
    const STRETCH_CLASS =
        "after:absolute after:-inset-px after:z-0 after:rounded-[3px] after:content-[''] focus-visible:outline-none focus-visible:after:outline-solid focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent";

    const wrapperClass = ['relative', CARD_CLASS, url ? 'group transition-colors hover:border-ink-faint' : '']
        .filter(Boolean)
        .join(' ');

    const body = (
        <div className={LAYOUT_CLASS}>
            {/*
             * Two elements, one per theme, rather than one whose src is chosen in
             * JavaScript. This site's dark mode is a class on <html> written by
             * the toggle and localStorage, not the OS preference, so a <picture>
             * switching on a prefers-color-scheme media query would follow the OS
             * and disagree with the toggle: a reader on a light OS who turns the
             * page dark would get the light screenshot on a dark card. The dark
             * variant is the same class-based one the rest of the page uses, so
             * the pair cannot disagree with the toggle.
             *
             * The cost is that a card carrying both fetches both. Choosing in
             * JavaScript instead would mean holding the theme in React state
             * beside the pre-paint bootstrap in index.html -- a second source of
             * truth for the one value that must be right before first paint.
             *
             * alt is empty because the name sits directly beneath it and the
             * link that wraps the card is already named -- alt here would be the
             * third reading of the same string.
             */}
            {lightShot && (
                <div className={SHOT_FRAME_CLASS}>
                    <img
                        src={lightShot}
                        alt=""
                        loading="lazy"
                        className={hasThemedPair ? `${SCREENSHOT_CLASS} dark:hidden` : SCREENSHOT_CLASS}
                    />
                    {hasThemedPair && (
                        <img
                            src={darkShot}
                            alt=""
                            loading="lazy"
                            className={`${SCREENSHOT_CLASS} hidden dark:block`}
                        />
                    )}
                </div>
            )}

            {/*
             * min-w-0 because a text cell beside the shot is sized from its own
             * content by default, and a long unbroken word -- a host name, a
             * skill written as one -- would push the cell past its share and
             * squeeze the shot rather than wrapping.
             */}
            <div className="flex min-w-0 flex-1 flex-col p-5">
                {name && (
                    /*
                     * The mark sits beside the heading rather than inside it, the
                     * same grouping OrganisationItem uses. Inside would put an
                     * image within the anchor that carries the card's stretched
                     * link, whose accessible name the heading already supplies --
                     * and the mark is decorative, so it has nothing to add to it.
                     *
                     * LogoMark renders nothing rather than a reserved box when it
                     * has no url, so a project without a logo is flush left and
                     * unchanged; only the row wrapper is new.
                     *
                     * min-w-0 for the same reason the text cell above carries it:
                     * the mark holds its width, so without this a long unbroken
                     * name would push the row past the cell instead of wrapping
                     * inside it.
                     */
                    <div className="flex items-center gap-3">
                        <LogoMark url={logoUrl} scale={logoScale} />
                        <h3 className="min-w-0 font-serif text-lg font-semibold text-ink transition-colors group-hover:text-accent">
                            {stretched === 'name' && url
                                ? <a href={url} target="_blank" rel="noreferrer" className={STRETCH_CLASS}>{name}</a>
                                : name}
                        </h3>
                    </div>
                )}

                {/* The links inside are lifted over the stretched overlay so they
                    are clickable; the prose around them is not, so the rest of the
                    card still opens the project. */}
                <p className="mt-2 leading-relaxed text-ink-muted [&_a]:relative [&_a]:z-10">
                    <RichText text={project.description} />
                </p>

                {/*
                 * bg-paper rather than the bg-rule-faint RoleBlock uses: on this
                 * card rule-faint is the card, so those chips would vanish into
                 * it. paper inverts the step and keeps the same 1.16:1 the page
                 * chips have. Text stays ink-muted, 9.06:1 / 8.64:1 on paper.
                 */}
                {skills.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5 list-none">
                        {skills.map((skill, index) => (
                            <li key={index} className="rounded-[2px] bg-paper px-2 py-[3px] text-[11.5px] text-ink-muted">
                                {skill}
                            </li>
                        ))}
                    </ul>
                )}

                {/*
                 * mt-auto pins the tail to the bottom of the card so the figures
                 * line up across a row instead of floating wherever each
                 * description happens to end.
                 */}
                {(project.figure || project.url) && (
                    <div className="mt-auto">
                        {/*
                         * Ruled off like RoleBlock's Result, for the same reason:
                         * the number is the point of the entry. Inverted against
                         * it -- figure first and large -- because on a project
                         * card the number outranks its own label.
                         *
                         * Gated on figure alone, so a caption saved without one
                         * is dropped rather than printed as a stray label.
                         */}
                        {project.figure && (
                            <div className="mt-4 border-t border-rule pt-3">
                                <div className="font-serif text-2xl leading-none text-accent">{project.figure}</div>
                                {/*
                                 * ink-muted, not the ink-faint the brief asked
                                 * for: on this card ink-faint is 3.98:1 (light)
                                 * / 4.14:1 (dark) and fails AA at 10px. Same
                                 * substitution Task 6 made on the chips.
                                 */}
                                {project.figureCaption && (
                                    <div className="mt-1.5 text-[10px] uppercase tracking-[0.13em] text-ink-muted">
                                        {project.figureCaption}
                                    </div>
                                )}
                            </div>
                        )}

                        {/*
                         * The card is the link, so this is a label for it, not a
                         * link of its own -- hence no underline. The arrow is
                         * what carries the affordance without colour, since
                         * accent alone would not (WCAG 1.4.1).
                         */}
                        {url && (
                            <div className="mt-4 text-[13px] text-accent transition-colors group-hover:text-ink">
                                {stretched === 'footer'
                                    ? <a href={url} target="_blank" rel="noreferrer" className={STRETCH_CLASS}>{showHost ? host : 'Visit'} <span aria-hidden="true">→</span></a>
                                    : <>{showHost ? host : 'Visit'} <span aria-hidden="true">→</span></>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    /*
     * Always a div now, never an anchor. The card's accessible name comes from
     * whichever element took the stretched link, so the aria-label this wrapper
     * used to carry -- there to stop a screen reader building the link's name out
     * of the heading, the description, the figure and every skill chip -- is
     * redundant and gone with it.
     *
     * The hover grouping is scoped to the linked case rather than set on every
     * card. A card with no url has nothing to open, and lighting its title on
     * hover would promise a click that does not exist -- which is what the
     * unconditional version of this line did.
     *
     * The ring it used to carry is gone from here too, and is drawn by the
     * stretched pseudo-element instead. It still lands outside the card border,
     * on paper rather than on the card's own fill: 8.03:1 (light) / 6.82:1
     * (dark), past the 3:1 in WCAG 1.4.11.
     */
    return (
        <div className={wrapperClass}>
            {body}
        </div>
    );
};

export default ProjectItem;
