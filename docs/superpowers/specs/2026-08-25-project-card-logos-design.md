# Project card logos

**Date:** 2026-08-25
**Status:** approved, ready for an implementation plan
**Branch:** `feat/project-card-logos`
**Repos touched:** this one, `admin.askhb.no`, and the R2 bucket
**Companion spec, not yet written:** the same marks on the `pages.askhb.no`
write-up pages, which shares this spec's placement and treatment decisions but
none of its code.

## Problem

Every employer in the Experience section carries a mark. No project does, so the
two halves of the same page identify their entries by two different rules.

The obvious objection is that the mark is already on the card. It is:
`ProjectItem` anchors the screenshot crop to the top left precisely so that the
captured site's own logo survives the crop, and both live shots do carry one.
But the arithmetic settles it. The two projects share a row, so each card is
about 256px wide; the shot frame is the full card width at 16/10, and the
capture is 1280x800, which is the same ratio. `object-cover` therefore draws it
at a scale of 0.2. Veivett's 32px header mark lands at roughly **6px**. Beside
the text it is no better: the frame takes its height from the card instead of a
ratio, so the scale is card-height over 800, still under 10px on a spanning
card.

That is arithmetic from the frame geometry, not a browser measurement, but the
conclusion does not depend on the last pixel: the mark is present and
unreadable at every width the card is rendered at. A dedicated mark is not a
duplicate of it. It is the only legible instance.

## Solution

A mark to the left of the project name, in the ink treatment `LogoMark` already
applies in the Experience section, driven by two new optional fields on the
project entry.

A project without a logo looks exactly as it does today. `LogoMark` renders
nothing at all rather than a reserved empty box when it has no url, which is the
behaviour its own comment defends, so the only difference on such a card is the
flex wrapper the name now sits in, which changes no pixel.

### Data contract

`projects.json` entries gain two optional fields:

| Field | Type | Meaning |
|---|---|---|
| `logoUrl` | `string` | Where the mark lives in the bucket. Absent means no mark. |
| `logoScale` | `number` | Optical size correction, default 1. Marks differ in ink coverage, so identical boxes do not give identical visual weight. |

The names, types and optionality are lifted verbatim from `OrganisationProps`
rather than chosen afresh. That is the point of them: `LogoMark` takes `url` and
`scale`, so reusing the field names is what lets the component be used
unchanged instead of parameterised, and it means the bucket describes a logo the
same way wherever a logo appears. Both fields are added to `ProjectItemProps`
here and to `ProjectItem` in `admin.askhb.no`, which is the same contract seen
from the writing side.

### Rendering

`ProjectItem` puts the mark and the `h3` in a flex row. The mark sits **outside**
the anchor, not inside it: it is decorative and carries an empty alt, while the
heading may be the element holding the card's stretched link, and an image
inside that anchor would add a second reading of a name the link already has.

The fields are read defensively, by type rather than by truthiness. This is not
belt-and-braces. `useProjects` casts the response straight through
`fetchJsonDataOrDefault` with no normaliser, unlike experiences, which go
through `normaliseExperiences` field by field. So a project's `logoUrl` reaches
the component exactly as the bucket spelled it, and `LogoMark` calls `.split` on
it the moment it is truthy: a value saved as a number would throw, and because
`Portfolio` gates every section on one `isError` and there is no ErrorBoundary,
that throw costs the whole page rather than the card. `logoScale` is milder — a
wrong type lands in a transform and renders as a dead declaration — but it is
coerced the same way for consistency. `ProjectItem` already defends `name`,
`skills` and `url` field by field; this follows that pattern rather than
introducing a normaliser for one field.

**One detail left to the browser rather than settled here.** `LogoMark`'s box is
a fixed 32px, tuned against the Experience section's larger serif heading. The
project name is `text-lg` on a 256px card. Reuse the component unchanged first
and look at it; only if it reads heavy should `LogoMark` gain an optional size
with the current value as its default, so the Experience section is untouched
either way. Adding the prop speculatively would be new API surface bought
against a guess.

### admin.askhb.no

Close to a copy of what `OrganisationDialog` already does.

- `ProjectDialog` gains an `ImageUploadField` — label `Logo (optional)`,
  `dir={LOGO_DIR}`, `owner={fields.name}`, `ownerLabel="project name"` — and the
  same logo-scale number input beside it, bounds included.
- `ProjectPreview` renders `LogoMark` the way `OrganisationPreview` does, so the
  dialog shows what the card will show.
- The project type in `src/types/props.ts` gains the same two fields.

Projects share `LOGO_DIR` with organisations rather than taking a directory of
their own. The uploader already keys each mark under a slug plus a random
suffix, so two owners cannot collide even if they were named the same, and a
second constant would only add a place for the two to drift apart.

### The two marks themselves

**Trafikkskiltene** ships `logo.svg` at the site root: the road-sign badge, 220
by 257, black and orange line art on transparent. That is exactly the case the
ink filter was tuned for — two tonal bands over opaque pixels, nothing knocked
out — so it uploads as it is.

**Veivett's `favicon.svg` cannot be uploaded as it is.** It draws the V on a
solid indigo `rect`, with the letterform knocked out in white on top. That is
the same class of art as Q-Free's mark, and it fails the same way: greyscale
takes the indigo to mid grey and leaves the white knockout white, so on cream
paper the mark reads as a grey chip rather than a letter, and in dark mode the
inversion swaps which half disappears.

The fix is content, not code. Delete the `rect` and the mark underneath is
already a road: a navy outline, a white surface and a dashed centre line, which
is what the site's own `og:image` alt text describes. Those three bands survive
the filter in both themes, because they are bands over transparency rather than
a knockout through a field. So Veivett needs a tile-free export uploaded through
admin, and then it is an ordinary raster case with no component and no special
handling anywhere in the code.

## Rejected

**A badge over the screenshot's corner**, app-store style. It identifies well
and costs the text block nothing, but it is a visual device the page uses
nowhere else, and the rule this spec wants is the one already in force in
Experience: a mark sits to the left of the thing it names.

**Brand colour instead of ink.** One mark per card means the reason Experience
desaturates — four saturated palettes stacked against warm paper reading as four
guest appearances — does not apply, so this was a real option and was mocked up
against all six marks in both themes. It loses on two counts. It is not additive:
Experience is on ink today and tuned per tonal band and per theme, so brand
colour means changing shipped, deliberately measured work rather than only
adding to it. And it has no answer for a mark drawn in black on a transparent
ground, which sits on near-black paper as itself; Ascend's mark is that mark.

**Leaving it to the screenshot.** Addressed under Problem above. Six pixels.

## Not in this spec

The write-up page marks on `pages.askhb.no`, and with them the port of
`QFreeMark` into the Quartz tree. That work shares this spec's placement and
treatment decisions and none of its code, it lives in a different repo behind a
different deploy chain, and neither piece blocks the other.

Also out: any change to how the Experience section renders its marks, and any
new field beyond the two named above.

## Verification

There is no test framework in either repo, and this spec does not invent one.

1. `npm run build` in this repo and in `admin.askhb.no`. The type check is the
   real gate, not the lint: `noUnusedLocals` and `noUnusedParameters` mean a
   stray import fails the build outright.
2. `npm run dev`, then read both cards in light and dark, at the width where two
   share a row and at the width where one spans. That is where the 32px question
   above gets its answer.
3. In admin, set a logo on a project, confirm the preview matches the card, and
   confirm a project with no logo still renders with no gap where the mark would
   be.
4. Confirm the tile-free Veivett mark survives the filter in both themes before
   it is the version stored in the bucket.
