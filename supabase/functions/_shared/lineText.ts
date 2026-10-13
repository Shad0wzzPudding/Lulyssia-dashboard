// Descriptions as plain text for LINE: the dashboard editor's formatting marks removed.
// Same rules, in the same order, as parseChars in src/lib/inlineFormat.ts (keep them in step).

// The editor stores literal *, ~ and \ escaped as \*, \~ and \\, and may put an empty separator
// \| between runs; placeholders keep them while stripping
const ESC_STAR = '\u0001';
const ESC_TILDE = '\u0002';
const ESC_BACKSLASH = '\u0007';
const SEPARATOR = '\u0010';

export function stripMarkdown(text: string): string {
  return text
    // One pass, so "\\*" is an escaped backslash followed by a marker
    .replace(/\\([\\*~|])/g, (_, c) =>
      c === '*' ? ESC_STAR : c === '~' ? ESC_TILDE : c === '|' ? SEPARATOR : ESC_BACKSLASH
    )
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/~~([\s\S]+?)~~/g, '$1')
    .split(ESC_STAR).join('*')
    .split(ESC_TILDE).join('~')
    .split(ESC_BACKSLASH).join('\\')
    .split(SEPARATOR).join('')
    .trim();
}

/** The description cleaned for LINE: at most 5 non-empty lines, then "...". */
export function formatDetail(text: string | null): string | null {
  if (!text) return null;
  const clean = stripMarkdown(text).trim();
  if (!clean) return null;
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length <= 5) return lines.join('\n');
  return [...lines.slice(0, 5), '...'].join('\n');
}
