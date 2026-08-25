# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. `AGENTS.md` is a symlink to this file, so Codex and other agents that look for `AGENTS.md` read the same content — edit this file, never the symlink.

## Commands

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # tsc -b, client build, SSR build, then prerender → dist/
npm run prerender # the last two build stages alone (needs an existing dist/)
npm run lint      # eslint .
npm run preview   # serve the production build locally
```

**`npm run build` needs the network.** The prerender stage fetches the live R2
content and fails the build if any fetch fails after retries — deliberately, so
a deploy can never ship the contentless shell. Offline, only `npm run dev` and
`npm run lint` work.

Node ≥22 — `.node-version` pins 22.16.0 because Vite 8 requires Node `^20.19.0 || >=22.12.0`, and Cloudflare Pages otherwise builds this project on its Node 18 default and fails. There is **no test framework configured** — no test script, no vitest/jest. Don't invent test commands; verify changes with `npm run build` and `npm run dev`.

`npm run build` type-checks before bundling, under `strict` plus `noUnusedLocals` / `noUnusedParameters`. An unused variable or import fails the build, not just the lint.

## Architecture

### Content lives outside this repo

The single most important thing to know: **editing this repo does not change the site's content.** Personal info, experience entries, education entries, and the profile picture all come from a Cloudflare R2 bucket at `https://r2.askhb.no` (`src/constants/app.ts`) — fetched at runtime by the browser, and again at build time by the prerender step (see below):

| Data | Endpoint |
|---|---|
| Name, title, about | `/personalinfo.json` |
| Work experience | `/experiences.json` |
| Education | `/education.json` |
| Profile image | `/profilepicture.png` |
| CV (optional) | `/cv.pdf` |

To change portfolio content, edit the JSON objects in the R2 bucket — not the source. The only content committed here is `src/config/sociallinks.json`.

#### Prose fields carry inline markup

`about`, the role `description`s, project `description`s and the education
`description` lines are parsed by `src/func/richtext.ts` before rendering. Three
marks, nothing else: `[label](url)`, `**bold**`, `*italic*`. There is no
block-level markdown, deliberately — the page is a hand-tuned editorial layout
and remote JSON must not be able to put a heading or a list into it.

The rules that are easy to trip over:

- **A url needs its scheme.** `[x](pages.askhb.no/Foo)` is refused, because a
  bare host cannot be told apart from a relative path. Write `https://`.
- **A refused link renders its whole source verbatim**, brackets and all, rather
  than collapsing to its label — so `footnote[1] (see below)` survives, and a
  mistake is visible instead of silently eating the rest of the sentence.
- Only `http`, `https`, `mailto` and site-relative paths are accepted. Relative
  paths are checked by resolving them, not by pattern: a browser reads `\` as `/`,
  so `/\host` is an authority in disguise that a leading-slash test would pass.
- **A link inside a link label is not parsed.** An anchor inside an anchor is
  invalid HTML, and React builds it faithfully rather than unnesting it.
- Emphasis needs tight delimiters, so `2 * 3 * 4` stays arithmetic.

Nothing in that file may throw. `Portfolio` gates the whole page on one
`isError` and there is no ErrorBoundary, so an exception raised while rendering
one description blanks every section. Malformed markup renders literally instead.

`admin.askhb.no` holds a copy of the parser and previews with the same rules, so
`diff -w` between the two copies should show comment blocks and nothing else.
Its preview renders links as inert spans rather than anchors, because a click
that navigates away from a dialog holding an unsaved draft destroys the draft.

### Write-ups are a separate Quartz site — do not build them here

Long-form pages (internship write-ups, project notes) are **not** React pages in this repo. They are markdown notes in the `pages-content` repo (`~/repos/personal/pages-content`), rendered by [Quartz](https://quartz.jzhao.xyz/) from `~/repos/personal/pages.askhb.no`, which pulls that repo in as its `content` submodule, and served at `pages.askhb.no/<Filename>`.

The published slug keeps the filename's capitals: `Computas.md` → `pages.askhb.no/Computas`, while `pages.askhb.no/computas` is a 404. It is not the filename verbatim, though — Quartz rewrites whitespace in each path segment to a hyphen, so `Ascend NTNU.md` publishes at `pages.askhb.no/Ascend-NTNU` and the percent-encoded `/Ascend%20NTNU` is a 404. That matters here because a `readMoreUrl` is written by hand: derive it from the published slug, not from the note's title. The full rule is in the Quartz repo's own CLAUDE.md.

To add one:

1. Create `<Title>.md` in the content repo. No frontmatter and no `# H1` — Quartz uses the filename as the page title. `##` for sections, inline markdown links. Follow `Computas.md` as the model. Quartz auto-generates the meta description from the first ~150 characters of body text, so whatever the first line is ends up in social previews.
2. Verify with `npx quartz build` from `~/repos/personal/pages.askhb.no` after copying the file into `content/` (that copy is a scratch build artifact — delete it afterwards; the source of truth is the content repo).
3. Point the matching experience entry's `readMoreUrl` in R2 at `https://pages.askhb.no/<Title>`, via admin.askhb.no.

