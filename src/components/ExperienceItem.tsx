import FadeIn from "./FadeIn";
import { type ExperienceItemProps } from "../types/props";
import { resolveLinks } from "../func/organisations";

const ExperienceItem: React.FC<ExperienceItemProps> = ({ 
    title, 
    company, 
    date, 
    description, 
    skills,
    readMoreUrl,
    links
}) => (
    <FadeIn>
        <div className="mb-6">
            <h3 className="text-xl font-semibold dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{company} | {date}</p>
            <p className="mt-2 text-gray-700 dark:text-gray-400">{description}</p>
            {resolveLinks(links, readMoreUrl).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {resolveLinks(links, readMoreUrl).map((link, index) => (
                        <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        // These can now point anywhere, not just pages.askhb.no.
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
                        >
                        {link.label} →
                        </a>
                    ))}
                </div>
            )}
            <div className="mt-2">
                {skills.map((skill: string, index: number) => (
                    <span 
                        key={index} 
                        className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 dark:bg-gray-800 dark:text-gray-300"
                        >
                        {skill}
                    </span>
                ))}
            </div>
        </div>
    </FadeIn>
);

export default ExperienceItem;