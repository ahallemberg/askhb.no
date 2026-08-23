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
 * 36rem of box minus the 1.5rem of padding on each side leaves a 33rem text
 * column, which puts the About paragraph at ~66 characters a line -- measured in
 * the browser against the real copy, not estimated. The old 6xl cap was 1150px
 * and ~140 characters; 42rem, the value the plan proposed, is ~84 and still well
 * past the 65-75 a reading measure wants.
 *
 * Narrowing the column rather than enlarging the type, because the type sizes are
 * already spent: RoleBlock's nested title is 15px and its standalone title 18px,
 * both sized against a 16px body. Pushing the body to 17-18px would leave the
 * nested role title at or below the size of the prose underneath it -- a
 * hierarchy inversion in the busiest section of the page, to fix a problem that
 * costs nothing to fix here.
 */
const COLUMN = 'mx-auto w-full max-w-[36rem] px-6';

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

            <FadeIn delay={headerDelay}>
                <header className={`${COLUMN} relative pt-8 pb-14 text-center`}>
                    {/* Pinned to the column's right edge, not the viewport's, so it
                        lines up with the rules underneath it. */}
                    <div className="absolute top-6 right-4">
                        <DarkModeToggle />
                    </div>

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
                        className="w-26 h-26 md:w-28 md:h-28 mx-auto mb-5"
                    />

                    <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">{personalInfo.data?.name}</h1>
                    <p className="mt-2 text-lg text-ink-faint">{personalInfo.data?.title}</p>

                    <div className="mt-5 flex justify-center">
                        {socialLinks.map((link, index: number) => (
                            <SocialLink key={index} {...link as SocialLinkItemProps} />
                        ))}
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

            <main className={`${COLUMN} pb-24`}>
                <FadeIn delay={aboutDelay}>
                    <section className="mb-16">
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
                        <section className="mb-16">
                            <SectionHeading>Experience</SectionHeading>
                            {experiences.data.map((organisation: OrganisationProps, index: number) => (
                                <FadeIn key={index} delay={index * itemStagger}>
                                    <OrganisationItem organisation={organisation} />
                                </FadeIn>
                            ))}
                        </section>
                    </FadeIn>
                )}

                {/*
                 * projects.json does not exist in the bucket yet and useProjects
                 * turns its 404 into [] rather than an error. A ruled heading over
                 * nothing looks broken, so the whole section waits for content.
                 */}
                {!!projects.data?.length && (
                    <FadeIn delay={sectionDelay}>
                        <section className="mb-16">
                            <SectionHeading>Projects</SectionHeading>
                            {/* Two columns do not survive 375px -- the cells land
                                near 160px -- so the second one starts at sm. */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {projects.data.map((project: ProjectItemProps, index: number) => (
                                    <FadeIn key={index} delay={index * itemStagger}>
                                        <ProjectItem project={project} />
                                    </FadeIn>
                                ))}
                            </div>
                        </section>
                    </FadeIn>
                )}

                <FadeIn delay={sectionDelay}>
                    <section>
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
            </main>
        </div>
    );
};

export default Portfolio;
