import { type EducationItemProps } from "../types/props";
import FadeIn from "./FadeIn";

const EducationItem: React.FC<EducationItemProps> = ({ 
    degree, 
    institution, 
    date, 
    description 
}) => (
    <FadeIn>
        <div className="mb-6">
            <h3 className="text-xl font-semibold dark:text-white">{degree}</h3>
            <p className="text-gray-600 dark:text-gray-300">{institution} | {date}</p>
            <div className="mt-2 text-gray-700 dark:text-gray-400">
                {description.map((line: string, index: number) => (
                    <p key={index} className={index > 0 ? "mt-1" : ""}>{line}</p>
                ))}
            </div>
        </div>
    </FadeIn>
);

export default EducationItem; 