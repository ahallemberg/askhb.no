import FadeIn from "./FadeIn";
import { type ExperienceItemProps } from "../types/props";

const ExperienceItem: React.FC<ExperienceItemProps> = ({ 
    title, 
    company, 
    date, 
    description, 
    skills,
    readMoreUrl
}) => (
    <FadeIn>
        <div className="mb-6">
            <h3 className="text-xl font-semibold dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{company} | {date}</p>
            <p className="mt-2 text-gray-700 dark:text-gray-400">{description}</p>
            {readMoreUrl && (
                <a 
                href={readMoreUrl} 
                target="_blank" 
                className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm transition-colors"
                >
                Read more →
                </a>
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