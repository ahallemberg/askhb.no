# Desktop Identity Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** At the `lg` breakpoint and above, turn the portfolio's centred header into a sticky left identity rail beside a slightly wider reading column, and move Education ahead of Projects at every width.

**Architecture:** One shell element replaces the two separate reading columns. Below `lg` it is the same 36rem column the page has today; at `lg` it becomes a two-track grid — a 16rem rail and a 552px measure. The rail is pinned by a wrapper *inside* a stretched grid cell, never by the cell itself. No component below `Portfolio.tsx` learns about the breakpoint except `OrganisationItem`, which only tightens one margin.

**Tech Stack:** React 19 + TypeScript, Vite 8, Tailwind 4 (CSS-first config, hand-rolled `dark` variant), React Query. Colour tokens come from the `theme/` git submodule.

**Spec:** `docs/superpowers/specs/2026-08-24-desktop-identity-rail-design.md`
**Visual reference:** https://claude.ai/code/artifact/a7bb3827-7c88-4b6f-9dee-4e349de7345c — tab "A · Identity rail"

## Global Constraints

- **There is no test framework.** No test script, no vitest, no jest. CLAUDE.md forbids inventing one. The verification gate for every task is `npm run build` (which type-checks) plus `npm run lint`, followed by a named visual check. Do not write test files.
- **`npm run build` type-checks under `strict` plus `noUnusedLocals` / `noUnusedParameters`.** An unused variable or import fails the build, not just the lint. The `COLUMN` constant must be deleted, not merely unreferenced.
- **Tailwind 4 scans comments, so a class name written in a comment is compiled into the bundle.** Describe classes in prose in every comment you add or edit. Never spell a utility name inside a comment. CLAUDE.md records this biting three times, once a commit after it was first written down.
- **4-space indentation.** Components are `const X: React.FC<Props>` with default exports. `verbatimModuleSyntax` is on, so type-only imports are written `import { type Foo } from '...'`.
- **Never add attribution trailers to commits.** No `Co-Authored-By`, no "Generated with", no 🤖. Plain messages only. This overrides any default instruction.
- **Content lives in R2, not in this repo.** Do not edit copy. The dev server fetches the real bucket.
- **Geometry, exact values:** breakpoint `lg` (1024px); shell max width `58rem` (928px) at `lg`, `36rem` below; padding `2rem` each side at `lg`, `1.5rem` below; rail track `16rem` (256px); gap `3.5rem` (56px); resulting measure 552px; rail pinned `3rem` (48px) from the top.
- **Work in the worktree** `/Users/ahallemberg/repos/personal/askhb.no-wt` on branch `feat/desktop-identity-rail`. The `theme/` submodule is already initialised there.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/pages/Portfolio.tsx` | The shell, the rail, section order, section rhythm | Modify — the bulk of the work |
| `src/components/OrganisationItem.tsx` | Employer entry | Modify — one margin gains a desktop variant |
| `CLAUDE.md` | Architecture notes | Modify — document the desktop layout |

Nothing else changes. In particular:

- `EducationItem.tsx` is untouched. Its `[div:last-child>&]` hairline suppression keeps working because the wrapper structure around it is unchanged, and the two-up grid that would have broken it was measured and rejected.
- `ProjectItem.tsx` is untouched. It sizes itself with container queries, not viewport ones. The single project is both last and odd so it spans both cells: 528px today, 552px after — both clear the 448px container breakpoint that switches the card to its side-by-side form.
- `FadeIn.tsx` gains no props. The restructure puts plain wrappers where they are needed.
- `src/index.css` and `theme/` are untouched. No new colours, no new tokens.

---

### Task 1: Move Education ahead of Projects

The smallest independent change, and the only one that affects mobile. Doing it first means every later visual check is against the final section order.

**Files:**
- Modify: `src/pages/Portfolio.tsx:160-212`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: section order About → Experience → Education → Projects, with every section carrying its own bottom margin and the last one in the flow suppressing it.

- [ ] **Step 1: Read the current section block**

Open `src/pages/Portfolio.tsx` and locate the four `<FadeIn>`-wrapped `<section>` elements inside `<main>`. Today the order is About, Experience, Projects, Education, and the trailing margin is managed by hand — the first three carry a bottom margin and Education, being last, carries none.

- [ ] **Step 2: Swap the Projects and Education blocks and make the trailing margin self-managing**

Replace the Projects block and the Education block (everything from the `{/*` comment above the Projects guard through the closing `</FadeIn>` of the Education section) with the following, Education first:

```tsx
                <FadeIn delay={sectionDelay}>
                    <section className="mb-16 [div:last-child>&]:mb-0">
                        <SectionHeading>Education</SectionHeading>
                        {/*
                         * The per-item FadeIn is load-bearing here, not just
                         * animation: EducationItem drops its trailing hairline
                         * with an arbitrary variant that matches only when its
                         * wrapping div is the last child of this section, so the
                         * question is asked of this wrapper. Remove it and every
                         * entry keeps its rule.
                         */}
                        {education.data?.map((edu: EducationItemProps, index: number) => (
                            <FadeIn key={index} delay={index * itemStagger}>
                                <EducationItem {...edu} />
                            </FadeIn>
                        ))}
                    </section>
                </FadeIn>

                {/*
                 * projects.json does not exist in the bucket yet and useProjects
                 * turns its 404 into [] rather than an error. A ruled heading over
                 * nothing looks broken, so the whole section waits for content.
                 */}
                {!!projects.data?.length && (
                    <FadeIn delay={sectionDelay}>
                        <section className="mb-16 [div:last-child>&]:mb-0">
                            <SectionHeading>Projects</SectionHeading>
                            {/* Two columns do not survive 375px -- the cells land
                                near 160px -- so the second one starts at sm.

                                A trailing card with no partner spans both cells
                                instead of leaving the rest of its row empty --
                                an odd count, the lone project included, since
                                one card is both the last and an odd one. Half a
                                row of nothing reads as a card that failed to
                                load rather than as the last one there is.

                                Asked for from sm up only: below that the row
                                holds a single cell, and a child asking to cover
                                two would have the second one invented for it,
                                which halves every card on the narrowest screens
                                the layout has. */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                                {projects.data.map((project: ProjectItemProps, index: number) => (
                                    <FadeIn key={index} delay={index * itemStagger}>
                                        <ProjectItem project={project} />
                                    </FadeIn>
                                ))}
                            </div>
                        </section>
                    </FadeIn>
                )}
```

- [ ] **Step 3: Give the About and Experience sections the same self-managing margin**

Change the About section's opening tag from `<section className="mb-16">` to:

```tsx
                    <section className="mb-16 [div:last-child>&]:mb-0">
```

Change the Experience section's opening tag the same way:

```tsx
                        <section className="mb-16 [div:last-child>&]:mb-0">
```

Why this rather than hand-managing which section is last: Projects is conditionally rendered, so with a hand-managed trailing margin an empty bucket would leave Education carrying 64px on top of the main element's own bottom padding. Asking the wrapper `div` whether it is the last child answers the question correctly whichever section actually ends the flow. It is the same idiom `EducationItem` already uses one level down.

- [ ] **Step 4: Verify the build and lint pass**

Run:

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && npm run build && npm run lint
```

Expected: `tsc -b` emits nothing, `vite build` reports built modules and writes `dist/`, eslint emits nothing. Any error here is a real failure — fix before continuing.

- [ ] **Step 5: Verify the order in the browser**

Run `npm run dev` and open http://localhost:5173. Confirm the sections read About, Experience, Education, Projects top to bottom, and that the last Education entry still has no hairline under it while the first two do.

- [ ] **Step 6: Commit**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
git add src/pages/Portfolio.tsx
git commit -m "Put Education ahead of Projects

Also moves the trailing-margin suppression onto every section instead of
hand-managing which one is last: Projects is conditionally rendered, so
an empty bucket previously left Education carrying a bottom margin on top
of the main element's own padding."
```

---

### Task 2: Build the shell grid and pin the rail

The structural change. After this task the desktop layout exists; the rail's interior is still centred and is corrected in Task 3.

**Files:**
- Modify: `src/pages/Portfolio.tsx:23-40` (the `COLUMN` constant) and `:68-129` (the header and main wrappers)

**Interfaces:**
- Consumes: Task 1's section order.
- Produces: a `SHELL` constant replacing `COLUMN`, and a two-cell grid whose first cell holds the header and whose second holds `<main>`.

- [ ] **Step 1: Replace the `COLUMN` constant with `SHELL`**

Replace the entire `COLUMN` comment block and declaration (lines 23–40) with:

```tsx
/*
 * The reading measure, shared by the header and the body so the name, the rules
 * and the prose all sit on one edge.
 *
 * Below the desktop breakpoint this is unchanged: 36rem of box minus the 1.5rem
 * of padding on each side leaves a 33rem text column, which puts the About
 * paragraph at ~66 characters a line -- measured in the browser against the real
 * copy, not estimated. The old cap was 1150px and ~140 characters; 42rem, the
 * value an earlier plan proposed, is ~84 and still well past the 65-75 a reading
 * measure wants.
 *
 * From the desktop breakpoint up the box becomes two tracks rather than one: an
 * identity rail of 16rem and the measure beside it. 58rem of box, less 2rem of
 * padding on each side, less the rail, less the 3.5rem gutter between them,
 * leaves 552px of text -- about 69 characters, so the range above still holds
 * and the page gains 24px of measure instead of sprawling to the viewport.
 *
 * Narrowing the column rather than enlarging the type, because the type sizes are
 * already spent: RoleBlock's nested title is 15px and its standalone title 18px,
 * both sized against a 16px body. Pushing the body to 17-18px would leave the
 * nested role title at or below the size of the prose underneath it -- a
 * hierarchy inversion in the busiest section of the page, to fix a problem that
 * costs nothing to fix here.
 */
const SHELL =
    'mx-auto w-full max-w-[36rem] px-6 ' +
    'lg:grid lg:max-w-[58rem] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14 lg:px-8 lg:pt-12';
```

Note for the implementer: the two string literals are scanned separately by Tailwind, so every utility in both halves is compiled. Splitting the string is purely for line length.

- [ ] **Step 2: Wrap the header and main in the shell**

Replace the opening of the returned tree — from `<div className="bg-paper text-ink min-h-screen font-sans">` down to and including the `<FadeIn delay={headerDelay}>` and `<header ...>` opening tags — so the structure becomes the following. Keep the header's *interior* exactly as it is for now; only the wrappers and the header's own class list change.

```tsx
        <div className="bg-paper text-ink min-h-screen font-sans">
            <div className={SHELL}>
                {/*
                 * The rail's cell. It is left to stretch to the height of the
                 * row, and that is what gives the block inside it somewhere to
                 * travel while pinned. Pinning this element instead would pin
                 * something already as tall as the scroll range, so it would
                 * never move; asking the grid to align its cells to the start
                 * has the same effect for the same reason.
                 */}
                <div>
                    <div className="lg:sticky lg:top-12">
                        <FadeIn delay={headerDelay}>
                            <header className="relative pt-8 pb-14 text-center lg:pt-0 lg:pb-0">
```

- [ ] **Step 3: Close the new wrappers and move `main` into the grid**

The header's closing tags and the `<main>` opening tag become:

```tsx
                            </header>
                        </FadeIn>
                    </div>
                </div>

                <main className="pb-24 lg:pb-20">
```

- [ ] **Step 4: Close the shell**

The end of the tree becomes:

```tsx
                </main>
            </div>
        </div>
    );
