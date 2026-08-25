# Portfolio Prerendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full portfolio content, dehydrated query state and a Person JSON-LD block inside `dist/index.html`, hydrated on the client, per the approved spec at `docs/superpowers/specs/2026-08-25-prerender-design.md`.

**Architecture:** A shared data module feeds both the runtime hooks and a new SSR entry. After the client build, a Vite SSR build compiles the entry, and a Node runner renders the `/` route with live R2 data and rewrites `dist/index.html`. `main.tsx` hydrates when the embedded state is present and falls back to a clean mount otherwise.

**Tech Stack:** React 19 (`renderToString`, `hydrateRoot`), TanStack Query v5 (`fetchQuery`, `dehydrate`, `HydrationBoundary`), react-router 7 (`StaticRouter`), Vite 8 (`build --ssr`), Node 22.

## Global Constraints

- **No test framework, by policy.** CLAUDE.md: "Don't invent test commands; verify changes with `npm run build` and `npm run dev`." This overrides this plan format's TDD default: every task's verify steps use `npm run build`, `npm run dev`, `npm run preview` and grep on build output. Do not add vitest/jest.
- `npm run build` type-checks under `strict` plus `noUnusedLocals`/`noUnusedParameters`: one unused import fails the build.
- `verbatimModuleSyntax` is on: type-only imports must be written `import { type Foo } from '...'`.
- 4-space indentation. Components are `const X: React.FC<Props>` with default export, one per file.
- **Tailwind scans comments and every tracked file.** Never spell a utility class name in a comment or in any file outside `docs/` (which is excluded from the scan). Describe classes in prose.
- **Never add attribution trailers** to commits or PRs. No Co-Authored-By, no "Generated with" footer.
- Do not use Serena's tools in this repo.
- Work in the worktree `/Users/ahallemberg/repos/personal/askhb.no-wt` on branch `feat/prerender`. All paths below are relative to that worktree root.
- Changes reach `main` via PR, never a direct push.
- The types in `src/types/props.ts` are the R2 contract: do not change them.
- Any dispatched worker runs on Opus or Fable models only (user rule; overrides any cost-tiering guidance).

**Out of scope for this plan:** the Cloudflare Pages deploy hook and the admin.askhb.no PR (spec section 5). That is a separate small plan against the admin repo once this ships.

---

### Task 1: Extract the data layer

**Files:**
- Create: `src/func/portfolioData.ts`
- Modify: `src/hooks/useData.ts` (full rewrite shown below)

**Interfaces:**
- Consumes: `normaliseExperiences` from `src/func/organisations.ts`, endpoint constants from `src/constants/app.ts`, types from `src/types/props.ts` (all existing).
- Produces: `QUERY_KEYS` (object with `personalInfo`, `experiences`, `projects`, `education` readonly key arrays) and `fetchPersonalInfo(): Promise<PersonalInfo>`, `fetchExperiences(): Promise<OrganisationProps[]>`, `fetchProjects(): Promise<ProjectItemProps[]>`, `fetchEducation(): Promise<EducationItemProps[]>`. Tasks 4 and the hooks both rely on these exact names.

- [ ] **Step 1: Create `src/func/portfolioData.ts`**

```ts
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
```

- [ ] **Step 2: Rewrite `src/hooks/useData.ts` to delegate**

Replace the whole file with:

```ts
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
```

Note the `isPending` comment is preserved verbatim: it documents a bug class, not this change.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: passes (type-check and bundle). Then `npm run dev`, open http://localhost:5173, confirm the page loads with content exactly as before.

- [ ] **Step 4: Commit**

```bash
git add src/func/portfolioData.ts src/hooks/useData.ts
git commit -m "Extract portfolio fetching into a shared data module"
```

---

### Task 2: Make FadeIn a CSS animation

Rationale: the current component's first render is at zero opacity and a timer effect reveals it. On a prerendered page with scripts off, that first render is the only render, so the whole portfolio would be invisible. A CSS animation with a `both` fill produces identical markup on server and client and completes without JavaScript.

