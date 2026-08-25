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

import { normaliseExperiences } from './organisations'

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

/*
 * One implementation shared by the runtime hooks and the build-time prerender,
 * so the two can never disagree on fetching, normalisation or query identity.
 */
export const QUERY_KEYS = {
    personalInfo: ['personalInfo'],
    experiences: ['experiences'],
    projects: ['projects'],
    education: ['education'],
} as const

export const fetchPersonalInfo = (): Promise<PersonalInfo> =>
    fetchJsonData<PersonalInfo>(R2_PERSONAL_INFO_ENDPOINT)

// Normalised here, not in the component, so the cached value is already in one
// shape and consumers never branch.
export const fetchExperiences = async (): Promise<OrganisationProps[]> =>
    normaliseExperiences(await fetchJsonData<unknown>(R2_EXPERIENCES_ENDPOINT))

export const fetchProjects = (): Promise<ProjectItemProps[]> =>
    fetchJsonDataOrDefault<ProjectItemProps[]>(R2_PROJECTS_ENDPOINT, [])

export const fetchEducation = (): Promise<EducationItemProps[]> =>
    fetchJsonData<EducationItemProps[]>(R2_EDUCATION_ENDPOINT)
