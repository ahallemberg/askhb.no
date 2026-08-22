import { useQuery } from '@tanstack/react-query'
import { 
    R2_PERSONAL_INFO_ENDPOINT, 
    R2_EXPERIENCES_ENDPOINT, 
    R2_EDUCATION_ENDPOINT,
    R2_PROJECTS_ENDPOINT,
} from '../constants/app'

import {
    type PersonalInfo,
    type OrganisationProps,
    type ProjectItemProps,
    type EducationItemProps,
} from '../types/props'

import { normaliseExperiences } from '../func/organisations'

const fetchJsonData = async <T>(url: string): Promise<T> => {
    const response = await fetch(url)
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
}

// Returns the fallback only when the object does not exist. Every other failure
// still throws, so a real outage surfaces rather than rendering as "no projects".
const fetchJsonDataOrDefault = async <T>(url: string, fallback: T): Promise<T> => {
    const response = await fetch(url)

    if (response.status === 404) {
        return fallback
    }

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
    return useQuery<OrganisationProps[]>({
        queryKey: ['experiences'],
        // Normalised in the queryFn, not the component, so the cached value is
        // already in one shape and consumers never branch.
        queryFn: async () => normaliseExperiences(await fetchJsonData<unknown>(R2_EXPERIENCES_ENDPOINT)),
    })
}

export const useProjects = () => {
    return useQuery<ProjectItemProps[]>({
        queryKey: ['projects'],
        queryFn: () => fetchJsonDataOrDefault<ProjectItemProps[]>(R2_PROJECTS_ENDPOINT, []),
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
    const projects = useProjects()

    return {
        personalInfo,
        experiences,
        education,
        projects,
        isLoading: personalInfo.isLoading || experiences.isLoading || education.isLoading || projects.isLoading,
        isError: personalInfo.isError || experiences.isError || education.isError || projects.isError,
        error: personalInfo.error || experiences.error || education.error || projects.error
    }
}