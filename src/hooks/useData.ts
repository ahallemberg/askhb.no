import { useQuery } from '@tanstack/react-query'
import { 
    R2_PERSONAL_INFO_ENDPOINT, 
    R2_EXPERIENCES_ENDPOINT, 
    R2_EDUCATION_ENDPOINT, 
} from '../constants/app'

import { 
    type PersonalInfo, 
    type ExperienceItemProps, 
    type EducationItemProps, 
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


export const useAllPortfolioData = () => {
    const personalInfo = usePersonalInfo()
    const experiences = useExperiences()
    const education = useEducation()
    
    return {
        personalInfo,
        experiences,
        education,
        isLoading: personalInfo.isLoading || experiences.isLoading || education.isLoading,
        isError: personalInfo.isError || experiences.isError || education.isError,
        error: personalInfo.error || experiences.error || education.error
    }
}