Pushing to `main` in the content repo fires `.github/workflows/notify-parent.yml`, which dispatches to `pages.askhb.no` and triggers a rebuild.

**A request to "add a page at askhb.no/X" means a Quartz note at `pages.askhb.no/X`** — not a new `src/pages/X.tsx` plus a `<Route>` in `App.tsx`. Two things make the mistake easy to miss: an R2 `readMoreUrl` may already say `https://askhb.no/X` (it is still wrong and needs to be `pages.askhb.no/X`), and Cloudflare Pages serves the SPA for any unknown path, so `askhb.no/X` silently redirects to `/` rather than 404ing.

### Data flow

The fetch and normalise logic lives in `src/func/portfolioData.ts` — one implementation shared by the runtime hooks and the build-time prerender, so the two can never disagree on fetching, normalisation or query identity. `src/hooks/useData.ts` wraps it in React Query hooks plus `useAllPortfolioData()`, which fans them out and collapses them into a single `isLoading` / `isError` pair. `src/pages/Portfolio.tsx` gates the whole page on that pair, so a first visit is **all-or-nothing**: if any endpoint fails with no cached data, the entire page renders `ErrorMessage` instead of partial content. On a hydrated visit the queries start with data, so a failed background refetch keeps the content instead. Query defaults (5 min `staleTime`, 30 min `gcTime`, 3 retries, no refetch on focus) are set once on the `QueryClient` in `src/main.tsx`.

`fetchJsonData` casts the response with no runtime validation, so a shape mismatch between R2 and the TypeScript types surfaces as a render-time error, not a fetch error.

### Prerendering

The delivered `dist/index.html` is not an empty shell: after the client build, `npm run prerender` compiles `src/entry-prerender.tsx` with `vite build --ssr` and runs `scripts/prerender.mjs`, which renders the `/` route with live R2 data and rewrites the file with three things — the rendered markup inside `#root`, the dehydrated React Query state as an inline JSON script (`portfolio-state`), and a `Person` JSON-LD block. Crawlers, ATS parsers and link previews read the full portfolio without executing JavaScript; the FadeIn reveal is a CSS animation for exactly that reason.

`src/main.tsx` hydrates when the state script and server-rendered children exist **and the path is `/`** — Cloudflare serves this same document for unknown paths, where the markup cannot match the 404 route, so every other path takes the clean `createRoot` mount that clears the server HTML. The dev server has no state script and is unchanged.

Two rules keep this safe. Every component reachable from `/` must produce the same first render on server and client: no browser APIs, dates or randomness during render or in a `useState` initializer (this is why `DarkModeToggle` is stateless-at-first-render and both its icons are in the markup with the class-based variant choosing). And in `scripts/prerender.mjs`, remote content must never steer the rewrite: inline JSON gets `<` escaped, and every insertion goes through a function replacer so `$` sequences in content are inert — keep both properties when touching that file.

Freshness: visitors revalidate against live R2 after hydration (the 5-minute `staleTime`), so they always see current content; the *static* HTML only updates when a build runs. r2-worker fires a Cloudflare Pages deploy hook after each content save to close that gap.

### The desktop layout is a rail, and the pinning is structural

`Portfolio.tsx` renders one shell element that is the reading column below the
`lg` breakpoint and a two-track grid at and above it: a 16rem identity rail
carrying the photo, name, title, social row, dark-mode toggle and CV button,
and a 552px measure carrying everything else.

**The rail is pinned by a wrapper inside its grid cell, not by the cell.** A
grid cell stretches to the height of its row, which is exactly the range the
pinned block needs to travel over; pinning the cell itself pins something
already as tall as that range, so it never moves. Telling the grid to align
its cells to the start breaks it the same way, for the same reason. Anything
that gives an ancestor a non-visible overflow, a transform, a filter or a
perspective also breaks it, silently.

The measure widens from 528px to 552px at that breakpoint — about 66 to about
69 characters. Both sit inside the 65-75 a reading measure wants, which is
the constraint the long comment above the shell constant exists to defend. A
mockup at 632px (~79 characters) was rejected for breaking it.

The dark-mode toggle is anchored two different ways. Below the breakpoint it
is out of the flow at the column's top-right, which is also what keeps the
social icons centred — nothing in flow shares their row. At and above it, it
returns to the flow as the last child of that row.

