import { type ProjectItemProps } from '../types/props';

interface ProjectItemComponentProps {
    project: ProjectItemProps;
}

/*
 * The card sits one step off --paper on --rule-faint. That step is only 1.16:1,
 * the same separation the skill chips already rely on elsewhere, so the hairline
 * border is the second cue rather than decoration -- neither carries the card on
 * its own.
 */
const CARD_CLASS =
    'flex h-full flex-col overflow-hidden rounded-[3px] border border-rule bg-rule-faint';

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

    const body = (
        <>
            {/*
             * Fixed ratio, not the source ratio: without it one tall screenshot
             * sets the height of its whole grid row and the card beside it is
             * left with a stripe of empty background under its text.
             *
             * alt is empty because the name sits directly beneath it and the
             * link that wraps the card is already named -- alt here would be the
             * third reading of the same string.
             */}
            {project.screenshotUrl && (
                <img
                    src={project.screenshotUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/10] w-full border-b border-rule object-cover object-top"
                />
            )}

            <div className="flex flex-1 flex-col p-5">
                {name && (
                    <h3 className="font-serif text-lg font-semibold text-ink transition-colors group-hover:text-accent">
                        {name}
                    </h3>
                )}

                <p className="mt-2 leading-relaxed text-ink-muted">{project.description}</p>

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
                        {project.url && (
                            <div className="mt-4 text-[13px] text-accent transition-colors group-hover:text-ink">
                                {showHost ? host : 'Visit'} <span aria-hidden="true">→</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );

    if (!project.url) {
        return <div className={CARD_CLASS}>{body}</div>;
    }

    /*
     * aria-label pins the link's accessible name to the project name. Without
     * it the name is built from everything inside -- heading, description,
     * figure, caption, every skill -- and a screen reader's link list turns into
     * a paragraph per card. The visible name is inside the label, so 2.5.3 holds.
     *
     * Omitted outright, not set to an empty string, when the name is missing: an
     * empty aria-label leaves the link with no accessible name at all (WCAG
     * 4.1.2), while omitting it falls back to the card's contents. That is the
     * verbose reading the label exists to prevent, but a long name beats none.
     *
     * The card holds no second link, so wrapping it is still valid HTML. If one
     * is ever added, this has to become a stretched link -- the name as the
     * anchor, with an absolutely positioned pseudo-element pinned to the inset
     * of a positioned card -- because an anchor inside an anchor is not.
     */
    return (
        <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            aria-label={name || undefined}
            /*
             * The offset puts the ring outside the card border, on paper, not
             * on the card's own rule-faint fill: 8.03:1 (light) / 6.82:1 (dark)
             * against paper, past the 3:1 in WCAG 1.4.11. Against the fill it
             * would be 6.91:1 / 5.87:1, so the ring clears either way, but only
             * the outer measurement is the one that applies.
             */
            className={`group ${CARD_CLASS} focus-visible:outline-accent transition-colors hover:border-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2`}
        >
            {body}
        </a>
    );
};

export default ProjectItem;
