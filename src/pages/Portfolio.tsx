import FadeIn from '../components/FadeIn';
import SocialLink from '../components/SocialLink';
import ExperienceItem from '../components/ExperienceItem';
import EducationItem from '../components/EducationItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { type EducationItemProps, type ExperienceItemProps, type SocialLinkItemProps} from '../types/props';
import { useAllPortfolioData } from '../hooks/useData';
import { R2_PROFILE_PICTURE } from '../constants/app';


const Portfolio: React.FC = () => {
    const { personalInfo, experiences, education, socialLinks, isLoading, isError, error } = useAllPortfolioData();

    if (isLoading) {
        return (
        <div className="bg-gray-100 min-h-screen font-sans flex items-center justify-center">
            <LoadingSpinner />
        </div>
        )
    }

    if (isError) {
        return (
        <div className="bg-gray-100 min-h-screen font-sans flex items-center justify-center">
            <ErrorMessage message={error?.message || 'Failed to load portfolio data'} />
        </div>
        )
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <FadeIn>
                <header className="py-8 text-center">
                    <img
                        src={R2_PROFILE_PICTURE}
                        alt="Ask Hallem-Berg"
                        className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg"
                    />
                    <h1 className="text-3xl font-bold mb-2">{personalInfo.data?.name}</h1>
                    <p className="text-xl text-gray-600 mb-4">{personalInfo.data?.title}</p>
                    <div className="flex justify-center">
                        {socialLinks.data?.map((link, index: number) => (
                            <SocialLink key={index} {...link as SocialLinkItemProps} />
                        ))}
                    </div>
                </header>
            </FadeIn>

            <main className="container mx-auto px-4 py-8">
                <FadeIn delay={300}>
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">About Me</h2>
                        <p className="text-gray-700">{personalInfo.data?.about}</p>
                    </section>
                </FadeIn>

                <FadeIn delay={600}>
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Experience</h2>
                        {experiences.data?.map((exp: ExperienceItemProps, index: number) => (
                            <ExperienceItem key={index} {...exp} />
                        ))}
                    </section>
                </FadeIn>

                <FadeIn delay={900}>
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Education</h2>
                        {education.data?.map((edu: EducationItemProps, index: number) => (
                            <EducationItem key={index} {...edu} />
                        ))}
                    </section>
                </FadeIn>
            </main>
        </div>
    );
};

export default Portfolio;