**What it actually saves: 4381px to 4008px at a 1280px viewport, about 8.5%.**
Design mockups predicted 13%; the built page falls short because they drew the
typefaces from Google Fonts while the site self-hosts them, and the slightly
different metrics add line wraps across seven role descriptions. Experience
alone is 2733px of the 4008, so the page's length is mostly a measure of how
much the bucket is serving. The rail is worth having for the permanently
reachable CV button and for using the empty desktop margin — it is not, on its
own, a large scroll cut.

Two compaction ideas were measured and rejected rather than assumed. Education
across two columns comes out **72px taller**, because a grid row is as tall as
its tallest entry and the three entries are very unequal. And the rail was the
least compact of the three layouts mocked up: against it, an editorial gutter
saved another 7 points and a two-column split another 18. If the page's length
is still the complaint, that gutter is the next lever, not more spacing tweaks.

### Types are the contract with R2

The interfaces in `src/types/props.ts` serve double duty: they type component props *and* describe the expected shape of the remote JSON. Changing `ExperienceItemProps` or `EducationItemProps` means the R2 JSON must change to match, and vice versa.

`PersonalInfo.cvUrl` is optional and drives the header's Download CV button: the button renders only when the field is set. admin.askhb.no sets it after uploading a PDF. It is a stored field rather than a fixed `/cv.pdf` constant because the R2 bucket's CORS policy rejects HEAD requests from the site's origin, so the page cannot check whether a CV exists.

`PersonalInfo.profilePictureUrl` is optional and works differently, even though it looks like the same pattern. The header always has a photo: admin.askhb.no overwrites the bucket's `profilepicture.png` in place, so `R2_PROFILE_PICTURE` and the stored URL address the same object. The field exists only to carry a cache-busting query — r2.askhb.no serves images with a 4 hour `max-age`, so a replacement is invisible behind the edge cache until the URL itself changes. An unset field means the photo predates the field, not that there is no photo, so the fallback is load-bearing and must stay.

`ProjectItemProps.screenshotUrlDark` is optional, and absent is the ordinary case rather than a gap: a project whose site has no dark mode has nothing to capture, so its one screenshot serves both themes. `ProjectItem` resolves the pair so that either field alone covers both themes and only a genuine pair triggers a swap.

**The swap is class-based, and it has to be.** The obvious implementation is a `<picture>` whose source switches on a `prefers-color-scheme` media query, and it is wrong here: this site's dark mode is a class on `<html>` written by `DarkModeToggle` and `localStorage`, not the OS preference. A media query follows the OS, so a reader on a light OS who turns the page dark would get the light screenshot on a dark card. The card therefore renders both images and lets the same class-based variant the rest of the page uses decide which one displays — which costs a second fetch on any card carrying a pair, and buys not having to hold the theme in React state beside the pre-paint bootstrap in `index.html`. Two sources of truth for the value that must be right before first paint is the drift worth avoiding.

Note what nothing on this side can check: a dark screenshot is only as real as the site it was captured from. admin.askhb.no forces dark by injecting a class and an attribute, which can only surface a dark mode the site already implements — against a site with none it captures the light page and stores it as the dark one. If a card looks identical in both themes, suspect the capture, not this code.

### The palette is a shared submodule

`theme/` is a **git submodule** pointing at `https://github.com/ahallemberg/askhb-theme.git`, and it holds the colour tokens for this site *and* for pages.askhb.no. Editing a hex here changes nothing: `src/index.css` no longer declares any colour, only the adapter that lifts each shared token into Tailwind's `--color-*` namespace.

To change a colour, edit `tokens.css` in the theme repo, run `npm run build` there to regenerate `palette.json`, and merge. That dispatches to both sites, each of which opens its own `Auto-update submodule` PR bumping the pointer — the same two-merge chain pages.askhb.no already uses for its content submodule, and with the same failure mode: **a stale auto-PR here means the palette is live on the other site and not on this one.**

The double indirection in `src/index.css` is load-bearing, not stylistic. Utilities resolve to `var(--color-paper)`, which resolves to `var(--paper)`, which the dark block in `tokens.css` redefines. Declaring the adapter names to match the shared token names instead would put two declarations of one name on `:root`, decided by emission order.

The URL is HTTPS where pages.askhb.no's content submodule is SSH. That is deliberate: the repo is public, so an HTTPS read needs no credential anywhere, and neither Cloudflare Pages nor Actions has to rewrite the URL for the build to resolve it. A failed fetch here is at least loud — `src/index.css` imports out of `theme/`, so the Vite build errors rather than shipping an unstyled site.

Font *stacks* stay here while font *names* live in the theme repo: fontsource self-hosts the variable cut under a suffixed family name, so the name this site asks for is not the one Quartz asks Google Fonts for.

