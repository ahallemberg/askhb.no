import React, { useState, useEffect } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { personalInfo, experiences, education, socialLinks } from './data/portfolioData';
import profileImage from './assets/profilepicture.png';

const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

const ExperienceItem = ({ title, company, date, description, skills }) => (
  <FadeIn>
    <div className="mb-6 flex flex-col md:flex-row items-start">
      <div className="md:w-3/4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-600">{company} | {date}</p>
        <p className="mt-2 text-gray-700">{description}</p>
        <div className="mt-2">
          {skills.map((skill, index) => (
            <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  </FadeIn>
);

const EducationItem = ({ degree, institution, date, description }) => (
  <FadeIn>
    <div className="mb-6">
      <h3 className="text-xl font-semibold">{degree}</h3>
      <p className="text-gray-600">{institution} | {date}</p>
      <div className="mt-2 text-gray-700">
        {description.map((line, index) => (
          <p key={index} className={index > 0 ? "mt-1" : ""}>{line}</p>
        ))}
      </div>
    </div>
  </FadeIn>
);

const SocialLink = ({ name, url, icon }) => {
  const Icon = icon === 'Github' ? Github : icon === 'Linkedin' ? Linkedin : Mail;
  return (
    <a href={url} className="text-gray-600 hover:text-blue-600 mx-2 transition-transform duration-300 hover:scale-110" aria-label={name}>
      <Icon size={24} />
    </a>
  );
};

const Portfolio = () => {
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <FadeIn>
        <header className="py-8 text-center">
          <img
            src={profileImage}
            alt="Ask Hallem-Berg"
            className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg animate-fade-in"
          />
          <h1 className="text-3xl font-bold mb-2">{personalInfo.name}</h1>
          <p className="text-xl text-gray-600 mb-4">{personalInfo.title}</p>
          <div className="flex justify-center">
            {socialLinks.map((link, index) => (
              <SocialLink key={index} {...link} />
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
            {experiences.map((exp, index) => (
              <ExperienceItem key={index} {...exp} />
            ))}
          </section>
        </FadeIn>

        <FadeIn delay={900}>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Education</h2>
            {education.map((edu, index) => (
              <EducationItem key={index} {...edu} />
            ))}
          </section>
        </FadeIn>
      </main>
    </div>
  );
};

export default Portfolio;