**Files:**
- Modify: `src/index.css` (append at end of file)
- Modify: `src/components/FadeIn.tsx` (full rewrite shown below)

**Interfaces:**
- Consumes: `FadeInProps` (`children: ReactNode; delay?: number`) from `src/types/props.ts`, unchanged.
- Produces: the same `<FadeIn delay={n}>` component API; no caller changes.

- [ ] **Step 1: Append the animation to `src/index.css`**

Add at the end of the file:

```css
/*
 * FadeIn's entrance, as a CSS animation instead of React state. The state
 * version rendered its first frame fully transparent and revealed it from a
 * timer, which a prerendered page with scripts off would keep forever. An
 * animation with a `both` fill starts hidden, ends visible, needs no script,
 * and gives the server and the client identical markup.
 */
@keyframes portfolio-fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.fade-in-block {
    animation: portfolio-fade-in 1000ms ease-out both;
}
```

- [ ] **Step 2: Rewrite `src/components/FadeIn.tsx`**

```tsx
import { type FadeInProps } from '../types/props';

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0 }) => {
    return (
        <div className="fade-in-block" style={{ animationDelay: `${delay}ms` }}>
            {children}
        </div>
    );
};

export default FadeIn;
```

- [ ] **Step 3: Verify**

Run: `npm run dev`, reload http://localhost:5173.
Expected: sections still fade in with their staggered delays; nothing stays invisible.
Run: `npm run build`
Expected: passes (the removed hooks imports would otherwise trip `noUnusedLocals`).

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/components/FadeIn.tsx
git commit -m "Drive FadeIn with a CSS animation so prerendered content shows without scripts"
```

---

### Task 3: Make DarkModeToggle stateless

Rationale: the current initializer reads storage and media queries, so the server's first render (moon icon) differs from a dark-mode visitor's first client render (sun icon): a hydration mismatch. Rendering both icons and letting the existing class-based dark variant choose removes the state entirely; the bootstrap script in `index.html` remains the single owner of the initial theme.

**Files:**
- Modify: `src/components/DarkModeToggle.tsx` (full rewrite shown below)

**Interfaces:**
- Consumes: nothing new.
- Produces: same `<DarkModeToggle />` API; no caller changes.

- [ ] **Step 1: Rewrite `src/components/DarkModeToggle.tsx`**

```tsx
import React from 'react';

/*
 * Stateless on purpose. The bootstrap script in index.html has already put the
 * theme class on <html> before first paint, and that class stays the single
 * source of truth: both icons are always in the markup and the same
 * class-based variant the rest of the page uses decides which one shows.
 * Holding the theme in React state instead gives this component a different
 * first render on the server (no storage, no media queries) than in the
 * browser, which is a hydration mismatch on a prerendered page.
 */
const DarkModeToggle: React.FC = () => {
    const toggleDarkMode = () => {
        const nowDark = document.documentElement.classList.toggle('dark');

        try {
            localStorage.setItem('theme', nowDark ? 'dark' : 'light');
        } catch {
            // Storage unavailable: the choice still applies to this page view,
            // it just cannot outlive it.
        }
    };

    return (
        <button
            onClick={toggleDarkMode}
            /*
             * Deliberately not the accent hover the social links take: this
             * sits in the same header corner as them, and two accent hovers a
             * few pixels apart would read as one control. It wakes to full ink
             * on a rule-faint plate instead -- 14.33:1 (light) / 13.34:1
             * (dark) on that plate, up from 4.61:1 / 4.80:1 at rest, both of
             * which clear the 3:1 WCAG 1.4.11 asks of an icon either way.
             */
            className="text-ink-faint hover:text-ink hover:bg-rule-faint focus-visible:outline-accent rounded-[2px] p-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Toggle dark mode"
        >
            {/* Sun: visible only when the page is dark. */}
            <svg
                className="hidden h-6 w-6 dark:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
            {/* Moon: visible only when the page is light. */}
            <svg
                className="h-6 w-6 dark:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
            </svg>
        </button>
    );
};

