import { useLayoutEffect, useRef, useState } from 'react';
import { parseChars, toSegments, type StyledChar } from '@/lib/inlineFormat';
import { hangingIndent, lineLead } from '@/lib/lineLead';
import { cn } from '@/lib/utils';

interface FormattedTextProps {
  children: string;
  className?: string;
}

const renderRuns = (chars: StyledChar[]) =>
  toSegments(chars).map((seg, k) => {
    let node: React.ReactNode = seg.text;
    if (seg.i) node = <em className="italic">{node}</em>;
    if (seg.b) node = <strong className="font-bold">{node}</strong>;
    if (seg.s) node = <span className="line-through opacity-60">{node}</span>;
    return <span key={k}>{node}</span>;
  });

/**
 * A line with a lead (leading spaces and/or a bullet): its wrapped rows start under the text after
 * the lead. The lead stays in the line (so copying gives the same text); its drawn width, measured
 * here, becomes the line's hanging indent.
 */
const HangingLine = ({ lead, rest }: { lead: StyledChar[]; rest: StyledChar[] }) => {
  const lineRef = useRef<HTMLSpanElement>(null);
  const leadRef = useRef<HTMLSpanElement>(null);
  const [indent, setIndent] = useState(0);

  useLayoutEffect(() => {
    const line = lineRef.current;
    const leadEl = leadRef.current;
    if (!line || !leadEl) return;
    // offsetWidth, not the on-screen box: windows open with a short zoom (drawn 5% smaller), which
    // would make the indent too small for good
    const measure = () => setIndent(hangingIndent(leadEl.offsetWidth, line.clientWidth));
    measure();
    // Again when the box's width changes (the half-width cap) or the font finishes loading
    const observer = new ResizeObserver(measure);
    observer.observe(line);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={lineRef} className="block" style={{ paddingLeft: indent, textIndent: -indent }}>
      <span ref={leadRef}>{renderRuns(lead)}</span>
      {renderRuns(rest)}
    </span>
  );
};

/**
 * Renders text with ***bold italic***, **bold**, *italic*, and ~~strikethrough~~ support.
 * Uses the same parser as the editor (src/lib/inlineFormat.ts), so a description
 * looks the same on the cards as it does while editing. Escaped \* and \~ show
 * as plain * and ~. Each line is drawn on its own, so a line that wraps continues under its
 * text after its leading spaces and bullet (src/lib/lineLead.ts).
 */
export const FormattedText = ({ children, className }: FormattedTextProps) => {
  if (!children) return null;

  // Split into lines after parsing, so formatting that runs across a line break stays on both lines
  const lines: StyledChar[][] = [[]];
  for (const c of parseChars(children)) {
    if (c.ch === '\n') lines.push([]);
    else lines[lines.length - 1].push(c);
  }
  // A break at the very end adds no row (as when the text was drawn in one piece)
  if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();

  // A long word such as a pasted link breaks where it must: otherwise it set the card's minimum
  // width and pushed the page wider than a phone screen (break-words alone doesn't do that inside
  // the grid and flex layouts the cards sit in)
  return (
    <span className={cn('block [overflow-wrap:anywhere]', className)}>
      {lines.map((line, k) => {
        // An empty line keeps its height
        if (line.length === 0) return <span key={k} className="block"><br /></span>;
        const lead = lineLead(line.map((c) => c.ch).join(''));
        if (!lead) return <span key={k} className="block">{renderRuns(line)}</span>;
        return <HangingLine key={k} lead={line.slice(0, lead)} rest={line.slice(lead)} />;
      })}
    </span>
  );
};
