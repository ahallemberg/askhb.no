import { useQuery } from '@tanstack/react-query'

import {
    type PersonalInfo,
    type OrganisationProps,
    type ProjectItemProps,
    type EducationItemProps,
} from '../types/props'

import {
    QUERY_KEYS,
    fetchPersonalInfo,
    fetchExperiences,
    fetchProjects,
    fetchEducation,
} from '../func/portfolioData'

export const usePersonalInfo = () => {
    return useQuery<PersonalInfo>({
        queryKey: QUERY_KEYS.personalInfo,
        queryFn: fetchPersonalInfo,
    })
}

export const useExperiences = () => {
    return useQuery<OrganisationProps[]>({
        queryKey: QUERY_KEYS.experiences,
        queryFn: fetchExperiences,
    })
}

export const useProjects = () => {
    return useQuery<ProjectItemProps[]>({
        queryKey: QUERY_KEYS.projects,
        queryFn: fetchProjects,
    })
}

export const useEducation = () => {
    return useQuery<EducationItemProps[]>({
        queryKey: QUERY_KEYS.education,
        queryFn: fetchEducation,
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
        /*
         * isPending, not isLoading. React Query derives `isLoading` as
         * `isPending && isFetching`, so a query that is pending but *paused* --
         * status 'pending', fetchStatus 'paused', which the default
         * networkMode: 'online' produces the moment the browser goes offline --
         * reports isLoading false while isError is also still false. Portfolio
         * gates on both, so the page fell through each guard and rendered a
         * nameless hero over empty ruled sections.
         *
         * isPending is true for the whole of that window, so a paused query
         * holds the loading state instead. Nothing else moves: none of these
         * queries is disabled or seeded with initialData, so isPending only
         * ever means "no data yet", and retries and refetches are untouched.
         */
        isLoading: personalInfo.isPending || experiences.isPending || education.isPending || projects.isPending,
        isError: personalInfo.isError || experiences.isError || education.isError || projects.isError,
        error: personalInfo.error || experiences.error || education.error || projects.error
    }
}
