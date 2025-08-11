import { useQuery } from '@tanstack/react-query'
import { 
    R2_PERSONAL_INFO_ENDPOINT, 
    R2_EXPERIENCES_ENDPOINT, 
    R2_EDUCATION_ENDPOINT, 
    R2_SOCIAL_LINKS_ENDPOINT
} from '../constants/app'

import { 
    type PersonalInfo, 
    type ExperienceItemProps, 
    type EducationItemProps, 
    type SocialLinkItemProps 
} from '../types/props'

const fetchJsonData = async <T>(url: string): Promise<T> => {
    const response = await fetch(url)
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
}

export const usePersonalInfo = () => {
    return useQuery<PersonalInfo>({
        queryKey: ['personalInfo'],
        queryFn: () => fetchJsonData<PersonalInfo>(R2_PERSONAL_INFO_ENDPOINT),
    })
}

export const useExperiences = () => {
    return useQuery<ExperienceItemProps[]>({
        queryKey: ['experiences'],
        queryFn: () => fetchJsonData<ExperienceItemProps[]>(R2_EXPERIENCES_ENDPOINT),
    })
}

export const useEducation = () => {
    return useQuery<EducationItemProps[]>({
        queryKey: ['education'],
        queryFn: () => fetchJsonData<EducationItemProps[]>(R2_EDUCATION_ENDPOINT),
    })
}

export const useSocialLinks = () => {
    return useQuery<SocialLinkItemProps[]>({
        queryKey: ['socialLinks'],
        queryFn: () => fetchJsonData<SocialLinkItemProps[]>(R2_SOCIAL_LINKS_ENDPOINT),
    })
}

export const useAllPortfolioData = () => {
    const personalInfo = usePersonalInfo()
    const experiences = useExperiences()
    const education = useEducation()
    const socialLinks = useSocialLinks()
    
    return {
        personalInfo,
        experiences,
        education,
        socialLinks,
        isLoading: personalInfo.isLoading || experiences.isLoading || education.isLoading || socialLinks.isLoading,
        isError: personalInfo.isError || experiences.isError || education.isError || socialLinks.isError,
        error: personalInfo.error || experiences.error || education.error || socialLinks.error,
    }
}