/**
 * Indenting whole lines of a description (the editor's Tab and Shift+Tab keys). Works on the editor's
 * styled characters, so the text keeps its formatting; the added spaces are plain spaces, so the
 * description looks the same everywhere it's shown.
 */
import { plainChars, type StyledChar } from './inlineFormat';

/** One tab = 6 spaces */
export const TAB_SPACES = 6;

/**
 * Start index of every line the selection touches. A selection that ends exactly at the start of a
 * line doesn't take that line. With only a caret, the caret's line.
 */
export const linesInSelection = (chars: StyledChar[], start: number, end: number): number[] => {
  const lineStart = (pos: number) => {
    let k = pos;
    while (k > 0 && chars[k - 1].ch !== '\n') k--;
    return k;
  };
  const last = end > start && end > 0 && chars[end - 1].ch === '\n' ? end - 1 : end;
  const starts = [lineStart(start)];
  for (let k = starts[0]; k < last; k++) if (chars[k].ch === '\n') starts.push(k + 1);
  return starts;
};

export interface LineEdit {
  chars: StyledChar[];
  start: number;
  end: number;
}

/**
 * Add `count` spaces at the start of every line in the selection. The same lines stay selected:
 * a selection that started at a line's start still does, and a caret moves with its text.
 */
export const indentLines = (chars: StyledChar[], start: number, end: number, count: number): LineEdit => {
  const lines = linesInSelection(chars, start, end);
  const out: StyledChar[] = [];
  let from = 0;
  lines.forEach((ls) => {
    out.push(...chars.slice(from, ls), ...plainChars(' '.repeat(count)));
    from = ls;
  });
  out.push(...chars.slice(from));
  const collapsed = start === end;
  const shift = (pos: number, keepAtLineStart: boolean) =>
    pos + count * lines.filter((ls) => ls < pos || (ls === pos && !keepAtLineStart)).length;
  const newStart = shift(start, !collapsed);
  return { chars: out, start: newStart, end: collapsed ? newStart : shift(end, false) };
};

/** Remove up to `count` spaces from the start of every line in the selection (only spaces). */
export const outdentLines = (chars: StyledChar[], start: number, end: number, count: number): LineEdit => {
  const removed: Array<[number, number]> = [];
  linesInSelection(chars, start, end).forEach((ls) => {
    let n = 0;
    while (n < count && ls + n < chars.length && chars[ls + n].ch === ' ') n++;
    if (n > 0) removed.push([ls, n]);
  });
  const out = chars.filter((_, k) => !removed.some(([ls, n]) => k >= ls && k < ls + n));
  const shift = (pos: number) =>
    pos - removed.reduce((sum, [ls, n]) => sum + Math.min(Math.max(pos - ls, 0), n), 0);
  return { chars: out, start: shift(start), end: shift(end) };
};
