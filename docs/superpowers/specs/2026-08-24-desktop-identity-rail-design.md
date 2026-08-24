# Desktop identity rail

**Date:** 2026-08-24
**Status:** approved, ready for an implementation plan
**Branch:** `feat/desktop-identity-rail`
**Visual reference:** https://claude.ai/code/artifact/a7bb3827-7c88-4b6f-9dee-4e349de7345c (tab "A · Identity rail")

## Problem

The portfolio renders one 36rem column at every viewport width. On a phone that is
correct. On a desktop screen it means two thirds of the width is empty margin while
the page runs several screens long, and the reader pays for it twice:

- The header spends roughly 480px — most of a laptop viewport — on a photo, a name,
  four icons and a button, all of which are scrolled away and unreachable after the
  first flick.
- Every section stacks end to end, so Education and Projects sit behind the whole of
  Experience: five employers, seven roles, each a full paragraph plus a chip list.

Mobile is not part of the problem and must not change.

## Measured outcome

Full page height at a 1280px viewport, measured in headless Chrome against the live
bucket content, not estimated:

| Layout | Height | Screens at 820px | vs. today |
|---|---:|---:|---:|
| Today | 4381px | 5.3 | — |
| **A · identity rail (this spec)** | **3808px** | **4.6** | **−13%** |
| A with two-up Education | 3880px | 4.7 | −11% |
| B · editorial gutter | 3510px | 4.3 | −20% |
| C · split columns | 3022px | 3.7 | −31% |

Two things follow, and both should be read before building.

**A is the least compact of the three options.** It was chosen for the always-visible
CV button and for keeping the single-column editorial reading, and it delivers those.
But if raw scroll reduction is the priority, B and C beat it — B by another 298px, C by
another 786px. A hybrid is available as a later change: the rail from A plus the
employer gutter from B, at a wider shell and an `xl` tier, should land near −24%. It is
deliberately not in this spec.

**Two-up Education is 72px taller, not shorter** — the assumption it was worth doing
is measurably false. See below.

## Solution

At the `lg` breakpoint and above, the header stops being a band across the top and
becomes a sticky left rail. Below `lg` the page keeps exactly the markup and layout it
has today.

Independently of the breakpoint, **Education moves ahead of Projects** in the section
order, at every width.

### Geometry

| | value | note |
|---|---|---|
| Breakpoint | `lg` (1024px) | shell needs 928px + scrollbar; 1024 clears it |
| Shell max width | 58rem (928px) | `max-w-[36rem]` still applies below `lg` |
| Shell padding | 2rem each side at `lg` | `px-6` below |
| Rail column | 16rem (256px) | fixed track |
| Gap | 3.5rem (56px) | |
| Content column | **552px** | 928 − 64 − 256 − 56 |
| Rail sticky offset | 3rem (48px) from top | |

The 552px measure is the one number worth defending. `Portfolio.tsx` carries a long
comment explaining that 36rem was chosen to land the About paragraph near 66
characters, inside the 65–75 a reading measure wants. 552px is the same copy at about
**69 characters** — a real 24px gain over today's 528px, and still inside that range,
so the existing rationale survives and the comment only needs its numbers refreshed.

Widening further was rejected. The first mockup used a 632px column (~79 characters),
which is outside the range the file argues for; the code should not silently break a
constraint it documents.

### Vertical rhythm at `lg`

The narrow column could not afford tighter spacing; the rail layout can.

- Section bottom margin: 4rem → 3.25rem
- Employer bottom margin: 2.5rem → 2rem

Both are `lg:`-only. Mobile spacing is untouched.

### What the rail holds

Profile photo (96px, left-aligned), name, title, the social row, the Download CV
button, and the dark-mode toggle. Everything the current header holds, in the same
order, left-aligned instead of centred.

The CV button being permanently on screen is the functional win, not just a density
one: a recruiter can act on it at any scroll depth instead of scrolling back to the top.

### Rejected: two-up Education

The original mockup folded the three education entries into a two-column grid. It was
measured rather than assumed, and it **makes the page 72px taller, not shorter**
(3880px against 3808px). Two reasons compound:

- A grid row is as tall as its tallest entry, and the three entries are very unequal —
  ETH is one line of description, Verdal is an eight-course elective list.
- At 258px per cell that elective list wraps over several extra lines.

The artifact re-runs this measurement live on tab A. Dropping it also removes two
pieces of incidental complexity that would otherwise have been required: a second
hairline-suppression selector, and a `lg:`-scoped reversal of the GPA rail (which at
258px would have left the degree column about 82px wide).

Education therefore stays a single column at every width, and `EducationItem` needs
**no changes at all**.

## Implementation

### `src/pages/Portfolio.tsx`

This is the only file that must change.

1. **Replace the `COLUMN` constant.** It is currently shared by the header and main.
   It becomes a shell class applied once to a wrapper that contains both, carrying the
   mobile column at its current values and the grid at `lg`. `noUnusedLocals` is on, so
   the old constant must be removed, not merely unused.

2. **Restructure the two top-level blocks into grid cells.** The nesting matters:

   ```
   shell (grid at lg)
   ├── rail cell            ← grid item, stretches to the row height
   │   └── sticky wrapper   ← sticky at lg; this is what travels
   │       └── FadeIn > header
   └── FadeIn > main
   ```

   The sticky element must be a *child* of the stretched grid item, never the item
   itself. A grid item that fills the whole row has no range to travel over, and
   `items-start` would shrink the cell to the rail's own height with the same result.
   This is the single easiest thing to get wrong here.

3. **Header interior gains `lg:` alignment variants**: text left, photo not centred,
   social row not centred.

4. **The dark-mode toggle changes anchoring.** Today it is absolutely positioned
   against the column's right edge. In the rail it joins the social row. Implement by
   keeping it absolutely positioned below `lg` and making it a static flex child at
   `lg`, with the social links wrapped in their own element so the row can space them
   apart. Out of flow at mobile means the links stay centred there, unchanged.

5. **Swap the Education and Projects sections.** Order becomes About, Experience,
   Education, Projects.

### What deliberately does not change

- `EducationItem.tsx` — see the rejected two-up above. Its `[div:last-child>&]` hairline
  suppression keeps working because the wrapper structure around it is unchanged.
- `ProjectItem.tsx` — it sizes itself with container queries, not viewport ones. The
  single project is both last and odd, so it spans both grid cells: 528px today, 552px
  after. Both clear the 448px container breakpoint that switches the card to its
  side-by-side form, so its rendering is identical.
- `FadeIn.tsx` — no new props. The restructure puts plain wrappers where they are
  needed instead.
- `index.css`, `theme/` — no new colours, no new tokens. Both themes already work.
- Everything below `lg`.

## Risks

**Tailwind scans comments.** CLAUDE.md records this biting three times, once a commit
after it was written down. Every comment added in this work must describe classes in
prose rather than spelling them, and the emitted CSS should be checked if unsure.

**Sticky is fragile to ancestors.** `overflow` other than visible, or a `transform`,
`filter` or `perspective` on any ancestor of the sticky wrapper silently breaks it or
re-anchors it. `FadeIn` animates opacity only, which is safe, but it sits inside the
sticky wrapper rather than outside it under this structure — keep it that way.

**No test framework exists.** Verification is `npm run build` (which type-checks under
`strict` plus `noUnusedLocals`/`noUnusedParameters`), `npm run lint`, and looking at
`npm run dev` at several widths — at minimum 390px, 1023px, 1024px and 1440px, in both
themes, with the rail scrolled to confirm it sticks and releases correctly.

## Out of scope

- The Veivett project description in R2 still reads "Dette er en kul nettside" —
  Norwegian placeholder on an otherwise English page. It is a bucket edit via
  admin.askhb.no, not a code change, and does not belong in this branch.
- CLAUDE.md's dark-mode section says `App.tsx` adds background classes to `<body>` in
  an effect. It does not; `index.css` sets the body background directly. Worth
  correcting, but as its own change.
