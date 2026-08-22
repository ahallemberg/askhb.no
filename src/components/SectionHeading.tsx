/*
 * The ruled section label -- small-caps accent over a hairline.
 *
 * Colours come from token utilities (text-accent, border-rule) rather than
 * inline style, so hover/focus variants stay available and the hand-rolled dark
 * mode still drives everything: the utilities compile to var(--color-*), which
 * the .dark block redefines. No `dark:` variant is involved.
 *
 * The rule is decorative. At 1.32:1 against paper it is a whisper on most
 * displays, so the division has to survive without it -- which it does: the
 * accent label at 8.03:1 (light) / 6.82:1 (dark) plus the space beneath is what
 * actually separates the sections.
 */
const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="font-serif text-[11.5px] font-medium uppercase tracking-[0.2em] text-accent border-b border-rule pb-2 mb-6">
        {children}
    </h2>
);

export default SectionHeading;
