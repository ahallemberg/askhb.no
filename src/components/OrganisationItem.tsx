import LogoMark from './LogoMark';
import RoleBlock from './RoleBlock';
import { type OrganisationProps } from '../types/props';

interface OrganisationItemProps {
    organisation: OrganisationProps;
}

const OrganisationItem: React.FC<OrganisationItemProps> = ({ organisation }) => {
    /*
     * normaliseExperiences builds this array itself, dropping role elements it
     * cannot turn into objects, so what arrives here is always an array of
     * objects with fields of the right type -- roles[0].date below depends on
     * that, and so does everything RoleBlock renders. It can
     * still be empty, either because the employer was saved with no roles or
     * because every role it carried was pruned, so that case is guarded to
     * render the header alone rather than an orphaned rail with nothing behind
     * it. The ?? keeps this component honest if it is ever handed data that did
     * not come through the normaliser.
     */
    const roles = organisation.roles ?? [];

    /*
     * The flat R2 shape carries no organisation-level span, so the normaliser
     * stands the first role's date in for it. Printed on the meta line that
     * would either repeat the role's own date verbatim (one role) or claim a
     * span that stops before the later roles do (several) -- so it is dropped
     * whenever it is an exact copy. Every role prints its own date either way,
     * so nothing is lost. Once admin writes a real span the dates differ and
     * this line carries it.
     */
    const showDate = roles.length === 0 || roles[0].date !== organisation.date;

    const meta = [
        organisation.location,
        showDate ? organisation.date : undefined,
        organisation.commitment
    ].filter(Boolean).join(' · ');

    return (
        <article className="mb-10">
            {/* Name and meta group beside the mark, so both align to the name when
                a logo exists and sit flush left when LogoMark renders null. */}
            <header className="flex items-center gap-3">
                <LogoMark url={organisation.logoUrl} scale={organisation.logoScale} />
                <div>
                    <h3 className="font-serif text-xl font-semibold text-ink">{organisation.company}</h3>
                    {meta && (
                        <p className="mt-1 text-[11px] uppercase tracking-[0.13em] text-ink-faint">{meta}</p>
                    )}
                </div>
            </header>

            {/* One role reads as a single entry; a list of one would be a lie about
                the shape of the job. */}
            {roles.length === 1 && (
                <div className="mt-3">
                    <RoleBlock role={roles[0]} nested={false} />
                </div>
            )}

            {/*
             * Two or more nest, so two stints at one employer read as a
             * progression. The indent is what carries that -- the rail is
             * reinforcement only, at 1.32:1 it is barely visible, and the
             * grouping has to survive its absence.
             */}
            {roles.length > 1 && (
                <div className="mt-4 border-l-2 border-rule pl-4">
                    {roles.map((role, index) => (
                        <div key={index} className={index > 0 ? 'mt-6' : undefined}>
                            <RoleBlock role={role} nested />
                        </div>
                    ))}
                </div>
            )}
        </article>
    );
};

export default OrganisationItem;
