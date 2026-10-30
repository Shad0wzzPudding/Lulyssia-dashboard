/**
 * A description line's "lead": its leading spaces, then optionally a bullet ("-", "•", "*", or a
 * number followed by "." or ")") with at least one space after it. When the line wraps, the wrapped
 * rows start under the text after the lead (a hanging indent, as in Word); a lead wider than half
 * the box is capped at half, so the text keeps room. Used where descriptions are shown
 * (FormattedText) and in the editor, so a description wraps the same way in both.
 */
const LEAD = /^( *)((?:[-•*]|\d+[.)]) +)?/;

/** How many characters at the start of `line` (one line, no '\n') are its lead; 0 if none. */
export const lineLead = (line: string): number => {
  // A line of only spaces has nothing to line up
  if (!line.trim()) return 0;
  const m = LEAD.exec(line);
  return m ? m[0].length : 0;
};

/** The hanging indent for a lead `leadWidth` px wide in a box `boxWidth` px wide (capped at half). */
export const hangingIndent = (leadWidth: number, boxWidth: number): number =>
  Math.max(0, Math.round(Math.min(leadWidth, boxWidth / 2)));
