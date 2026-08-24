import FadeIn from '../components/FadeIn';
import SocialLink from '../components/SocialLink';
import SectionHeading from '../components/SectionHeading';
import OrganisationItem from '../components/OrganisationItem';
import ProjectItem from '../components/ProjectItem';
import EducationItem from '../components/EducationItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
    type EducationItemProps,
    type OrganisationProps,
    type ProjectItemProps,
    type SocialLinkItemProps
} from '../types/props';
import { useAllPortfolioData } from '../hooks/useData';
import { splitParagraphs } from '../func/text';
import { R2_PROFILE_PICTURE } from '../constants/app';
import DarkModeToggle from '../components/DarkModeToggle';
import RichText from '../components/RichText';
import { Download } from 'lucide-react';
import socialLinks from '../config/sociallinks.json';

/*
 * The reading measure, shared by the header and the body so the name, the rules
 * and the prose all sit on one edge.
 *
 * Below the desktop breakpoint this is unchanged: 36rem of box minus the 1.5rem
 * of padding on each side leaves a 33rem text column, which puts the About
 * paragraph at ~66 characters a line -- measured in the browser against the real
 * copy, not estimated. The old cap was 1150px and ~140 characters; 42rem, the
 * value an earlier plan proposed, is ~84 and still well past the 65-75 a reading
 * measure wants.
 *
 * From the desktop breakpoint up the box becomes two tracks rather than one: an
 * identity rail of 16rem and the measure beside it. 58rem of box, less 2rem of
 * padding on each side, less the rail, less the 3.5rem gutter between them,
 * leaves 552px of text -- about 69 characters, so the range above still holds
 * and the page gains 24px of measure instead of sprawling to the viewport.
 *
 * Narrowing the column rather than enlarging the type, because the type sizes are
 * already spent: RoleBlock's nested title is 15px and its standalone title 18px,
 * both sized against a 16px body. Pushing the body to 17-18px would leave the
 * nested role title at or below the size of the prose underneath it -- a
 * hierarchy inversion in the busiest section of the page, to fix a problem that
 * costs nothing to fix here.
 */
const SHELL =
    'mx-auto w-full max-w-[36rem] px-6 ' +
    'lg:grid lg:max-w-[58rem] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14 lg:px-8 lg:pt-12';

