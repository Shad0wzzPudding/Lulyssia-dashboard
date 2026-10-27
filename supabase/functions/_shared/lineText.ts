// Descriptions as plain text for LINE: the dashboard editor's formatting marks removed.
// Same rules, in the same order, as parseChars in src/lib/inlineFormat.ts (keep them in step).

// The editor stores literal *, ~ and \ escaped as \*, \~ and \\, and may put an empty separator
// \| between runs; placeholders keep them while stripping
const ESC_STAR = '\u0001';
const ESC_TILDE = '\u0002';
const ESC_BACKSLASH = '\u0007';
const SEPARATOR = '\u0010';

export function stripMarkdown(text: string): string {
  return stripMarks(text).trim();
}

// The marks removed, with the text's spaces (and line breaks) kept as they are
function stripMarks(text: string): string {
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
    .split(SEPARATOR).join('');
}

// A long description could make a card too big for LINE (it then falls back to plain text, which has
// no "Mark as done" button), so it is cut to a few lines and characters
const MAX_DETAIL_LINES = 5;
const MAX_DETAIL_CHARS = 300;
const CUT_NOTE = '...\nRead full detail in dashboard.';

/**
 * The description cleaned for LINE: at most 5 non-empty lines and about 300 characters. Each line
 * keeps the spaces at its start (indents made in the editor); spaces at the end are trimmed.
 */
export function formatDetail(text: string | null): string | null {
  if (!text) return null;
  const clean = stripMarks(text);
  if (!clean.trim()) return null;
  const lines = clean.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  if (lines.length === 0) return null;
  let detail = lines.slice(0, MAX_DETAIL_LINES).join('\n');
  let cut = lines.length > MAX_DETAIL_LINES;
  if (detail.length > MAX_DETAIL_CHARS) {
    // Whole characters (an emoji is two UTF-16 units), ending at a space when there is one nearby
    const chars = Array.from(detail).slice(0, MAX_DETAIL_CHARS);
    const lastSpace = Math.max(chars.lastIndexOf(' '), chars.lastIndexOf('\n'));
    detail = chars.slice(0, lastSpace > MAX_DETAIL_CHARS - 40 ? lastSpace : MAX_DETAIL_CHARS).join('').trimEnd();
    cut = true;
  }
  return cut ? `${detail}${CUT_NOTE}` : detail;
}
