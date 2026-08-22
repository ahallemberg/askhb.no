import { type SocialLinkItemProps } from "../types/props";
import { Github, Linkedin, Mail, Phone } from 'lucide-react';

const SocialLink: React.FC<SocialLinkItemProps> = ({ name, url, icon }) => {
    const iconComponents = {
        Github,
        Linkedin,
        Mail,
        Phone
    } as const;
    
    const Icon = iconComponents[icon];
    
    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            /*
             * ink-muted resting, accent on hover -- the same pair as the
             * Download CV button standing next to it in the header. 9.06:1
             * (light) / 8.64:1 (dark) at rest, 8.03:1 / 6.82:1 hovered; the
             * blue hover this replaces had no dark counterpart at all and
             * landed at 3.60:1 against a dark paper.
             *
             * Plain `transition` rather than the transform-only one it used to
             * carry: the class has to animate the colour as well now, and two
             * transition-property utilities do not compose -- whichever
             * Tailwind happens to emit last wins outright.
             *
             * Class names are deliberately not spelled out in this comment.
             * Tailwind 4 scans source as plain text, so a real utility name
             * written in prose is extracted as if it were markup and compiles
             * into the bundle -- naming the old blue here put its colour
             * variable back into the stylesheet this change removes it from.
             */
            className="text-ink-muted hover:text-accent focus-visible:outline-accent mx-2 rounded-[2px] transition duration-300 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={name}
            >
            <Icon size={24} />
        </a>
    );
};

export default SocialLink; 