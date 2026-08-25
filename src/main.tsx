import '@fontsource-variable/newsreader';
import '@fontsource-variable/inter';
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, HydrationBoundary, type DehydratedState } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
            gcTime: 30 * 60 * 1000, // 30 minutes - cache time (previously cacheTime)
            retry: 3, // Retry failed requests 3 times
            refetchOnWindowFocus: false, // Don't refetch on window focus for portfolio data
            refetchOnReconnect: true, // Refetch when network reconnects
        },
    },
})

/*
 * The build embeds the prerendered query state as an inline JSON script; its
 * presence, together with server-rendered children in the root element, is
 * what selects hydration over a clean mount. The dev server has neither, so
 * `npm run dev` takes the createRoot branch unchanged. A malformed payload
 * falls back to a clean mount rather than a crash: the parse is guarded.
 */
const readDehydratedState = (): DehydratedState | null => {
    const stateElement = document.getElementById('portfolio-state')

    if (!stateElement?.textContent) {
        return null
    }

    try {
        return JSON.parse(stateElement.textContent) as DehydratedState
    } catch {
        return null
    }
}

const rootElement = document.getElementById('root')!
const dehydratedState = readDehydratedState()

const app = (
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={dehydratedState ?? undefined}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </HydrationBoundary>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    </StrictMode>
)

if (dehydratedState && rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app)
} else {
    createRoot(rootElement).render(app)
}