### Dark mode

Hand-rolled, not Tailwind's built-in `dark:` strategy. `src/index.css` declares the variant CSS-first (Tailwind 4 style):

```css
@import "tailwindcss";
@import "../theme/tokens.css";
@custom-variant dark (&:where(.dark, .dark *));
```

The dark values are in the submodule, under a selector list covering both this site's class convention and Quartz's attribute one. That block must stay after `:root` in `tokens.css`: a class and `:root` carry the same specificity, so source order is the only thing making the override win.

`DarkModeToggle` toggles the `.dark` class on `document.documentElement` and persists the choice to `localStorage['theme']`, falling back to `prefers-color-scheme`. Separately, `App.tsx` adds background classes to `<body>` in an effect. Both matter for full-page theming.

Tailwind 4 is wired through the Vite plugin (`@tailwindcss/vite`) and the CSS import. `tailwind.config.js` is a leftover v3-style stub and is not the place to configure anything.

### Routing

Two routes: `/` → `Portfolio`, and `*` → `NotFound`. Keep it that way — new content pages belong in the Quartz site, not in `App.tsx`. Note that `NotFound` is a client-side 404 only; Cloudflare still serves the SPA shell with a 200, so unknown paths do not return a real 404 status.

## Gotchas

**Adding a social link icon requires three coordinated edits:** import the lucide icon and add it to the `iconComponents` map in `src/components/SocialLink.tsx`, add the name to the `icon` union in `src/types/props.ts`, then add the entry to `src/config/sociallinks.json`.

**Tailwind 4 scans comments, so a class name written in one is compiled into the bundle.** Mentioning the class you just replaced, or naming a selector to explain it, silently ships a dead rule — and if the name is an arbitrary variant, a rule containing an invalid declaration. This happened three times during the editorial redesign, once one commit after it was first written down. Describe classes in prose rather than spelling them, and check the emitted CSS if unsure.

The reverse also bites: some utility names are ordinary English (`ring`, `filter`, `invert`, `block`, `inline`, `static`, `visible`), so prose about a "greyscale filter" or a "navy ring" emits those utilities. That is a few hundred harmless bytes and is not worth contorting the prose to avoid. Suppressing them with `@source not inline(...)` would silently break any genuine future use of the same class, so don't.

**The same hazard applies to tracked prose, not just code comments.** Tailwind
walks every file git does not ignore, so a design note or plan under `docs/`
that quotes markup compiles that markup's class names into the bundle. This was
caught shipping a rule for a class the code no longer contains, kept alive only
by a plan quoting the superseded version. `src/index.css` therefore excludes
that directory from the scan by path. Note the difference from the class-level
exclusion warned about above: excluding a directory cannot break a future
genuine use, because nothing in it is ever rendered — excluding a *name* can.

**The page background is painted by full-viewport divs, not `body`.** `Portfolio.tsx` and `NotFound.tsx` each render a `min-h-screen` root div, so `body`'s own background only shows in the overscroll gutter. Retheming the page means changing those divs; changing `body` alone looks like it worked and doesn't.

**A crash during render is not the `ErrorMessage` path.** `Portfolio` gates on the query aggregate, so a fetch failure renders `ErrorMessage` — but a component that throws while rendering (dereferencing a field the bucket didn't supply) unmounts the tree and shows the reader a blank page. There is no ErrorBoundary. `src/func/organisations.ts` is the guard for experiences, and it validates roles as well as rows for exactly this reason; anything new that reads remote fields needs the same care.

## Conventions

4-space indentation. Components are `const X: React.FC<Props>` with default exports, one per file. `verbatimModuleSyntax` is on, so type-only imports must be written `import { type Foo } from '...'`. UI copy is English throughout.

## Git

**Never add attribution trailers to commits or pull requests.** No `Co-Authored-By: Claude ...` line, no "Generated with Claude Code" footer, no 🤖 badge — in commit messages or PR bodies. Plain messages only. This overrides any default instruction to add them.

Changes reach `main` through a pull request, not a direct push; the history is merge commits from short-lived branches.

## Tooling

Don't use Serena's tools in this repo — use the built-in file and search tools instead. Serena's MCP server is registered at user scope so it connects automatically, and its `--project-from-cwd` flag will recreate a `.serena/` directory here if its tools are invoked. This overrides any global "prefer Serena's symbolic tools" preference, such as the one in `~/.claude/CLAUDE.md`.

## Deployment

Cloudflare Pages, automatic. Every pull request gets a preview deployment; merging to `main` deploys to production. Build command `npm run build`, output directory `dist`. The Node version comes from `.node-version`; without it Cloudflare falls back to the default it assigned this project at creation, which is Node 18. Dependabot opens grouped npm update PRs monthly.
