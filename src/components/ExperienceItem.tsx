import FadeIn from "./FadeIn";
import { type ExperienceItemProps } from "../types/props";

const ExperienceItem: React.FC<ExperienceItemProps> = ({ 
  title, 
  company, 
  date, 
  description, 
  skills 
}) => (
  <FadeIn>
    <div className="mb-6 flex flex-col md:flex-row items-start">
      <div className="md:w-3/4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-600">{company} | {date}</p>
        <p className="mt-2 text-gray-700">{description}</p>
        <div className="mt-2">
          {skills.map((skill: string, index: number) => (
            <span 
              key={index} 
              className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  </FadeIn>
);

export default ExperienceItem;