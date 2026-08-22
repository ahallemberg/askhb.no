/*
 * R2 stores prose as one string with blank lines in it -- `about` on the personal
 * info object, and the role descriptions the experience entries carry. Rendered in
 * a single <p> each break collapses to a space and the paragraphs run together,
 * so every consumer of a multi-paragraph field splits it the same way here.
 *
 * Shared rather than duplicated because the two call sites have to agree: an
 * author typing a blank line into a role description should get the same result
 * they get in About, not a break that silently disappears in one of the two.
 *
 * Undefined and whitespace-only input give [], which also covers a field missing
 * from a hand-edited file -- fetchJsonData casts without validating.
 */
export const splitParagraphs = (text?: string): string[] =>
    typeof text === 'string' ? text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean) : [];
