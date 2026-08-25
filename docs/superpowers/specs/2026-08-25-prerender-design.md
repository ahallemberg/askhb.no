# Prerendering the portfolio

Date: 2026-08-25. Status: approved design, awaiting implementation plan.

## Problem

The site ships an empty React root and fetches all content from R2 at runtime.
Browsers with JavaScript render it fine, but crawlers, ATS parsers, link
preview services and anything else that does not execute the app receive a page
with meta tags and no body content. The portfolio fails the discoverability
test that the Veivett project page it links to explicitly passes.

## Goals

- The delivered `index.html` contains the full rendered portfolio: about,
  experience, projects, education.
- A `Person` JSON-LD block describes the owner, sourced from the same data the
  page renders.
- Visitors see no regression: no content flash, unchanged dark mode behaviour,
  and data that still revalidates against live R2 after load.
- Content edits made in admin reach the static HTML within minutes, without
  anyone remembering to rebuild.

## Non-goals

- No server-side rendering at request time. The site stays on Cloudflare Pages
  as a static build; this project adds a build-time snapshot, not a server.
- Only `/` is prerendered. The 404 route stays client-side, with the existing
  caveat that Cloudflare serves the shell with a 200 for unknown paths.
- No change to R2 as the source of truth, to admin's write path, or to the
  types in `src/types/props.ts` (the R2 contract).
- The CV PDF and its contents are out of scope.

## Design

### 1. Data layer extraction

The fetch and normalise logic moves from `src/hooks/useData.ts` into a plain
module, `src/func/portfolioData.ts`: one fetch function per endpoint (personal
info, experiences with `normaliseExperiences` applied, projects with the 404
fallback, education) plus shared query-key constants. The hooks delegate to
this module and keep their observable behaviour exactly; the prerender entry
imports the same functions. Build-time and runtime can then never disagree on
fetching or normalisation, because there is only one implementation.

### 2. Prerender entry and runner

A dedicated SSR entry, `src/entry-prerender.tsx`, exports one async function
that:

1. creates a QueryClient and prefetches the four queries via `portfolioData`;
2. renders the app for the `/` route to a string, inside the same
   QueryClientProvider and a static router;
3. returns the markup, the dehydrated query state, and the data needed for
   JSON-LD.

A Node runner script executes after the client build. The entry is compiled
with `vite build --ssr` into a temporary server bundle so TSX and the module
graph work without a second toolchain; the runner imports that bundle, calls
the render function, and rewrites `dist/index.html`:

- the rendered markup replaces the empty `#root` contents;
- the dehydrated state is embedded as an inline JSON script (with `<`
  escaped so content cannot break out of the script element);
- a `Person` JSON-LD script is inserted into `<head>`: name, title, profile
  image, NTNU affiliation, site URL, and `sameAs` links taken from
  `src/config/sociallinks.json`.

The existing static meta tags in `index.html` (title, description, og, canonical)
are already correct and stay as they are. The temporary SSR bundle is deleted
after the rewrite.

### 3. Hydration

`src/main.tsx` branches on the embedded state:

- present, and `#root` has server-rendered children: `hydrateRoot` with a
  `HydrationBoundary` wrapping the app in the dehydrated state;
- absent (the dev server, or a build where prerender was skipped):
  `createRoot` exactly as today.

`npm run dev` is therefore unchanged. Hydrated queries inherit the existing
defaults, so they go stale after five minutes and revalidate against live R2
in the background; user-facing freshness is identical to today. A side effect
that is strictly an improvement: once hydrated data exists, a failed background
refetch keeps the rendered content instead of unmounting into the all-or-nothing
error page, because React Query retains the last successful data.

**Hydration-safety audit (implementation task).** Every component in the `/`
tree must produce the same first render on server and client. The known suspect
is `DarkModeToggle`, whose initial icon state reads browser state; its
initializer needs a `typeof window` guard, defaulting to light on the server
and reading the `<html>` class on the client. The page theme itself is not at
risk: the pre-paint script in `index.html` and the class-based CSS decide it,
and no rendered markup depends on it. The audit must also confirm nothing else
in the tree reads `window`, storage, dates or randomness during render.

### 4. Build pipeline

`npm run build` becomes: type-check, client build, SSR build, prerender rewrite.
Cloudflare Pages needs no configuration change; every deploy, including PR
preview deployments, ships prerendered content. The prerender script retries
each R2 fetch up to three times with backoff, matching the client's retry
count, and if a fetch still fails the build fails. We never ship a contentless shell; this is the same loud-failure
philosophy the theme submodule already follows.

### 5. Freshness chain

A Cloudflare Pages deploy hook for this project is created once in the
dashboard. Its URL is stored as a secret in the admin.askhb.no worker, and
admin fires it after a successful content save, fire-and-forget: a hook
failure must never block or delay a save. That change is a small separate PR
in the admin repo. Multiple rapid saves may trigger multiple builds; Cloudflare
queues them and the last one wins, which is acceptable at this edit frequency.

### 6. Verification

There is no test framework in this repo, by policy. Acceptance is:

1. `npm run build` succeeds and `dist/index.html` contains real experience
   text and a parseable JSON-LD block.
2. `npm run preview` with JavaScript disabled shows the full portfolio.
3. With JavaScript enabled there is no visible flash and no hydration warnings
   in the console.
4. After deploy, fetching `https://www.askhb.no/` without executing scripts
   returns the content in the HTML.
5. An admin edit reaches the deployed HTML within a few minutes via the hook.

## Risks

- **Hydration mismatch** is the main technical risk; the audit in section 3 is
  the mitigation, and React 19's recoverable-error behaviour bounds the damage
  to a console warning plus a client re-render.
- **R2 outage blocks all deploys**, including unrelated code changes, because
  the build fails loud. Accepted: R2 sits behind the same availability as the
  site's own content, and the alternative (silently shipping an empty shell)
  is worse.
- **Tailwind scanning**: the SSR entry and runner are ordinary source files
  scanned by Tailwind; they must not spell utility class names in comments.
  This spec lives under `docs/`, which is already excluded from the scan.

## Sequencing

1. Data layer extraction (pure refactor, independently shippable).
2. Prerender entry, runner, pipeline wiring, hydration switch (one PR).
3. Deploy hook creation and the admin repo PR.
4. Post-deploy verification pass.