export default DarkModeToggle;
```

- [ ] **Step 2: Verify**

Run: `npm run dev`, open http://localhost:5173.
Expected: the toggle flips the theme instantly, the icon matches the theme, the choice survives a reload (bootstrap script picks it up), and toggling twice returns to the start. Check both starting themes by toggling and reloading.
Run: `npm run build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/DarkModeToggle.tsx
git commit -m "Make DarkModeToggle stateless so its markup is hydration-safe"
```

---

### Task 4: Prerender entry, runner and build wiring

**Files:**
- Create: `src/entry-prerender.tsx`
- Create: `scripts/prerender.mjs`
- Modify: `package.json` (scripts block only)

**Interfaces:**
- Consumes: `QUERY_KEYS` and the four fetch functions from `src/func/portfolioData.ts` (Task 1), `R2_PROFILE_PICTURE` from `src/constants/app.ts`, `src/config/sociallinks.json`.
- Produces: `render(): Promise<PrerenderResult>` where `PrerenderResult = { html: string; dehydratedState: DehydratedState; jsonLd: Record<string, unknown> }`, exported from the SSR bundle at `dist-ssr/entry-prerender.js`; and in `dist/index.html`: prerendered markup inside `#root`, an inline `<script id="portfolio-state" type="application/json">` element (Task 5 reads this exact id), and a JSON-LD script in `<head>`.

- [ ] **Step 1: Create `src/entry-prerender.tsx`**

```tsx
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
```

If TypeScript cannot resolve `StaticRouter` from `'react-router'`, import it from `'react-router-dom/server'` instead; react-router-dom 7 re-exports the same component. Use whichever of the two resolves, and only one.

- [ ] **Step 2: Create `scripts/prerender.mjs`**

```js
import { readFile, writeFile, rm } from 'node:fs/promises'

/*
 * Runs after the client build and the SSR build. Imports the server bundle,
 * renders the portfolio with live R2 data, and rewrites dist/index.html so the
 * delivered page carries the content, the dehydrated query state and the
 * JSON-LD block. Any failure exits non-zero: failing the deploy is better than
 * shipping the empty shell this project exists to remove.
 */
const INDEX_PATH = new URL('../dist/index.html', import.meta.url)
const SSR_OUT_DIR = new URL('../dist-ssr/', import.meta.url)
const SSR_BUNDLE = new URL('../dist-ssr/entry-prerender.js', import.meta.url)

// JSON destined for inline script elements: escape `<` so no payload can
// terminate the element early.
const inlineJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')

const { render } = await import(SSR_BUNDLE.href)
const { html, dehydratedState, jsonLd } = await render()

if (!html.includes(String(jsonLd.name))) {
    throw new Error('Prerendered markup does not contain the owner name -- it likely rendered the loading screen instead of content')
}

let indexHtml = await readFile(INDEX_PATH, 'utf8')

const rootMarker = '<div id="root"></div>'
if (!indexHtml.includes(rootMarker)) {
    throw new Error('dist/index.html has no empty root element to fill -- did the client build output change?')
}

indexHtml = indexHtml.replace(rootMarker, `<div id="root">${html}</div>`)

const jsonLdScript = `<script type="application/ld+json">${inlineJson(jsonLd)}</script>`
indexHtml = indexHtml.replace('</head>', `${jsonLdScript}\n  </head>`)

const stateScript = `<script id="portfolio-state" type="application/json">${inlineJson(dehydratedState)}</script>`
indexHtml = indexHtml.replace('</body>', `${stateScript}\n  </body>`)

await writeFile(INDEX_PATH, indexHtml)
await rm(SSR_OUT_DIR, { recursive: true, force: true })

console.log(`Prerendered dist/index.html with ${html.length} bytes of markup`)
```

- [ ] **Step 3: Wire the scripts in `package.json`**

Change the scripts block to:

