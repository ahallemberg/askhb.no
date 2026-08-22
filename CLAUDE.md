# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. `AGENTS.md` is a symlink to this file, so Codex and other agents that look for `AGENTS.md` read the same content — edit this file, never the symlink.

## Commands

```bash
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # tsc -b && vite build  → dist/
npm run lint     # eslint .
npm run preview  # serve the production build locally
```

Node ≥22 — `.node-version` pins 22.16.0 because Vite 8 requires Node `^20.19.0 || >=22.12.0`, and Cloudflare Pages otherwise builds this project on its Node 18 default and fails. There is **no test framework configured** — no test script, no vitest/jest. Don't invent test commands; verify changes with `npm run build` and `npm run dev`.

`npm run build` type-checks before bundling, under `strict` plus `noUnusedLocals` / `noUnusedParameters`. An unused variable or import fails the build, not just the lint.

## Architecture

### Content lives outside this repo

The single most important thing to know: **editing this repo does not change the site's content.** Personal info, experience entries, education entries, and the profile picture are all fetched at runtime from a Cloudflare R2 bucket at `https://r2.askhb.no` (`src/constants/app.ts`):

| Data | Endpoint |
|---|---|
| Name, title, about | `/personalinfo.json` |
| Work experience | `/experiences.json` |
| Education | `/education.json` |
| Profile image | `/profilepicture.png` |
| CV (optional) | `/cv.pdf` |

To change portfolio content, edit the JSON objects in the R2 bucket — not the source. The only content committed here is `src/config/sociallinks.json`.

### Write-ups are a separate Quartz site — do not build them here

Long-form pages (internship write-ups, project notes) are **not** React pages in this repo. They are markdown notes in the `obsidian-content` repo (`~/repos/personal/pages-content`), rendered by [Quartz](https://quartz.jzhao.xyz/) from `~/repos/personal/pages.askhb.no`, which pulls that repo in as its `content` submodule, and served at `pages.askhb.no/<Filename>`.

The published slug is the filename verbatim, capitals included: `Computas.md` → `pages.askhb.no/Computas`, while `pages.askhb.no/computas` is a 404.

To add one:

1. Create `<Title>.md` in the content repo. No frontmatter and no `# H1` — Quartz uses the filename as the page title. `##` for sections, inline markdown links. Follow `Computas.md` as the model. Quartz auto-generates the meta description from the first ~150 characters of body text, so whatever the first line is ends up in social previews.
2. Verify with `npx quartz build` from `~/repos/personal/pages.askhb.no` after copying the file into `content/` (that copy is a scratch build artifact — delete it afterwards; the source of truth is the content repo).
3. Point the matching experience entry's `readMoreUrl` in R2 at `https://pages.askhb.no/<Title>`, via admin.askhb.no.

Pushing to `main` in the content repo fires `.github/workflows/notify-parent.yml`, which dispatches to `pages.askhb.no` and triggers a rebuild.

**A request to "add a page at askhb.no/X" means a Quartz note at `pages.askhb.no/X`** — not a new `src/pages/X.tsx` plus a `<Route>` in `App.tsx`. Two things make the mistake easy to miss: an R2 `readMoreUrl` may already say `https://askhb.no/X` (it is still wrong and needs to be `pages.askhb.no/X`), and Cloudflare Pages serves the SPA for any unknown path, so `askhb.no/X` silently redirects to `/` rather than 404ing.

### Data flow

`src/hooks/useData.ts` exposes three React Query hooks (`usePersonalInfo`, `useExperiences`, `useEducation`) plus `useAllPortfolioData()`, which fans out all three and collapses them into a single `isLoading` / `isError` pair. `src/pages/Portfolio.tsx` gates the whole page on that pair, so this is **all-or-nothing**: if any one of the three endpoints fails, the entire page renders `ErrorMessage` instead of partial content. Query defaults (5 min `staleTime`, 30 min `gcTime`, 3 retries, no refetch on focus) are set once on the `QueryClient` in `src/main.tsx`.

`fetchJsonData` casts the response with no runtime validation, so a shape mismatch between R2 and the TypeScript types surfaces as a render-time error, not a fetch error.

### Types are the contract with R2

The interfaces in `src/types/props.ts` serve double duty: they type component props *and* describe the expected shape of the remote JSON. Changing `ExperienceItemProps` or `EducationItemProps` means the R2 JSON must change to match, and vice versa.

`PersonalInfo.cvUrl` is optional and drives the header's Download CV button: the button renders only when the field is set. admin.askhb.no sets it after uploading a PDF. It is a stored field rather than a fixed `/cv.pdf` constant because the R2 bucket's CORS policy rejects HEAD requests from the site's origin, so the page cannot check whether a CV exists.

`PersonalInfo.profilePictureUrl` is optional and works differently, even though it looks like the same pattern. The header always has a photo: admin.askhb.no overwrites the bucket's `profilepicture.png` in place, so `R2_PROFILE_PICTURE` and the stored URL address the same object. The field exists only to carry a cache-busting query — r2.askhb.no serves images with a 4 hour `max-age`, so a replacement is invisible behind the edge cache until the URL itself changes. An unset field means the photo predates the field, not that there is no photo, so the fallback is load-bearing and must stay.

### Dark mode

Hand-rolled, not Tailwind's built-in `dark:` strategy. `src/index.css` declares the variant CSS-first (Tailwind 4 style):

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

`DarkModeToggle` toggles the `.dark` class on `document.documentElement` and persists the choice to `localStorage['theme']`, falling back to `prefers-color-scheme`. Separately, `App.tsx` adds background classes to `<body>` in an effect. Both matter for full-page theming.

Tailwind 4 is wired through the Vite plugin (`@tailwindcss/vite`) and the CSS import. `tailwind.config.js` is a leftover v3-style stub and is not the place to configure anything.

### Routing

Two routes: `/` → `Portfolio`, and `*` → `NotFound`. Keep it that way — new content pages belong in the Quartz site, not in `App.tsx`. Note that `NotFound` is a client-side 404 only; Cloudflare still serves the SPA shell with a 200, so unknown paths do not return a real 404 status.

## Gotchas

**Adding a social link icon requires three coordinated edits:** import the lucide icon and add it to the `iconComponents` map in `src/components/SocialLink.tsx`, add the name to the `icon` union in `src/types/props.ts`, then add the entry to `src/config/sociallinks.json`.

**Tailwind 4 scans comments, so a class name written in one is compiled into the bundle.** Mentioning the class you just replaced, or naming a selector to explain it, silently ships a dead rule — and if the name is an arbitrary variant, a rule containing an invalid declaration. This happened three times during the editorial redesign, once one commit after it was first written down. Describe classes in prose rather than spelling them, and check the emitted CSS if unsure.

The reverse also bites: some utility names are ordinary English (`ring`, `filter`, `invert`, `block`, `inline`, `static`, `visible`), so prose about a "greyscale filter" or a "navy ring" emits those utilities. That is a few hundred harmless bytes and is not worth contorting the prose to avoid. Suppressing them with `@source not inline(...)` would silently break any genuine future use of the same class, so don't.

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
