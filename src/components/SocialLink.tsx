import { type SocialLinkItemProps } from "../types/props";
import { Github, Linkedin, Mail } from 'lucide-react';

const SocialLink: React.FC<SocialLinkItemProps> = ({ name, url, icon }) => {
  const iconComponents = {
    Github,
    Linkedin,
    Mail
  } as const;
  
  const Icon = iconComponents[icon];
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-blue-600 mx-2 transition-transform duration-300 hover:scale-110" 
      aria-label={name}
    >
      <Icon size={24} />
    </a>
  );
};

export default SocialLink; 