// Descriptions as plain text for LINE: the dashboard editor's formatting marks removed.
// Same rules, in the same order, as parseChars in src/lib/inlineFormat.ts (keep them in step).

// The editor stores literal * and ~ escaped as \* and \~; placeholders keep them while stripping
const ESC_STAR = '\u0001';
const ESC_TILDE = '\u0002';

export function stripMarkdown(text: string): string {
  return text
    .replace(/\\\*/g, ESC_STAR)
    .replace(/\\~/g, ESC_TILDE)
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/~~([\s\S]+?)~~/g, '$1')
    .split(ESC_STAR).join('*')
    .split(ESC_TILDE).join('~')
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
