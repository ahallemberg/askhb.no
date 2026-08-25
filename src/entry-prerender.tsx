import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider, dehydrate, type DehydratedState } from '@tanstack/react-query'
import { StaticRouter } from 'react-router'

import App from './App'
import {
    QUERY_KEYS,
    fetchPersonalInfo,
    fetchExperiences,
    fetchProjects,
    fetchEducation,
} from './func/portfolioData'
import { R2_PROFILE_PICTURE } from './constants/app'
import socialLinks from './config/sociallinks.json'

export interface PrerenderResult {
    html: string;
    dehydratedState: DehydratedState;
    jsonLd: Record<string, unknown>;
}

/*
 * fetchQuery, not prefetchQuery: prefetchQuery swallows errors by design, and
 * a failed fetch here has to fail the build rather than prerender an empty
 * shell. Retries mirror the client's three attempts.
 */
export const render = async (): Promise<PrerenderResult> => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: 3 } },
    })

    const [personalInfo] = await Promise.all([
        queryClient.fetchQuery({ queryKey: QUERY_KEYS.personalInfo, queryFn: fetchPersonalInfo }),
        queryClient.fetchQuery({ queryKey: QUERY_KEYS.experiences, queryFn: fetchExperiences }),
        queryClient.fetchQuery({ queryKey: QUERY_KEYS.projects, queryFn: fetchProjects }),
        queryClient.fetchQuery({ queryKey: QUERY_KEYS.education, queryFn: fetchEducation }),
    ])

    const html = renderToString(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <StaticRouter location="/">
                    <App />
                </StaticRouter>
            </QueryClientProvider>
        </StrictMode>,
    )

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: personalInfo.name,
        jobTitle: personalInfo.title,
        url: 'https://www.askhb.no/',
        image: personalInfo.profilePictureUrl ?? R2_PROFILE_PICTURE,
        affiliation: {
            '@type': 'CollegeOrUniversity',
            name: 'Norwegian University of Science and Technology',
        },
        // Only real profiles; mailto: and tel: entries are on the page itself.
        sameAs: socialLinks
            .map((link) => link.url)
            .filter((url) => url.startsWith('https://')),
    }

    return { html, dehydratedState: dehydrate(queryClient), jsonLd }
}