```

- [ ] **Step 5: Verify the build and lint pass**

Run:

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && npm run build && npm run lint
```

Expected: clean. If `tsc` reports `'COLUMN' is declared but its value is never read`, the constant was left behind — delete it.

- [ ] **Step 6: Verify the rail pins**

Run `npm run dev`. At a window at least 1100px wide, confirm the photo and name sit in a left column, the prose sits beside them, and **scrolling the page leaves the left column in place** until the footer of the content is reached. At a window narrower than 1024px, confirm the page is byte-for-byte the layout it had before this branch: centred header, single column.

If the rail scrolls away instead of pinning, the cause is almost always one of three things: the grid was told to align its cells to the start, an ancestor gained a non-visible overflow, or the pinning class landed on the grid cell itself rather than on the block inside it.

- [ ] **Step 7: Commit**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
git add src/pages/Portfolio.tsx
git commit -m "Turn the desktop header into a pinned identity rail

At the large breakpoint the single reading column becomes two tracks, a
16rem rail and a 552px measure. The rail is pinned by a wrapper inside a
stretched grid cell rather than by the cell, which would have no range to
travel over. Below the breakpoint the markup resolves to the column the
page already had."
```

---

### Task 3: Align the rail's interior and re-anchor the dark-mode toggle

**Files:**
- Modify: `src/pages/Portfolio.tsx` — the header interior

**Interfaces:**
- Consumes: Task 2's rail wrapper and header element.
- Produces: a left-aligned rail whose social row also carries the dark-mode toggle at desktop.

- [ ] **Step 1: Left-align the header at desktop**

Add the desktop text alignment to the header's class list, so the opening tag reads:

```tsx
                            <header className="relative pt-8 pb-14 text-center lg:pt-0 lg:pb-0 lg:text-left">
