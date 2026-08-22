import { type OrganisationProps, type RoleProps, type PortfolioLink } from '../types/props';

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
 * An entry, and each role inside it, has to be a plain object before the markup can
 * read `date` or `title` off it: OrganisationItem reaches straight for
 * roles[0].date, so a null element there is a render-time throw, and Portfolio
 * cannot catch it -- the page white-screens rather than showing ErrorMessage.
 * Arrays are rejected too; they survive the property reads and render as an empty
 * entry.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/*
 * Field *types* are checked, not just the shape of the row around them. The markup
 * guards against a field being missing -- RoleBlock's `skills ?? []`,
 * splitParagraphs' typeof test -- but `??` says nothing about a field that is
 * present and wrong: a skills list saved as the string "React" has a truthy length
 * and no .map, so it reaches .map and throws, and a title, date or result saved as
 * an object throws inside React, which refuses to render one as a child. Either way
 * the page is gone, because useAllPortfolioData collapses every query into one
 * isError and there is nothing left to show ErrorMessage with.
 *
 * A wrong-typed field is therefore dropped rather than passed on, and it costs the
 * field rather than the role: an entry whose skills were mangled still shows its
 * title, dates and description. That is the same trade the role pruning below makes
 * for one bad role inside a good employer.
 */
const asText = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

// One unrenderable tag costs itself, not the other ten beside it.
const asTextList = (value: unknown): string[] | undefined =>
    Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : undefined;

/*
 * Both shapes converge here: a role inside a grouped organisation, and a legacy row,
 * which carries the very same field names one level up.
 *
 * RoleProps types title, date, description and skills as required because admin
 * writes all four; the cast restates that contract rather than weakening it, while
 * letting a hand-edited file that drops one leave a gap in a single entry instead of
 * losing the role wholesale.
 */
const toRole = (value: Record<string, unknown>): RoleProps => ({
    title: asText(value.title),
    date: asText(value.date),
    description: asText(value.description),
    result: asText(value.result),
    skills: asTextList(value.skills),
    readMoreUrl: asText(value.readMoreUrl),
    // Only that it is a list; the elements are resolveLinks' business, and it
    // already drops the ones it cannot make a labelled url out of.
    links: Array.isArray(value.links) ? (value.links as PortfolioLink[]) : undefined
} as RoleProps);

/*
 * The grouped shape admin now writes. It needs a name and a list of roles to be one:
 * an object carrying roles and no `company` string renders as an empty heading over
 * them, which reads as a broken page rather than a hand-edit gone wrong.
 *
 * Says nothing about the role *elements* -- they are filtered here instead, so a
 * single null role can never cost the entry its identity and get it re-read as a
 * legacy row, rebuilt from fields it does not have and stripped of every role it
 * does. An organisation whose roles all fall away still renders its header.
 */
const toOrganisation = (value: Record<string, unknown>): OrganisationProps | undefined => {
    if (typeof value.company !== 'string' || !Array.isArray(value.roles)) return undefined;

    return {
        company: value.company.trim(),
        location: asText(value.location),
        date: asText(value.date),
        // LogoMark calls .split on this the moment it is truthy.
        logoUrl: asText(value.logoUrl),
        logoScale: typeof value.logoScale === 'number' ? value.logoScale : undefined,
        commitment: asText(value.commitment),
        roles: value.roles.filter(isPlainObject).map(toRole)
    } as OrganisationProps;
};

/*
 * The flat shape that predates grouping: one row per role, the employer repeated
 * across rows, its location still inside the company string. Rebuilt as a one-role
 * organisation so that both shapes leave here identical and the rows sharing an
 * employer can be merged like any others.
 */
const toLegacyOrganisation = (value: Record<string, unknown>): OrganisationProps | undefined => {
    if (typeof value.company !== 'string') return undefined;

    const { company, location } = splitCompany(value.company);
    const role = toRole(value);

    // The flat shape carries no organisation-level span and this repo has no
    // dateRange to compute one from, so the first role's date stands in. admin
    // writes a real span across the roles, so once it has saved once this branch
    // stops being reached and the stored span takes over.
    return { company, location, date: role.date, roles: [role] } as OrganisationProps;
};

/*
 * One employer, one entry, however its rows were written -- including an employer
 * that appears in both shapes at once, which is precisely what a bucket halfway
 * through a rewrite holds. Later appearances contribute their roles in file order
 * and fill in only the organisation fields the first left empty; where both carry a
 * value the first wins, since they agree in practice and an employer has one
 * location.
 */
const addOrganisation = (byCompany: Map<unknown, OrganisationProps>, incoming: OrganisationProps): void => {
    /*
     * A row with no usable name cannot be grouped by one. Keying every such row on
     * '' would file unrelated jobs under a single blank heading, so each takes a
     * fresh object key instead, which no company name can collide with.
     */
    const key = incoming.company === '' ? {} : incoming.company;
    const existing = byCompany.get(key);

    if (!existing) {
        byCompany.set(key, incoming);
        return;
    }

    byCompany.set(key, {
        company: existing.company,
        location: existing.location ?? incoming.location,
        date: existing.date ?? incoming.date,
        logoUrl: existing.logoUrl ?? incoming.logoUrl,
        logoScale: existing.logoScale ?? incoming.logoScale,
        commitment: existing.commitment ?? incoming.commitment,
        roles: [...existing.roles, ...incoming.roles]
    });
};

/*
 * Accepts the grouped shape admin now writes, the flat array that predates it, or a
 * file holding some of each.
 *
 * Dispatched per element rather than sniffed off the first one. Surviving the bucket
 * mid-rewrite is the whole reason this module exists, and that is the one moment the
 * two shapes coexist -- where reading the file's shape from element 0 failed
 * silently: a grouped organisation in an otherwise-flat file was rebuilt as a single
 * role with every field undefined, so the page printed the employer's name over a
 * blank entry and looked finished. Per element, a row that cannot be read costs
 * itself and nothing else.
 *
 * Returns [] for anything unrecognisable rather than throwing: fetchJsonData casts
 * without validating, so this function is the only guard, and a malformed file
 * should cost one empty section rather than the whole page.
 */
export const normaliseExperiences = (value: unknown): OrganisationProps[] => {
    if (!Array.isArray(value)) return [];

    // Map keeps insertion order for its keys, so first-appearance order needs no
    // separate index — which matters because the two rows of one employer are not
    // adjacent in the live file.
    const byCompany = new Map<unknown, OrganisationProps>();

    for (const item of value) {
        if (!isPlainObject(item)) continue;

        // Grouped first: an entry carrying `roles` means them, even if it also
        // carries the legacy fields.
        const organisation = toOrganisation(item) ?? toLegacyOrganisation(item);
        if (organisation) addOrganisation(byCompany, organisation);
    }

    return [...byCompany.values()];
};