```json
"scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build && npm run prerender",
    "prerender": "vite build --ssr src/entry-prerender.tsx --outDir dist-ssr && node scripts/prerender.mjs",
    "lint": "eslint .",
    "preview": "vite preview"
},
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: client build, then SSR build, then the runner's "Prerendered dist/index.html" line; exit 0; no `dist-ssr/` directory left behind.

Run: `grep -c 'Ask Hallem-Berg' dist/index.html && grep -c 'application/ld+json' dist/index.html && grep -c 'portfolio-state' dist/index.html`
Expected: all three counts are 1 or more.

- [ ] **Step 5: Commit**

```bash
git add src/entry-prerender.tsx scripts/prerender.mjs package.json
git commit -m "Prerender the portfolio into dist/index.html after the client build"
```

---

### Task 5: Hydrate in main.tsx

**Files:**
- Modify: `src/main.tsx` (full rewrite shown below)

**Interfaces:**
- Consumes: the `portfolio-state` inline JSON script and prerendered `#root` children from Task 4.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Rewrite `src/main.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify the dev path is unchanged**

Run: `npm run dev`, open http://localhost:5173.
Expected: the page loads exactly as before (createRoot branch; there is no state element in dev).

- [ ] **Step 3: Verify hydration**

Run: `npm run build && npm run preview`, open http://localhost:4173 in a browser with the console open.
Expected: content is visible immediately (no loading flash), and the console shows no hydration mismatch warnings. Toggle dark mode and reload: still no warnings in either theme.

Run: `curl -s http://localhost:4173/ | grep -c 'Ask Hallem-Berg'`
Expected: 1 or more (content is in the HTML, not just the DOM).

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "Hydrate the prerendered portfolio and fall back to a clean mount"
```

---

### Task 6: Hydration-safety audit and acceptance pass

**Files:**
- Possibly modify: any component the audit flags (none expected).

**Interfaces:**
- Consumes: everything above.
- Produces: the shippable branch.

- [ ] **Step 1: Audit render-time browser API use**

Run:

```bash
grep -rn 'window\.\|document\.\|localStorage\|sessionStorage\|matchMedia\|Math\.random\|Date\.now\|new Date(' src --include='*.tsx' --include='*.ts' | grep -v 'src/main.tsx\|src/entry-prerender.tsx'
```

Review every hit against one rule: browser APIs may run in event handlers and effects, never during render or in a `useState` initializer, for any component reachable from the `/` route. Expected result after Tasks 2 and 3: the only hits are inside event handlers (DarkModeToggle's click handler) or in files not rendered at `/` (for example the 404 page). If a genuine render-time hit appears, move the access into an effect or an event handler in the same style as Task 3, and include it in this task's commit.

- [ ] **Step 2: Lint and full build**

Run: `npm run lint && npm run build`
Expected: both pass.

- [ ] **Step 3: Acceptance checks (spec section 6)**

1. `grep -c 'application/ld+json' dist/index.html` → 1 or more, and the block parses: `node -e "const m=require('fs').readFileSync('dist/index.html','utf8').match(/<script type=\"application\/ld\+json\">(.*?)<\/script>/s); JSON.parse(m[1]); console.log('json-ld ok')"`
2. `npm run preview`, then in the browser disable JavaScript (DevTools, Command Palette, "Disable JavaScript") and reload http://localhost:4173: the full portfolio is visible and readable.
3. Re-enable JavaScript, reload: no flash, no console hydration warnings.

- [ ] **Step 4: Commit any audit fixes, push, open the PR**

```bash
git push -u origin feat/prerender
gh pr create --title "Prerender the portfolio" --body "Implements docs/superpowers/specs/2026-08-25-prerender-design.md: a shared data module, a Vite SSR prerender step that rewrites dist/index.html with rendered content, dehydrated query state and Person JSON-LD, hydration in main.tsx with a clean-mount fallback, and hydration-safe FadeIn and DarkModeToggle. Verified with npm run build, npm run preview with and without JavaScript, and the JSON-LD parse check."
```

Plain PR body, no attribution footer. The Cloudflare Pages preview deployment for the PR is the final check: its HTML should contain the portfolio content before merge.

---

## Post-merge follow-up (separate plan)

Create the Cloudflare Pages deploy hook in the dashboard and add the fire-and-forget call to admin.askhb.no after successful saves, per spec section 5. Needs its own look at the admin repo before writing exact code.
