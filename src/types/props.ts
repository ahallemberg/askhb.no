import type { ReactNode } from 'react';

export interface PersonalInfo { 
    name: string;
    title: string;
    about: string;
    cvUrl?: string;
}

export interface PortfolioLink {
    label: string;
    url: string;
}

export interface RoleProps {
    title: string;
    date: string;
    description: string;
    // The ruled "Result" line. Absent on entries with no clean headline number;
    // the layout closes up rather than leaving a gap.
    result?: string;
    skills: string[];
    readMoreUrl?: string;
    links?: PortfolioLink[];
}

export interface OrganisationProps {
    company: string;
    location?: string;
    date: string;
    logoUrl?: string;
    // Optical size correction. Marks differ in ink coverage, so identical boxes do
    // not give identical visual weight. Default 1.
    logoScale?: number;
    // e.g. "Volunteer, 25+ hrs/week".
    commitment?: string;
    roles: RoleProps[];
}

export interface ProjectItemProps {
    name: string;
    description: string;
    url?: string;
    screenshotUrl?: string;
    figure?: string;
    figureCaption?: string;
    skills?: string[];
}

// The flat shape the bucket still holds: one entry per role, the employer repeated
// across entries, location inside the company string. Nothing imports it -- the
// normaliser reads those entries field by field, since a hand-edited file cannot be
// trusted to match a type -- but it stays as the written record of that shape until
// admin has rewritten the file into OrganisationProps.
export interface ExperienceItemProps {
    title: string;
    company: string;
    date: string;
    description: string;
    skills: string[];
    // Superseded by links, and kept because entries written before multi-link
    // support have only this. admin.askhb.no derives it from the first link.
    readMoreUrl?: string;
    links?: PortfolioLink[];
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
    icon: 'Github' | 'Linkedin' | 'Mail' | 'Phone';
}

export interface FadeInProps {
    children: ReactNode;
    delay?: number;
}