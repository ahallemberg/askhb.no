import { type RoleProps } from '../types/props';
import { resolveLinks } from '../func/organisations';

interface RoleBlockProps {
    role: RoleProps;
    /*
     * Set by OrganisationItem when the employer owns more than one role. A
     * nested title steps down to sans so the serif company name above stays the
     * anchor of the entry; on its own the title is the only heading in the
     * block and keeps the serif.
     */
    nested?: boolean;
}

const RoleBlock: React.FC<RoleBlockProps> = ({ role, nested = false }) => {
    // R2 still holds both link shapes; resolveLinks is the one place that knows.
    const links = resolveLinks(role.links, role.readMoreUrl);

    /*
     * Typed as required, but fetchJsonData casts without validating and the
     * bucket is hand-editable, so a row missing `skills` must close the block up
     * rather than throw -- Portfolio gates the whole page on one isError, so an
     * exception here would cost the entire page over one bad row.
     */
    const skills = role.skills ?? [];

    return (
        <div>
            <h4 className={nested ? 'text-[15px] font-semibold text-ink' : 'font-serif text-lg font-medium text-ink'}>
                {role.title}
            </h4>

            {/* Pre-formatted upstream -- rendered verbatim, never parsed. */}
            {role.date && (
                <p className="mt-1 text-[11px] uppercase tracking-[0.13em] text-ink-faint">{role.date}</p>
            )}

            <p className="mt-2 leading-relaxed text-ink-muted">{role.description}</p>

            {/*
             * The point of the redesign: the number that sells the work gets a
             * rule and a label instead of sitting mid-paragraph. Absent
             * `result` this renders nothing at all -- no rule, no label, no
             * gap -- which is why it beat a marginal figure: several entries
             * have no single headline number and a rail would sit empty.
             */}
            {role.result && (
                <div className="mt-3 border-t border-rule pt-2">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-accent">Result</div>
                    <div className="mt-1 font-serif text-base text-ink">{role.result}</div>
                </div>
            )}

            {links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                    {links.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            // These can point anywhere now, not just pages.askhb.no.
                            rel="noreferrer"
                            /*
                             * Underlined, not accent-coloured alone: accent
                             * against the body copy beside it is 1.13:1
                             * (light) / 1.27:1 (dark), nowhere near the 3:1
                             * WCAG 1.4.1 wants of a colour-only link cue.
                             *
                             * The focus ring is accent too, but that comparison
                             * is against paper rather than the copy -- 8.03:1
                             * (light) / 6.82:1 (dark), clear of the 3:1 in
                             * 1.4.11. focus-visible keeps it off mouse clicks.
                             */
                            className="text-[13px] text-accent underline decoration-1 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-accent rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            {link.label} <span aria-hidden="true">→</span>
                        </a>
                    ))}
                </div>
            )}

            {/*
             * Tags carry content, not chrome, so they take --ink-muted, not the
             * --ink-faint the dates use. On the rule-faint chip, ink-faint
             * measures 3.98:1 (light) / 4.14:1 (dark) and fails AA outright;
             * ink-muted holds 7.81:1 / 7.44:1. Subordination comes from size,
             * not from contrast.
             */}
            {skills.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5 list-none">
                    {skills.map((skill, index) => (
                        <li key={index} className="rounded-[2px] bg-rule-faint px-2 py-[3px] text-[11.5px] text-ink-muted">
                            {skill}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RoleBlock;
