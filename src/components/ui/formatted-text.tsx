import { parseSegments } from '@/lib/inlineFormat';
import { cn } from '@/lib/utils';

interface FormattedTextProps {
  children: string;
  className?: string;
}

/**
 * Renders text with ***bold italic***, **bold**, *italic*, and ~~strikethrough~~ support.
 * Uses the same parser as the editor (src/lib/inlineFormat.ts), so a description
 * looks the same on the cards as it does while editing. Escaped \* and \~ show
 * as plain * and ~.
 */
export const FormattedText = ({ children, className }: FormattedTextProps) => {
  if (!children) return null;

  // A long word such as a pasted link breaks where it must: otherwise it set the card's minimum
  // width and pushed the page wider than a phone screen (break-words alone doesn't do that inside
  // the grid and flex layouts the cards sit in)
  return (
    <span className={cn('[overflow-wrap:anywhere]', className)}>
      {parseSegments(children).map((seg, k) => {
        let node: React.ReactNode = seg.text;
        if (seg.i) node = <em className="italic">{node}</em>;
        if (seg.b) node = <strong className="font-bold">{node}</strong>;
        if (seg.s) node = <span className="line-through opacity-60">{node}</span>;
        return <span key={k}>{node}</span>;
      })}
    </span>
  );
};
