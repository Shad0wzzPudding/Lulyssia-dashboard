/**
 * Checklists in descriptions. A checklist line starts, after any leading spaces, with "[ ] " (not
 * ticked) or "[x] " (ticked; "[X]" counts too). The text stays readable wherever it's copied; the
 * app draws the brackets as a box.
 */
import { parseChars, plainChars, writeChars, type StyledChar } from './inlineFormat';

const BOX = /^( *)\[([ xX])\] /;

/** The box on one line (no '\n'): where it starts, and whether it's ticked; null if none. */
export const lineBox = (line: string): { at: number; ticked: boolean } | null => {
  const m = BOX.exec(line);
  return m ? { at: m[1].length, ticked: m[2] !== ' ' } : null;
};

/** The description's lines as shown (formatting marks taken away). */
const shownLines = (description: string) => parseChars(description).map((c) => c.ch).join('').split('\n');

/** How many checklist lines a description has, and how many are ticked. */
export const checklistProgress = (description: string | null | undefined): { done: number; total: number } => {
  let done = 0;
  let total = 0;
  for (const line of shownLines(description || '')) {
    const box = lineBox(line);
    if (!box) continue;
    total++;
    if (box.ticked) done++;
  }
  return { done, total };
};

/** Lines of styled characters, split at '\n'. */
const splitLines = (chars: StyledChar[]): StyledChar[][] => {
  const lines: StyledChar[][] = [[]];
  for (const c of chars) {
    if (c.ch === '\n') lines.push([]);
    else lines[lines.length - 1].push(c);
  }
  return lines;
};

const joinLines = (lines: StyledChar[][]): StyledChar[] =>
  lines.flatMap((line, k) => (k === 0 ? line : [...plainChars('\n'), ...line]));

/**
 * Tick or untick the box on line `lineIndex` of a stored description; the text is unchanged when
 * that line has no box. Only that line is rewritten, so the rest keeps its exact stored form.
 */
export const toggleCheck = (description: string, lineIndex: number): string => {
  const raw = description.split('\n');
  const line = raw[lineIndex];
  if (line !== undefined) {
    // The usual case: the brackets are plain text at the line's start
    const m = BOX.exec(line);
    if (m) {
      raw[lineIndex] = `${m[1]}[${m[2] === ' ' ? 'x' : ' '}] ${line.slice(m[0].length)}`;
      return raw.join('\n');
    }
  }
  // The brackets are inside formatting marks (e.g. a bold line): change the character itself
  const lines = splitLines(parseChars(description));
  const chars = lines[lineIndex];
  const box = chars && lineBox(chars.map((c) => c.ch).join(''));
  if (!box) return description;
  const mark = chars[box.at + 1];
  chars[box.at + 1] = { ...mark, ch: mark.ch === ' ' ? 'x' : ' ' };
  return writeChars(joinLines(lines));
};

/**
 * The "☑ Check" button on the lines [first, last] of the editor's characters: when every one of
 * them already has a box, the boxes are taken away; otherwise each line without one gets "[ ] "
 * after its leading spaces. Returns the new characters and how many characters each line grew by
 * (negative when a box was taken away), for moving the selection.
 */
export const toggleChecklistLines = (
  chars: StyledChar[],
  lineStarts: number[]
): { chars: StyledChar[]; shift: (pos: number) => number } => {
  const lines = splitLines(chars);
  // The line number of each start offset
  const startsOf: number[] = [];
  let at = 0;
  lines.forEach((line) => {
    startsOf.push(at);
    at += line.length + 1;
  });
  const picked = lineStarts.map((s) => startsOf.indexOf(s)).filter((k) => k >= 0);
  const text = (k: number) => lines[k].map((c) => c.ch).join('');
  const remove = picked.every((k) => lineBox(text(k)));
  // Changes as [offset in chars, characters added (+) or removed (-)]
  const changes: [number, number][] = [];
  picked.forEach((k) => {
    const box = lineBox(text(k));
    const spaces = text(k).length - text(k).trimStart().length;
    if (remove && box) {
      lines[k] = [...lines[k].slice(0, box.at), ...lines[k].slice(box.at + 4)];
      changes.push([startsOf[k] + box.at, -4]);
    } else if (!remove && !box) {
      lines[k] = [...lines[k].slice(0, spaces), ...plainChars('[ ] '), ...lines[k].slice(spaces)];
      changes.push([startsOf[k] + spaces, 4]);
    }
  });
  const shift = (pos: number) =>
    changes.reduce((p, [offset, n]) => (n > 0 ? (pos >= offset ? p + n : p) : pos > offset ? p - Math.min(-n, pos - offset) : p), pos);
  return { chars: joinLines(lines), shift };
};