const Portfolio: React.FC = () => {
    const { personalInfo, experiences, education, projects, isLoading, isError, error } = useAllPortfolioData();

    if (isLoading) {
        return (
        <div className="bg-paper min-h-screen font-sans flex items-center justify-center">
            <LoadingSpinner />
        </div>
        )
    }

    if (isError) {
        return (
        <div className="bg-paper min-h-screen font-sans flex items-center justify-center">
            <ErrorMessage message={error?.message || 'Failed to load portfolio data'} />
        </div>
        )
    }

    const headerDelay = 100;
    const aboutDelay = 150;
    const sectionDelay = 100;
    const itemStagger = 60;

    const about = splitParagraphs(personalInfo.data?.about);

    return (
        <div className="bg-paper text-ink min-h-screen font-sans">
            <div className={SHELL}>
                {/*
                 * The rail's cell. It is left to stretch to the height of the
                 * row, and that is what gives the block inside it somewhere to
                 * travel while pinned. Pinning this element instead would pin
                 * something already as tall as the scroll range, so it would
                 * never move; asking the grid to align its cells to the start
                 * has the same effect for the same reason.
                 */}
                <div>
                    <div className="lg:sticky lg:top-12">
                        <FadeIn delay={headerDelay}>
                            <header className="relative pt-8 pb-14 text-center lg:pt-0 lg:pb-0 lg:text-left">
                                {/*
                                 * The stored URL when there is one, the bucket's fixed key
                                 * otherwise -- the two name the same object, and the stored
                                 * one differs only by the query that gets a freshly uploaded
                                 * photo past the edge cache. Falsy rather than nullish, so a
                                 * field written as an empty string falls back as well.
                                 */}
                                <img
                                    src={personalInfo.data?.profilePictureUrl || R2_PROFILE_PICTURE}
                                    alt="Ask Hallem-Berg"
                                    className="w-26 h-26 md:w-28 md:h-28 mx-auto mb-5 lg:mx-0 lg:h-24 lg:w-24"
                                />

                                <h1 className="font-serif text-4xl font-medium tracking-tight text-ink lg:text-3xl">{personalInfo.data?.name}</h1>
                                <p className="mt-2 text-lg text-ink-faint lg:text-base">{personalInfo.data?.title}</p>

                                <div className="mt-5 flex justify-center lg:mt-6 lg:items-center lg:justify-between">
                                    {/*
                                     * Below the desktop breakpoint this is taken
                                     * out of the flow, which is what keeps the
                                     * links beside it centred -- nothing in flow
                                     * shares their row. Its horizontal offset is
                                     * negative because the shell now owns the
                                     * padding this header used to carry: the
                                     * header's box is inset by that padding, and
                                     * pushing back out by a third of it lands the
                                     * control on the column's edge, which is
                                     * where it sat before the rail existed. From
                                     * the breakpoint up it returns to the flow
                                     * and the row pushes it to the rail's far
                                     * edge.
                                     *
                                     * It is deliberately written before the links
                                     * and reordered past them from the breakpoint
                                     * up, so do not "tidy" it back below them.
                                     * Source order is what a keyboard and a screen
                                     * reader follow, and out of the flow this sits
                                     * at the top of the header, visually above the
                                     * links -- reaching it after them would be a
                                     * focus order that contradicts the page. Only
                                     * the desktop row, where it really is the last
                                     * thing in the line, reorders it, and that
                                     * reordering is visual only.
                                     */}
                                    <div className="absolute top-6 -right-2 lg:static lg:order-last">
                                        <DarkModeToggle />
                                    </div>

                                    <div className="flex lg:-ml-2">
                                        {socialLinks.map((link, index: number) => (
                                            <SocialLink key={index} {...link as SocialLinkItemProps} />
                                        ))}
                                    </div>
                                </div>

                                {/*
                                 * Rendered only when the field is set. The R2 bucket's CORS
                                 * policy rejects a HEAD from this origin, so the page cannot
                                 * check whether a CV exists -- admin.askhb.no stores the answer.
                                 */}
                                {personalInfo.data?.cvUrl && (
                                    <a
                                        href={personalInfo.data.cvUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        /*
                                         * Same focus ring as the header's other controls:
                                         * accent at 2px, offset clear of the border so it
                                         * reads as a ring rather than thickening it. On
                                         * paper that is 8.03:1 (light) / 6.82:1 (dark),
                                         * well past the 3:1 WCAG 1.4.11 asks of a focus
                                         * indicator. focus-visible, not focus, so a mouse
                                         * click does not leave the ring behind.
                                         */
                                        className="border-rule text-ink-muted hover:border-accent hover:text-accent focus-visible:outline-accent mt-6 inline-flex items-center gap-2 rounded-[2px] border px-4 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                                    >
                                        <Download size={16} />
                                        <span className="text-[13px] font-medium">Download CV</span>
                                    </a>
                                )}
                            </header>
                        </FadeIn>
                    </div>
                </div>

                <main className="pb-24 lg:pb-20">
                    <FadeIn delay={aboutDelay}>
                        <section className="mb-16 lg:mb-13 [div:last-child>&]:mb-0">
                            <SectionHeading>About</SectionHeading>
                            {about.map((paragraph, index: number) => (
                                <p key={index} className={`text-ink-muted leading-relaxed ${index > 0 ? 'mt-4' : ''}`}>
                                    <RichText text={paragraph} />
                                </p>
                            ))}
                        </section>
                    </FadeIn>

                    {/*
                     * Guarded the same way Projects is below, and for the same reason:
                     * normaliseExperiences returns [] for a file it cannot read, and a
                     * ruled heading with nothing under it looks like the page broke
                     * rather than like there is nothing to show.
                     */}
                    {!!experiences.data?.length && (
                        <FadeIn delay={sectionDelay}>
                            <section className="mb-16 lg:mb-13 [div:last-child>&]:mb-0">
                                <SectionHeading>Experience</SectionHeading>
                                {experiences.data.map((organisation: OrganisationProps, index: number) => (
                                    <FadeIn key={index} delay={index * itemStagger}>
                                        <OrganisationItem organisation={organisation} />
                                    </FadeIn>
                                ))}
                            </section>
                        </FadeIn>
                    )}

                    <FadeIn delay={sectionDelay}>
                        <section className="mb-16 lg:mb-13 [div:last-child>&]:mb-0">
                            <SectionHeading>Education</SectionHeading>
                            {/*
                             * The per-item FadeIn is load-bearing here, not just
                             * animation: EducationItem drops its trailing hairline
                             * with an arbitrary variant that matches only when its
                             * wrapping div is the last child of this section, so the
                             * question is asked of this wrapper. Remove it and every
                             * entry keeps its rule.
                             */}
                            {education.data?.map((edu: EducationItemProps, index: number) => (
                                <FadeIn key={index} delay={index * itemStagger}>
                                    <EducationItem {...edu} />
                                </FadeIn>
                            ))}
                        </section>
                    </FadeIn>

                    {/*
                     * projects.json does not exist in the bucket yet and useProjects
                     * turns its 404 into [] rather than an error. A ruled heading over
                     * nothing looks broken, so the whole section waits for content.
                     */}
                    {!!projects.data?.length && (
                        <FadeIn delay={sectionDelay}>
                            <section className="mb-16 lg:mb-13 [div:last-child>&]:mb-0">
                                <SectionHeading>Projects</SectionHeading>
                                {/* Two columns do not survive 375px -- the cells land
                                    near 160px -- so the second one starts at sm.

                                    A trailing card with no partner spans both cells
                                    instead of leaving the rest of its row empty --
                                    an odd count, the lone project included, since
                                    one card is both the last and an odd one. Half a
                                    row of nothing reads as a card that failed to
                                    load rather than as the last one there is.

                                    Asked for from sm up only: below that the row
                                    holds a single cell, and a child asking to cover
                                    two would have the second one invented for it,
                                    which halves every card on the narrowest screens
                                    the layout has. */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                                    {projects.data.map((project: ProjectItemProps, index: number) => (
                                        <FadeIn key={index} delay={index * itemStagger}>
                                            <ProjectItem project={project} />
                                        </FadeIn>
                                    ))}
                                </div>
                            </section>
                        </FadeIn>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Portfolio;
