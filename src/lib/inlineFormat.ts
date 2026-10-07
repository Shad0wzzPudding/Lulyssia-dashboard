/**
 * Shared parser / writer for the description formatting used by the editor
 * (FormattedTextarea) and the cards (FormattedText):
 *   ***bold italic***   **bold**   *italic*   ~~strikethrough~~
 * Literal `*` and `~` typed by the user are stored escaped as `\*` / `\~`.
 *
 * Text is edited as a list of characters, each with its own styles, and then
 * written back with markers. Writing tries a few marker layouts and only uses
 * one that reads back as exactly the intended styles, because some layouts are
 * ambiguous (e.g. formatting half of a bold-italic word).
 */

export interface StyledChar {
  ch: string;
  b: boolean;
  i: boolean;
  s: boolean;
}

export interface Segment {
  text: string;
  b: boolean;
  i: boolean;
  s: boolean;
}

// Placeholder characters used while parsing (never typed by users)
const ESC_STAR = '\u0001';
const ESC_TILDE = '\u0002';
const OPEN_B = '\u0003';
const CLOSE_B = '\u0004';
const OPEN_I = '\u0005';
const CLOSE_I = '\u0006';
const OPEN_S = '\u000e';
const CLOSE_S = '\u000f';

/** Read raw stored text into styled characters (newlines stay as '\n' chars). */
export const parseChars = (raw: string): StyledChar[] => {
  if (!raw) return [];
  let t = raw.replace(/\\\*/g, ESC_STAR).replace(/\\~/g, ESC_TILDE);
  // Same rules and order the editor has always used
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, `${OPEN_B}${OPEN_I}$1${CLOSE_I}${CLOSE_B}`);
  t = t.replace(/\*\*(.+?)\*\*/g, `${OPEN_B}$1${CLOSE_B}`);
  t = t.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, `${OPEN_I}$1${CLOSE_I}`);
  t = t.replace(/~~([\s\S]+?)~~/g, `${OPEN_S}$1${CLOSE_S}`);

  const out: StyledChar[] = [];
  let b = 0;
  let i = 0;
  let s = 0;
  // UTF-16 units (an emoji counts as 2), matching how the editor measures caret positions
  for (const c of t.split('')) {
    if (c === OPEN_B) b++;
    else if (c === CLOSE_B) b = Math.max(0, b - 1);
    else if (c === OPEN_I) i++;
    else if (c === CLOSE_I) i = Math.max(0, i - 1);
    else if (c === OPEN_S) s++;
    else if (c === CLOSE_S) s = Math.max(0, s - 1);
    else {
      const ch = c === ESC_STAR ? '*' : c === ESC_TILDE ? '~' : c;
      out.push({ ch, b: b > 0, i: i > 0, s: s > 0 });
    }
  }
  return out;
};

const sameStyle = (a: { b: boolean; i: boolean; s: boolean }, z: { b: boolean; i: boolean; s: boolean }) =>
  a.b === z.b && a.i === z.i && a.s === z.s;

/** Group styled characters into runs of the same style. */
export const toSegments = (chars: StyledChar[]): Segment[] => {
  const segs: Segment[] = [];
  for (const c of chars) {
    const last = segs[segs.length - 1];
    if (last && sameStyle(last, c)) last.text += c.ch;
    else segs.push({ text: c.ch, b: c.b, i: c.i, s: c.s });
  }
  return segs;
};

export const parseSegments = (raw: string): Segment[] => toSegments(parseChars(raw));

const escapeLiteral = (text: string) => text.replace(/[*~]/g, '\\$&');

type Attr = 'b' | 'i' | 's';
const MARK: Record<Attr, string> = { s: '~~', b: '**', i: '*' };

/** Every run fully wrapped on its own: "**a** *b*". */
const writeFlat = (segs: Segment[]): string =>
  segs
    .map((seg) => {
      let t = escapeLiteral(seg.text);
      if (seg.b && seg.i) t = `***${t}***`;
      else if (seg.b) t = `**${t}**`;
      else if (seg.i) t = `*${t}*`;
      if (seg.s) t = `~~${t}~~`;
      return t;
    })
    .join('');