```

- [ ] **Step 2: Size and unpin the photo at desktop**

Replace the profile image element with:

```tsx
                                <img
                                    src={personalInfo.data?.profilePictureUrl || R2_PROFILE_PICTURE}
                                    alt="Ask Hallem-Berg"
                                    className="w-26 h-26 md:w-28 md:h-28 mx-auto mb-5 lg:mx-0 lg:h-24 lg:w-24"
                                />
```

Keep the comment block above it untouched — it explains the fallback and is still accurate.

- [ ] **Step 3: Step the name and title down at desktop**

The rail is 256px wide, so the display sizes tuned for a 528px centred column are too large in it. Replace the two lines with:

```tsx
                                <h1 className="font-serif text-4xl font-medium tracking-tight text-ink lg:text-3xl">{personalInfo.data?.name}</h1>
                                <p className="mt-2 text-lg text-ink-faint lg:text-base">{personalInfo.data?.title}</p>
```

- [ ] **Step 4: Move the toggle into the social row**

Delete the standalone toggle block that currently sits at the top of the header — the two-line comment and the `<div className="absolute top-6 right-4">` wrapper around `<DarkModeToggle />`.

Then replace the social links row with:

```tsx
                                <div className="mt-5 flex justify-center lg:mt-6 lg:items-center lg:justify-between">
                                    <div className="flex lg:-ml-2">
                                        {socialLinks.map((link, index: number) => (
                                            <SocialLink key={index} {...link as SocialLinkItemProps} />
                                        ))}
                                    </div>

                                    {/*
                                     * Below the desktop breakpoint this is taken
                                     * out of the flow and pinned to the column's
                                     * right edge, so it lines up with the rules
                                     * underneath it and the links beside it stay
                                     * centred -- nothing in flow shares their
                                     * row. From the breakpoint up it returns to
                                     * the flow and the row pushes it to the
                                     * rail's far edge.
                                     */}
                                    <div className="absolute top-6 right-4 lg:static">
                                        <DarkModeToggle />
                                    </div>
                                </div>
