import { type EducationItemProps } from '../types/props';
import RichText from './RichText';

/*
 * The GPA is one of the stronger signals on the page and arrives as the last of
 * two identically-styled lines inside `description`. It is lifted into a right
 * rail here rather than given its own field, because that is a presentation
 * change and a new field would mean another pass over the R2 / admin.askhb.no /
 * types three-way contract.
 *
 * Deliberately narrow: anchored, and requiring the literal colon. A missed
 * extraction is harmless -- the line simply renders where it already does -- but
 * a false positive silently moves real prose out of the description and into a
 * rail labelled GPA. So "GPA: 4,79/5" matches, "Graduated with a GPA of 4,79/5"
 * does not, and "GPA:" with nothing after it does not either (\S).
 */
const GPA_LINE = /^GPA:\s*(\S.*?)\s*$/i;

/*
 * Only the first match is lifted. The obvious filter() would drop every
 * matching line from the description, so a second GPA line -- a hand-edited row
 * carrying two -- would vanish from the page entirely. Here it stays put and
 * renders as an ordinary line.
 */
const partitionDescription = (lines: string[]) => {
    let gpa: string | undefined;
    const rest: string[] = [];

    for (const line of lines) {
        const match = gpa === undefined ? GPA_LINE.exec(line) : null;

        if (match) {
            gpa = match[1];
        } else {
            rest.push(line);
        }
    }

    return { gpa, rest };
};

const EducationItem: React.FC<EducationItemProps> = ({
    degree,
    institution,
    date,
    description
}) => {
    /*
     * Typed as required, but fetchJsonData casts without validating and the
     * bucket is hand-editable. Portfolio gates the whole page on one isError,
     * so a row missing `description` has to close up rather than throw.
     */
    const { gpa, rest } = partitionDescription(Array.isArray(description) ? description : []);

    // Same ' · ' meta line as OrganisationItem, rather than the old ' | '.
    const meta = [institution, date].filter(Boolean).join(' · ');

    return (
        /*
         * The hairline is dropped on the last entry through the FadeIn wrapper
         * Portfolio puts around each item, not through `last:`. Inside that
         * wrapper the article is always its parent's only child, so `last:`
         * would match every entry and delete every rule; `div:last-child > &`
         * asks the question one level up, where it is actually meaningful.
         * Should the wrapper ever go, this stops matching and the last entry
         * keeps a hairline -- a stray rule, not a lost feature.
         *
         * At 1.16:1 the rule is a whisper anyway; the spacing is what separates
         * the entries and the rule only confirms it.
         */
        <article className="mb-6 flex flex-col border-b border-rule-faint pb-6 sm:flex-row sm:items-start sm:gap-8 [div:last-child>&]:border-b-0 [div:last-child>&]:pb-0">
            {/* min-w-0 so Verdal's elective-course line wraps inside the column
                instead of pushing the rail off the entry. */}
            <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base font-semibold text-ink">{degree}</h3>

                {meta && (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.13em] text-ink-faint">{meta}</p>
                )}

                {rest.map((line, index) => (
                    <p key={index} className="mt-2 leading-relaxed text-ink-muted">
                        <RichText text={line} />
                    </p>
                ))}
            </div>

            {/*
             * Omitted outright when there is no GPA, rather than reserved as an
             * empty box: the rail is flush right, so the two entries that have
             * one still line up on the same edge, and ETH just ends at its
             * description instead of trailing a labelled void.
             *
             * ink-muted for the label and ink for the figure, not the ink-faint
             * the meta line uses. Same rule Task 6 set on the skill chips --
             * ink-faint is for chrome, and this is content. On paper ink-faint
             * is 4.615:1 (light) / 4.804:1 (dark), which clears AA by 2.6% in
             * light; at 10px that is too little headroom for the one number in
             * the section worth reading. ink-muted is 9.064:1 / 8.640:1 and the
             * figure in ink is 16.631:1 / 15.484:1.
             */}
            {gpa && (
                /*
                 * Capped and allowed to wrap, rather than held on one line. The
                 * regex takes the whole remainder of the line, so "4,79/5" is
                 * the expected value but "4,79/5 (ranked 3rd of 210)" is a
                 * legal one -- and nowrap on a shrink-0 column turns that into
                 * ~300px that cannot break, which on the stacked mobile branch
                 * is page-level horizontal scroll. The cap keeps a long value
                 * out of the description's column on the wide branch, and
                 * break-words handles the pathological case of a long value
                 * with no space in it to break at.
                 */
                <div className="mt-3 shrink-0 break-words sm:mt-0 sm:max-w-[10rem] sm:pt-0.5 sm:text-right">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">GPA</div>
                    <div className="mt-1 font-serif text-base text-ink">{gpa}</div>
                </div>
            )}
        </article>
    );
};

export default EducationItem;
