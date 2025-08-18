import type { ReactNode } from 'react';

export interface PersonalInfo { 
    name: string;
    title: string;
    about: string;
}

export interface ExperienceItemProps {
    title: string;
    company: string;
    date: string;
    description: string;
    skills: string[];
    readMoreUrl?: string;
}

export interface EducationItemProps {
    degree: string;
    institution: string;
    date: string;
    description: string[];
}

export interface SocialLinkItemProps {
    name: string;
    url: string;
    icon: 'Github' | 'Linkedin' | 'Mail';
}

export interface FadeInProps {
    children: ReactNode;
    delay?: number;
}