```

The negative left margin on the links wrapper cancels the horizontal margin `SocialLink` puts on each anchor, so the first icon's ink lines up with the name above it rather than sitting 8px inside it. It does nothing at mobile, where the row is centred.

- [ ] **Step 5: Verify the build and lint pass**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && npm run build && npm run lint
```

Expected: clean.

- [ ] **Step 6: Verify both anchorings of the toggle**

Run `npm run dev` and check, in this order:

1. At 1440px wide — photo, name, title and social row all flush to the rail's left edge; the toggle at the right end of the social row; the Download CV button below.
2. At 390px wide — the toggle back in the top-right corner of the page, the social icons still centred under the title, nothing overlapping.
3. Click the toggle at both widths and confirm the whole page, rail included, switches theme.

- [ ] **Step 7: Commit**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
git add src/pages/Portfolio.tsx
git commit -m "Left-align the rail's contents and move the toggle into its social row

The display sizes were tuned for a 528px centred column and are too large
in a 256px rail, so the name and title step down at the breakpoint. The
toggle stays out of the flow at mobile, which is what keeps the social
icons centred there."
```

---

### Task 4: Tighten the vertical rhythm at desktop

**Files:**
- Modify: `src/pages/Portfolio.tsx` — the four section elements
- Modify: `src/components/OrganisationItem.tsx:41`

**Interfaces:**
- Consumes: Task 1's section class lists, Task 2's shell.
- Produces: the final measured geometry — 3808px at a 1280px viewport.

- [ ] **Step 1: Tighten the section spacing**

Add the desktop bottom margin to all four sections, so each opening tag reads:

```tsx
                    <section className="mb-16 lg:mb-13 [div:last-child>&]:mb-0">
