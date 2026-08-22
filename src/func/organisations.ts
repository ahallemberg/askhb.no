import { type ExperienceItemProps, type OrganisationProps, type RoleProps, type PortfolioLink } from '../types/props';

const DEFAULT_LINK_LABEL = 'Read more';

// R2 entries may carry either shape: `links` since multi-link support, or a lone
// `readMoreUrl` from before it. Normalising here keeps the markup to one path.
// Moved from ExperienceItem.tsx, which this work replaces.
//
// The label is defaulted on both paths, not just the readMoreUrl one: an anchor
// whose only content is an aria-hidden arrow has no accessible name at all (WCAG
// 4.1.2), so a saved-but-unlabelled link would read as nothing in a link list. An
// entry with no url is dropped outright -- there is no link to name. A `links`
// array that survives none of that falls through to readMoreUrl, which admin
// derives from the first link anyway.
export const resolveLinks = (links?: PortfolioLink[], readMoreUrl?: string): PortfolioLink[] => {
    const labelled = (links ?? [])
        .filter((link): link is PortfolioLink => typeof link?.url === 'string' && link.url.trim() !== '')
        .map((link) => ({
            url: link.url,
            label: typeof link.label === 'string' && link.label.trim() !== '' ? link.label : DEFAULT_LINK_LABEL
        }));

    if (labelled.length > 0) return labelled;
    return readMoreUrl ? [{ label: DEFAULT_LINK_LABEL, url: readMoreUrl }] : [];
};

const LOCATION_SEPARATOR = ' - ';

// Legacy entries encode location in the company string ("Q-Free - Trondheim"), and
// splitting it off is what makes two rows from the same employer group together.
// The separator needs its surrounding spaces, so a hyphenated name like "Q-Free"
// survives intact; lastIndexOf so the trailing segment wins on "A - B - C".
//
// Deliberately identical to splitCompany in admin.askhb.no, including its quirk of
// keeping a dangling separator on malformed input ("Foo - " -> "Foo -"). While the
// bucket still holds the flat shape both apps normalise the same bytes, so matching
// behaviour matters more than tidying an edge case that does not occur in the data.
const splitCompany = (raw: string): { company: string; location?: string } => {
    const index = raw.lastIndexOf(LOCATION_SEPARATOR);
    if (index === -1) return { company: raw.trim() };
    const company = raw.slice(0, index).trim();
    const location = raw.slice(index + LOCATION_SEPARATOR.length).trim();
    if (company === '' || location === '') return { company: raw.trim() };
    return { company, location };
};

/*
 * A role has to be an object before the markup can read `date` or `title` off it:
 * OrganisationItem reaches straight for roles[0].date, so a null element there is
 * a render-time throw, and Portfolio cannot catch it -- the page white-screens
 * rather than showing ErrorMessage. Arrays are rejected too; they survive the
 * property reads but render as an empty role block.
 *
 * Nothing beyond the shape is checked. A role missing `title` renders one empty
 * heading, which is a visible gap in one entry rather than a lost page.
 */
const isRole = (value: unknown): value is RoleProps =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isOrganisation = (value: unknown): value is OrganisationProps =>
    typeof value === 'object' && value !== null &&
    Array.isArray((value as { roles?: unknown }).roles) &&
    (value as { roles: unknown[] }).roles.every(isRole);

/*
 * Malformed role elements are dropped before the row itself is judged, so one
 * stray null costs that role rather than the whole employer -- OrganisationItem
 * renders a roleless organisation as its header alone. Anything that is not
 * organisation-shaped passes through untouched, for isOrganisation to reject.
 */
const pruneRoles = (value: unknown): unknown => {
    if (typeof value !== 'object' || value === null) return value;
    const roles = (value as { roles?: unknown }).roles;
    if (!Array.isArray(roles)) return value;
    return { ...value, roles: roles.filter(isRole) };
};

// A legacy entry needs a company string to group by; anything else is skipped
// rather than allowed to throw. useAllPortfolioData collapses every query into one
// isError, so an exception here would blank the whole portfolio over one bad row.
const isLegacyEntry = (value: unknown): value is ExperienceItemProps =>
    typeof value === 'object' && value !== null && typeof (value as { company?: unknown }).company === 'string';

// Accepts the grouped shape admin now writes, or the flat array that predates it.
//
// Returns [] for anything unrecognisable rather than throwing: fetchJsonData casts
// without validating, so this function is the only guard, and a malformed file
// should cost one empty section rather than the whole page.
export const normaliseExperiences = (value: unknown): OrganisationProps[] => {
    if (!Array.isArray(value)) return [];
    if (value.length === 0) return [];
    // Pruned before the shape is decided, not after: an organisation whose roles
    // array holds a null fails isOrganisation, and would then be read as a legacy
    // row and rebuilt from fields it does not have.
    const pruned = value.map(pruneRoles);

    // The file is written wholesale, so the first element decides which shape it is.
    // Still filtered rather than cast: a stray malformed row would otherwise reach a
    // consumer that maps over `roles` and take the page down.
    if (isOrganisation(pruned[0])) return pruned.filter(isOrganisation);

    // Map keeps insertion order for string keys, so first-appearance order needs no
    // separate index — which matters because the two rows of one employer are not
    // adjacent in the live file.
    const byCompany = new Map<string, OrganisationProps>();

    for (const item of value) {
        if (!isLegacyEntry(item)) continue;

        const { company, location } = splitCompany(item.company);
        const role: RoleProps = {
            title: item.title,
            date: item.date,
            description: item.description,
            skills: item.skills,
            readMoreUrl: item.readMoreUrl,
            links: item.links
        };

        const existing = byCompany.get(company);
        if (existing) {
            existing.roles.push(role);
            // First entry wins; they agree in practice, and an organisation has one.
            if (!existing.location && location) existing.location = location;
        } else {
            // The flat shape carries no organisation-level span and this repo has no
            // dateRange to compute one from, so the first role's date stands in.
            // admin writes a real span across the roles, so once it has saved once
            // this branch stops being reached and the stored span takes over.
            byCompany.set(company, { company, location, date: item.date, roles: [role] });
        }
    }

    return [...byCompany.values()];
};
