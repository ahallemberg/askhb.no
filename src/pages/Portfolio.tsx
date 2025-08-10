import { personalInfo, experiences, education, socialLinks } from '../data/portfolioData';
import profileImage from '../assets/profilepicture.png';
import FadeIn from '../components/FadeIn';
import SocialLink from '../components/SocialLink';
import ExperienceItem from '../components/ExperienceItem';
import EducationItem from '../components/EducationItem';
import { type EducationItemProps, type ExperienceItemProps, type SocialLinkItemProps} from '../types/props';

const Portfolio: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <FadeIn>
        <header className="py-8 text-center">
          <img
            src={profileImage}
            alt="Ask Hallem-Berg"
            className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg"
          />
          <h1 className="text-3xl font-bold mb-2">{personalInfo.name}</h1>
          <p className="text-xl text-gray-600 mb-4">{personalInfo.title}</p>
          <div className="flex justify-center">
            {socialLinks.map((link, index: number) => (
              <SocialLink key={index} {...link as SocialLinkItemProps} />
            ))}
          </div>
        </header>
      </FadeIn>

      <main className="container mx-auto px-4 py-8">
        <FadeIn delay={300}>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">About Me</h2>
            <p className="text-gray-700">{personalInfo.about}</p>
          </section>
        </FadeIn>

        <FadeIn delay={600}>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Experience</h2>
            {experiences.map((exp: ExperienceItemProps, index: number) => (
              <ExperienceItem key={index} {...exp} />
            ))}
          </section>
        </FadeIn>

        <FadeIn delay={900}>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Education</h2>
            {education.map((edu: EducationItemProps, index: number) => (
              <EducationItem key={index} {...edu} />
            ))}
          </section>
        </FadeIn>
      </main>
    </div>
  );
};

export default Portfolio;