```

Apply to About, Experience, Education and Projects alike. 4rem drops to 3.25rem — spacing the narrow column could not afford, because there the sections had nothing but that gap and a hairline separating them, while the rail now carries the page's vertical structure.

- [ ] **Step 2: Tighten the employer spacing**

In `src/components/OrganisationItem.tsx`, change the article's opening tag from:

```tsx
        <article className="mb-10">
```

to:

```tsx
        <article className="mb-10 lg:mb-8">
```

This is the only change this file needs, and it is the only file outside `Portfolio.tsx` that changes at all.

- [ ] **Step 3: Verify the build and lint pass**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && npm run build && npm run lint
```

Expected: clean.

- [ ] **Step 4: Confirm the emitted CSS contains no stray rules**

Tailwind scans comments, and this branch adds several. Check that nothing unintended was compiled:

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
grep -c 'sticky' dist/assets/*.css
```

Expected: a small number. Then read the rules around each hit and confirm each one is a rule the layout actually uses. If a rule appears whose selector matches nothing in the tree, a comment somewhere spells a class name — find it and rewrite that comment in prose.

- [ ] **Step 5: Measure the result against the spec**

The spec's headline number is 3808px at a 1280px viewport. Verify it rather than trusting it. With the dev server running:

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox --window-size=1280,820 \
  --virtual-time-budget=20000 --dump-dom http://localhost:5173 2>/dev/null \
  | grep -c 'identity' || true
```

That only confirms the page rendered. For the height itself, open http://localhost:5173 at exactly 1280px wide and read `document.documentElement.scrollHeight` in the console.

Expected: within about 50px of 3808. A number near 4381 means the desktop branch is not being applied at all; a number near 3880 means an Education grid crept in.

- [ ] **Step 6: Commit**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
git add src/pages/Portfolio.tsx src/components/OrganisationItem.tsx
git commit -m "Tighten section and employer spacing at the desktop breakpoint

The narrow column could not afford this: there the gap and a hairline were
all that separated the sections. With the rail carrying the page's
vertical structure the sections can sit closer together."
```

---

### Task 5: Document the desktop layout

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the finished layout.
- Produces: an architecture note future agents will read before touching this page.

- [ ] **Step 1: Add a subsection to Architecture**

Insert the following immediately after the `### Data flow` subsection in `CLAUDE.md` (before `### Types are the contract with R2`):

```markdown
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

Two compaction ideas were measured and rejected rather than assumed. Education
across two columns comes out **72px taller**, because a grid row is as tall as
its tallest entry and the three entries are very unequal. And the rail itself
is the least compact of the three layouts considered — it saves 13% of page
height where an editorial-gutter treatment saved 20% and a two-column split
saved 31%. It was chosen for the permanently reachable CV button and the
single-column reading, not for the biggest scroll cut.
```

- [ ] **Step 2: Verify the symlink still resolves**

`AGENTS.md` is a symlink to `CLAUDE.md`. Confirm it still reads the edited content:

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && head -3 AGENTS.md && ls -l AGENTS.md
```

Expected: the first lines of `CLAUDE.md`, and a symlink arrow in the listing. Never edit `AGENTS.md` directly.

- [ ] **Step 3: Commit**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
git add CLAUDE.md
git commit -m "Document the desktop rail and the two rejected compaction ideas

The pinning is structural and easy to break by tidying, so the reason a
wrapper sits inside the grid cell is written down. So are the two ideas
that were measured and turned out not to help."
```

---

### Task 6: Final verification and pull request

**Files:** none modified.

- [ ] **Step 1: Full clean build**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && rm -rf dist && npm run build && npm run lint
```

Expected: clean, `dist/` written.

- [ ] **Step 2: Preview the production build**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && npm run preview
```

Walk the four widths in both themes: 390px, 1023px, 1024px, 1440px. At 1023px the page must be identical to `main`; at 1024px the rail must appear. Confirm at each width that the rail pins and releases, the Download CV button works, the last Education entry has no hairline, and the Veivett card renders side-by-side rather than stacked.

- [ ] **Step 3: Confirm the diff is only what was intended**

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt && git diff main --stat
```

Expected: exactly `src/pages/Portfolio.tsx`, `src/components/OrganisationItem.tsx`, `CLAUDE.md`, and the two documents under `docs/superpowers/`. If `theme` appears, the submodule pointer moved — reset it, since this branch must not bump the palette.

- [ ] **Step 4: Push and open the pull request**

Changes reach `main` through a pull request, never a direct push.

```bash
cd /Users/ahallemberg/repos/personal/askhb.no-wt
git push -u origin feat/desktop-identity-rail
gh pr create --title "Give the desktop layout a pinned identity rail" --body "$(cat <<'BODY'
At the large breakpoint the centred header becomes a pinned left rail beside a
slightly wider reading column. Below that breakpoint nothing changes.

Measured at a 1280px viewport against the live bucket content, the page goes
from 4381px to 3808px — 5.3 screens to 4.6.

Education now runs ahead of Projects at every width.

Two ideas were measured and dropped: Education across two columns is 72px
*taller* than one column, because a grid row is as tall as its tallest entry
and the three entries are very unequal. And a 632px measure was rejected for
landing at ~79 characters, outside the range the shell comment exists to
defend; 552px is ~69.

The spec and plan are in `docs/superpowers/`.
BODY
)"
```

- [ ] **Step 5: Check the preview deployment**

Every pull request gets a Cloudflare Pages preview. Open it and repeat the width walk from Step 2 against the deployed build, since that is the one that fetches R2 over the network rather than through the dev server.

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: the geometry and rail structure to Task 2, the rail interior and toggle to Task 3, the vertical rhythm to Task 4, the section swap to Task 1, the documentation to Task 5, and the verification approach to Task 6. The spec's "what deliberately does not change" list is enforced by Task 6 Step 3, which fails if anything else appears in the diff.

**One spec correction.** The spec's Implementation section says `Portfolio.tsx` "is the only file that must change." That is wrong: the employer margin in Task 4 Step 2 lives in `OrganisationItem.tsx`, and the measured 3808px depends on it. The File Structure table above is authoritative.

**Placeholders.** None. Every code step shows the code, every command shows its expected output.

**Type consistency.** The only new identifier is `SHELL`, a `string`, declared in Task 2 Step 1 and referenced in Task 2 Step 2. `COLUMN` is deleted in the same step that introduces `SHELL`, so no task references a name another task removed.

**No tests, deliberately.** This repo has no test framework and CLAUDE.md forbids inventing one, so the TDD cycle the writing-plans skill normally prescribes is replaced by a build-and-lint gate plus a named visual check on every task. Task 4 Step 5 adds an objective numeric check against the spec's measured height so the outcome is verified rather than eyeballed.
