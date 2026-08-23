import { parseInline, type Segment } from '../func/richtext';

/*
 * Underlined as well as accent-coloured, never colour alone: accent against the
 * body copy it sits in is 1.13:1 in light and 1.27:1 in dark, nowhere near the
 * 3:1 WCAG 1.4.1 asks of a colour-only link cue. The standalone link rows in
 * RoleBlock already underline for that reason, and mid-sentence the case is
 * stronger still -- there is no position or spacing to help.
 *
 * No trailing arrow either. The arrow marks a standalone link row; inside a
 * sentence it reads as punctuation.
 *
 * The focus ring is measured against paper, not against the copy: 8.03:1 in
 * light and 6.82:1 in dark, clear of the 3:1 in 1.4.11.
 */
const LINK_CLASS =
    'text-accent underline decoration-1 underline-offset-2 transition-colors hover:text-ink focus-visible:outline-accent rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2';

const renderSegments = (segments: Segment[]): React.ReactNode =>
    segments.map((segment, index) => {
        switch (segment.kind) {
            case 'text':
                return segment.value;
            case 'strong':
                // Lifted to full ink as well as weighted: the surrounding copy is
                // already the muted tone, so weight alone is a thin signal.
                return (
                    <strong key={index} className="font-semibold text-ink">
                        {renderSegments(segment.children)}
                    </strong>
                );
            case 'em':
                return (
                    <em key={index} className="italic">
                        {renderSegments(segment.children)}
                    </em>
                );
            case 'link':
                return (
                    <a
                        key={index}
                        href={segment.href}
                        // Only an absolute destination leaves the tab. The parser
                        // admits exactly one relative form, and it starts this way.
                        target={segment.href.startsWith('/') ? undefined : '_blank'}
                        rel={segment.href.startsWith('/') ? undefined : 'noreferrer'}
                        className={LINK_CLASS}
                    >
                        {renderSegments(segment.children)}
                    </a>
                );
        }
    });

/*
 * Renders one already-split run of prose. Splitting stays where it was: callers
 * pass a single paragraph or line, and splitParagraphs still decides where those
 * boundaries are.
 */
const RichText: React.FC<{ text?: string }> = ({ text }) => <>{renderSegments(parseInline(text))}</>;

export default RichText;
