import FadeIn from '../components/FadeIn';
import SocialLink from '../components/SocialLink';
import ExperienceItem from '../components/ExperienceItem';
import EducationItem from '../components/EducationItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { type EducationItemProps, type ExperienceItemProps, type SocialLinkItemProps} from '../types/props';
import { useAllPortfolioData } from '../hooks/useData';
import { R2_PROFILE_PICTURE } from '../constants/app';
import DarkModeToggle from '../components/DarkModeToggle';
import { Download } from 'lucide-react';
import socialLinks from '../config/sociallinks.json';


const Portfolio: React.FC = () => {
    const { personalInfo, experiences, education, isLoading, isError, error } = useAllPortfolioData();

    if (isLoading) {
        return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans flex items-center justify-center">
            <LoadingSpinner />
        </div>
        )
    }

    if (isError) {
        return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans flex items-center justify-center">
            <ErrorMessage message={error?.message || 'Failed to load portfolio data'} />
        </div>
        )
    }

    const headerDelay = 100;
    const aboutDelay = 150;
    const sectionDelay = 100;
    const itemStagger = 60;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
           
            <FadeIn delay={headerDelay}>
                <header className="py-8 text-center relative">
                    <div className="container mx-auto px-4 relative max-w-6xl">
                        {/* Dark mode toggle positioned in top-right of container */}
                        <div className="absolute top-0 right-4">
                            <DarkModeToggle />
                        </div>
                        
                        <div className="text-center">
                            <img
                                src={R2_PROFILE_PICTURE}
                                alt="Ask Hallem-Berg"
                                className="w-26 h-26 md:w-28 md:h-28 mx-auto mb-4"
                            />
                            
                            <h1 className="md:text-3xl text-2xl font-bold mb-2 dark:text-white">{personalInfo.data?.name}</h1>
                            <p className="md:text-xl text-lg text-gray-600 dark:text-gray-300 mb-4">{personalInfo.data?.title}</p>
                            <div className="flex justify-center">
                                {socialLinks.map((link, index: number) => (
                                    <SocialLink key={index} {...link as SocialLinkItemProps} />
                                ))}
                            </div>

                            {personalInfo.data?.cvUrl && (
                                <a
                                    href={personalInfo.data.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
                                >
                                    <Download size={18} />
                                    <span className="text-sm font-medium">Download CV</span>
                                </a>
                            )}
                        </div>
                    </div>
                </header>
            </FadeIn>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <FadeIn delay={aboutDelay}>
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 dark:text-white">About Me</h2>
                        <p className="text-gray-700 dark:text-gray-300">{personalInfo.data?.about}</p>
                    </section>
                </FadeIn>

                <FadeIn delay={sectionDelay}>
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 dark:text-white">Experience</h2>
                        {experiences.data?.map((exp: ExperienceItemProps, index: number) => (
                            <FadeIn key={index} delay={index * itemStagger}>
                                <ExperienceItem {...exp} />
                            </FadeIn>
                        ))}
                    </section>
               </FadeIn>

                <FadeIn delay={sectionDelay}>
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 dark:text-white">Education</h2>
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