/**
 * Properly nested markers, like HTML tags: a style that lasts longer opens
 * first (outside). `prefer` breaks ties. e.g. "*hel**lo***".
 */
const writeNested = (segs: Segment[], prefer: Attr[]): string => {
  const spanLength = (from: number, attr: Attr) => {
    let n = 0;
    for (let k = from; k < segs.length && segs[k][attr]; k++) n += segs[k].text.length;
    return n;
  };
  let out = '';
  const stack: Attr[] = [];
  segs.forEach((seg, k) => {
    // Close styles that end here (and anything opened inside them, to reopen below)
    const firstEnded = stack.findIndex((a) => !seg[a]);
    if (firstEnded !== -1) {
      while (stack.length > firstEnded) out += MARK[stack.pop() as Attr];
    }
    const toOpen = (['s', 'b', 'i'] as Attr[]).filter((a) => seg[a] && !stack.includes(a));
    toOpen.sort((x, y) => spanLength(k, y) - spanLength(k, x) || prefer.indexOf(x) - prefer.indexOf(y));
    for (const a of toOpen) {
      out += MARK[a];
      stack.push(a);
    }
    out += escapeLiteral(seg.text);
  });
  while (stack.length) out += MARK[stack.pop() as Attr];
  return out;
};

const readsBackAs = (raw: string, chars: StyledChar[]) => {
  const back = parseChars(raw);
  return back.length === chars.length && back.every((c, k) => c.ch === chars[k].ch && sameStyle(c, chars[k]));
};

/** Write one line (no '\n') with markers, using a layout that reads back exactly. */
const writeLine = (chars: StyledChar[]): string => {
  const segs = toSegments(chars);
  const candidates = [
    writeFlat(segs),
    writeNested(segs, ['s', 'b', 'i']),
    writeNested(segs, ['s', 'i', 'b']),
  ];
  return candidates.find((c) => readsBackAs(c, chars)) ?? candidates[0];
};

/** Write styled characters back to stored text. Styles never run across lines. */
export const writeChars = (chars: StyledChar[]): string => {
  const lines: StyledChar[][] = [[]];
  for (const c of chars) {
    if (c.ch === '\n') lines.push([]);
    else lines[lines.length - 1].push(c);
  }
  return lines.map(writeLine).join('\n');
};

/** Plain (unstyled) characters for inserted text such as pastes, bullets and new lines. */
export const plainChars = (text: string): StyledChar[] =>
  text.split('').map((ch) => ({ ch, b: false, i: false, s: false }));

/**
 * Turn a style on or off for characters [start, end): off if every selected
 * character already has it, otherwise on. Spaces at the edges of each selected
 * line part are left unstyled when turning a style on.
 */
export const toggleStyle = (chars: StyledChar[], start: number, end: number, attr: Attr): StyledChar[] => {
  const next = chars.map((c) => ({ ...c }));
  const picked: number[] = [];
  for (let k = Math.max(0, start); k < Math.min(end, next.length); k++) {
    if (next[k].ch !== '\n') picked.push(k);
  }
  if (picked.length === 0) return next;

  // Selected characters per line, without whitespace at the edges
  const trimmed: number[] = [];
  let line: number[] = [];
  const flush = () => {
    let a = 0;
    let z = line.length - 1;
    while (a <= z && /\s/.test(next[line[a]].ch)) a++;
    while (z >= a && /\s/.test(next[line[z]].ch)) z--;
    for (let k = a; k <= z; k++) trimmed.push(line[k]);
    line = [];
  };
  picked.forEach((k, n) => {
    if (n > 0 && k !== picked[n - 1] + 1) flush();
    line.push(k);
  });
  flush();

  const targets = trimmed.length ? trimmed : picked;
  const turnOn = !targets.every((k) => next[k][attr]);
  for (const k of turnOn ? targets : picked) next[k][attr] = turnOn;
  return next;
};
