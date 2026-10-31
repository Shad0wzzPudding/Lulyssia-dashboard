import { useRef, useState, useCallback, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { List, Strikethrough, Bold, Italic, IndentIncrease, IndentDecrease, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseChars, plainChars, toggleStyle, toSegments, writeChars, type StyledChar } from '@/lib/inlineFormat';
import { TAB_SPACES, indentLines, isWholeLine, linesInSelection, outdentLines } from '@/lib/lineIndent';
import { useSpaceIndent } from '@/hooks/useEditorSettings';
import { hangingIndent, lineLead } from '@/lib/lineLead';
import { lineBox, toggleChecklistLines } from '@/lib/checklist';

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const runsHTML = (chars: StyledChar[]): string =>
  toSegments(chars)
    .map((seg) => {
      let h = escapeHtml(seg.text);
      if (seg.i) h = `<em class="italic">${h}</em>`;
      if (seg.b) h = `<strong class="font-bold">${h}</strong>`;
      if (seg.s) h = `<s class="line-through opacity-60">${h}</s>`;
      return h;
    })
    .join('');

/**
 * Stored text (with **bold**, *italic*, ~~strike~~ markers) -> editor HTML.
 * Parsing is shared with the cards (src/lib/inlineFormat.ts) so both always agree.
 * Each line is its own <div> (an empty one holds a <br> so it keeps its height and the caret can
 * land there), and a line's lead (leading spaces and bullet, src/lib/lineLead.ts) is wrapped in
 * <span data-lead>, so its wrapped rows can line up under its text, as on the cards
 * (applyHangingIndents).
 */
const toHTML = (text: string): string => {
  if (!text) return '';
  const lines: StyledChar[][] = [[]];
  for (const c of parseChars(text)) {
    if (c.ch === '\n') lines.push([]);
    else lines[lines.length - 1].push(c);
  }
  return lines
    .map((line) => {
      if (line.length === 0) return '<div><br></div>';
      const text = line.map((c) => c.ch).join('');
      const lead = lineLead(text);
      // A checklist line's "[ ] " / "[x] " is drawn as a box (read back as those four characters, so
      // the caret after a box is always at the start of its text)
      const box = lineBox(text);
      const leadInner = box
        ? `${runsHTML(line.slice(0, box.at))}${boxHTML(box.ticked)}${runsHTML(line.slice(box.at + 4, lead))}`
        : runsHTML(line.slice(0, lead));
      const leadHTML = lead ? `<span data-lead="">${leadInner}</span>` : '';
      // A ticked checklist line's text: muted and crossed out (only drawn so; not saved as ~~strike~~)
      const rest = runsHTML(line.slice(lead));
      return `<div>${leadHTML}${box?.ticked ? `<span data-done="" class="text-muted-foreground line-through">${rest}</span>` : rest}</div>`;
    })
    .join('');
};

/** A checklist box in the editor: not typed into; clicking it ticks it (see handleEditorClick). */
const boxHTML = (ticked: boolean) =>
  `<span data-check="${ticked ? 'x' : ' '}" contenteditable="false" class="ml-0.5 mr-1.5 inline-flex h-3.5 w-3.5 cursor-pointer select-none items-center justify-center rounded-[3px] border align-[-2px] indent-0 text-[10px] font-bold leading-none ${ticked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/70'}">${ticked ? '✓' : ''}</span>`;

/** The editor's HTML without the measured indents (to compare it with toHTML's). */
const withoutIndents = (html: string) => html.replace(/ style="[^"]*"/g, '');

/**
 * Give each line with a lead its hanging indent: the lead's drawn width (at most half the box), so
 * the line's wrapped rows start under its text. Run after every redraw and when the box resizes.
 */
const applyHangingIndents = (el: HTMLElement) => {
  el.querySelectorAll<HTMLElement>(':scope > div').forEach((line) => {
    const lead = line.querySelector<HTMLElement>(':scope > span[data-lead]');
    // offsetWidth, not the on-screen box: the forms open with a short zoom (drawn 5% smaller), which
    // would make the indent too small for good
    const indent = lead ? hangingIndent(lead.offsetWidth, line.clientWidth) : 0;
    if (indent) {
      line.style.paddingLeft = `${indent}px`;
      line.style.textIndent = `-${indent}px`;
    } else if (line.hasAttribute('style')) {
      line.removeAttribute('style');
    }
  });
};

/**
 * Read what the editor shows as styled characters (one per visible character,
 * '\n' per line break). The extra trailing <br> from toHTML is dropped unless
 * stripTrailingNewline is false.
 */
const domChars = (el: HTMLElement, stripTrailingNewline = true): StyledChar[] => {
  const out: StyledChar[] = [];
  const newline = (): StyledChar => ({ ch: '\n', b: false, i: false, s: false });
  const walk = (node: Node, b: boolean, i: boolean, s: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // UTF-16 units, matching the caret offsets measured below
      for (const ch of (node.textContent || '').split('')) out.push({ ch, b, i, s });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as HTMLElement).tagName.toLowerCase();
    if (tag === 'br') {
      out.push(newline());
      return;
    }
    // A checklist box: the "[ ] " / "[x] " it stands for
    const check = (node as HTMLElement).getAttribute('data-check');
    if (check !== null) {
      for (const ch of `[${check === 'x' ? 'x' : ' '}] `) out.push({ ch, b, i, s });
      return;
    }
    // Browsers sometimes wrap new lines in <div>/<p>
    if ((tag === 'div' || tag === 'p') && out.length > 0 && out[out.length - 1].ch !== '\n') {
      out.push(newline());
    }
    const nb = b || tag === 'strong' || tag === 'b';
    const ni = i || tag === 'em' || tag === 'i';
    const ns = s || tag === 's' || tag === 'strike' || tag === 'del';
    node.childNodes.forEach((child) => walk(child, nb, ni, ns));
  };
  el.childNodes.forEach((child) => walk(child, false, false, false));
  if (stripTrailingNewline && out.length > 0 && out[out.length - 1].ch === '\n') out.pop();
  return out;
};

/** Editor contents -> stored text with markers (literal * and ~ escaped). */
const toPlainText = (el: HTMLElement): string => writeChars(domChars(el));

/**
 * Count caret position as the number of characters in the rendered DOM up to the caret, counted
 * exactly as domChars reads them (line <div>s and <br>s as line breaks). restoreCursor walks the
 * same way, so save→restore is symmetric.
 */
const measureDomOffset = (root: HTMLElement): number => domChars(root, false).length;

/**
 * Save and restore cursor position in contentEditable.
 */
const saveCursor = (el: HTMLElement): number => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;

  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);

  const temp = document.createElement('div');
  temp.appendChild(preRange.cloneContents());
  return measureDomOffset(temp);
};

const getVisibleOffset = (el: HTMLElement, container: Node, offset: number): number => {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.setEnd(container, offset);

  const temp = document.createElement('div');
  temp.appendChild(range.cloneContents());
  return measureDomOffset(temp);
};

const getSelectionVisibleRange = (el: HTMLElement): { start: number; end: number } | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  return {
    start: getVisibleOffset(el, range.startContainer, range.startOffset),
    end: getVisibleOffset(el, range.endContainer, range.endOffset),
  };
};

/** True when the current selection is inside the editor (not elsewhere on the page). */
const selectionInside = (el: HTMLElement): boolean => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  return el.contains(range.startContainer) && el.contains(range.endContainer);
};

const setCaretAt = (sel: Selection, node: Node, offset: number) => {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

const setCaretBeforeNode = (sel: Selection, node: Node) => {
  const range = document.createRange();
  range.setStartBefore(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

const setCaretAfterNode = (sel: Selection, node: Node) => {
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

const restoreCursor = (el: HTMLElement, pos: number) => {
  const sel = window.getSelection();
  if (!sel) return;

  // Counted as domChars counts: text, <br>s, and a line break where a line <div> starts after text
  let currentPos = 0;
  let afterBreak = false;
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (pos <= currentPos + text.length) {
        setCaretAt(sel, node, Math.max(0, pos - currentPos));
        return true;
      }
      currentPos += text.length;
      if (text) afterBreak = text.endsWith('\n');
      return false;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = (node as HTMLElement).tagName.toLowerCase();

    // A checklist box stands for 4 characters; the caret goes before or after it, never inside
    if ((node as HTMLElement).hasAttribute('data-check')) {
      if (pos <= currentPos) {
        setCaretBeforeNode(sel, node);
        return true;
      }
      if (pos <= currentPos + 4) {
        setCaretAfterNode(sel, node);
        return true;
      }
      currentPos += 4;
      afterBreak = false;
      return false;
    }

    if (tag === 'br') {
      if (pos === currentPos) {
        setCaretBeforeNode(sel, node);
        return true;
      }
      currentPos += 1;
      afterBreak = true;
      // A <br> inside a line (not the one holding an empty line open, or ending a line): the next
      // line starts right after it
      if (pos === currentPos && node.nextSibling) {
        setCaretAfterNode(sel, node);
        return true;
      }
      return false;
    }

    if ((tag === 'div' || tag === 'p') && currentPos > 0 && !afterBreak) {
      currentPos += 1;
      afterBreak = true;
      if (pos === currentPos) {
        setCaretAt(sel, node, 0);
        return true;
      }
    }
    for (const child of Array.from(node.childNodes)) {
      if (walk(child)) return true;
    }
    return false;
  };

  for (const child of Array.from(el.childNodes)) {
    if (walk(child)) return;
  }

  // Past the end: the end of the last line
  const last = el.lastChild;
  if (last instanceof HTMLElement && last.tagName === 'DIV') {
    if (last.lastChild instanceof HTMLElement && last.lastChild.tagName === 'BR') setCaretBeforeNode(sel, last.lastChild);
    else setCaretAt(sel, last, last.childNodes.length);
    return;
  }
  setCaretAt(sel, el, el.childNodes.length);
};

/**
 * Redraw the editor's contents without losing its scroll position: emptying it for a moment would
 * otherwise snap a long description back to the top after every button press or undo.
 */
const redraw = (el: HTMLElement, html: string) => {
  const top = el.scrollTop;
  el.innerHTML = html;
  applyHangingIndents(el);
  el.scrollTop = top;
};

/** Scroll the editor just enough to show the caret (or the end of the selection), if it's out of view. */
const keepCaretInView = (el: HTMLElement) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(false);
  let rect = range.getBoundingClientRect();
  // A collapsed range at a line start can have no box; fall back to its node's box
  if (!rect.height && range.startContainer instanceof Element) rect = range.startContainer.getBoundingClientRect();
  if (!rect.height) return;
  const box = el.getBoundingClientRect();
  if (rect.top < box.top) el.scrollTop -= box.top - rect.top + 4;
  else if (rect.bottom > box.bottom) el.scrollTop += rect.bottom - box.bottom + 4;
};

const restoreSelection = (el: HTMLElement, visStart: number, visEnd: number) => {
  const sel = window.getSelection();
  if (!sel) return;

  // First set cursor at start
  restoreCursor(el, visStart);
  if (visStart === visEnd || sel.rangeCount === 0) return;

  const startRange = sel.getRangeAt(0);
  const startNode = startRange.startContainer;
  const startOffset = startRange.startOffset;

  // Set cursor at end to find that position
  restoreCursor(el, visEnd);
  const endRange = sel.getRangeAt(0);

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endRange.startContainer, endRange.startOffset);
  sel.removeAllRanges();
  sel.addRange(range);
};

/** Index just after the last '\n' in chars (start of the current line). */
const lineStartOf = (chars: StyledChar[]): number => {
  for (let k = chars.length - 1; k >= 0; k--) if (chars[k].ch === '\n') return k + 1;
  return 0;
};

export const FormattedTextarea = ({ value, onChange, placeholder, className }: FormattedTextareaProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [autoBullet, setAutoBullet] = useState(false);
  const isUpdatingRef = useRef(false);
  // True while a phone keyboard / input method is composing text
  const composingRef = useRef(false);
  // Increases with every edit; only the newest edit's re-render is applied
  const renderTokenRef = useRef(0);
  const applyFormatToggleRef = useRef<(marker: string) => void>(() => {});
  // Ctrl+M switches Tab between indenting (the default) and moving on to the next field, so
  // keyboard users aren't trapped in the box (the same key as in VS Code)
  const [tabMoves, setTabMoves] = useState(false);
  const tabHintId = useId();
  // Settings > Editor: "Quick space" (Space on selected lines indents them) or "Normal"
  const spaceIndent = useSpaceIndent();

  // Undo/redo history: stack of {value, cursor} snapshots (cursor = visible offset).
  const historyRef = useRef<{ value: string; cursor: number }[]>([{ value, cursor: 0 }]);
  const historyIndexRef = useRef(0);
  const pendingSnapshotTimerRef = useRef<number | null>(null);

  const commitSnapshot = useCallback((val: string, cursor: number) => {
    const stack = historyRef.current;
    const idx = historyIndexRef.current;
    const cur = stack[idx];
    if (cur && cur.value === val) {
      cur.cursor = cursor;
      return;
    }
    const truncated = stack.slice(0, idx + 1);
    truncated.push({ value: val, cursor });
    if (truncated.length > 200) truncated.shift();
    historyRef.current = truncated;
    historyIndexRef.current = truncated.length - 1;
  }, []);

  const flushPendingSnapshot = useCallback(() => {
    if (pendingSnapshotTimerRef.current != null) {
      clearTimeout(pendingSnapshotTimerRef.current);
      pendingSnapshotTimerRef.current = null;
    }
  }, []);

  const scheduleTypingSnapshot = useCallback((val: string, cursor: number) => {
    flushPendingSnapshot();
    pendingSnapshotTimerRef.current = window.setTimeout(() => {
      pendingSnapshotTimerRef.current = null;
      commitSnapshot(val, cursor);
    }, 400);
  }, [commitSnapshot, flushPendingSnapshot]);

  const pushSnapshotNow = useCallback((val: string, cursor: number) => {
    flushPendingSnapshot();
    commitSnapshot(val, cursor);
  }, [commitSnapshot, flushPendingSnapshot]);

  const applyHistoryEntry = useCallback((entry: { value: string; cursor: number }, cursorOverride?: number) => {
    const el = editorRef.current;
    if (!el) return;
    isUpdatingRef.current = true;
    redraw(el, toHTML(entry.value));
    // Measure the maximum caret offset in the newly-rendered DOM so we can
    // clamp any override without walking past the end.
    const maxOffset = measureDomOffset(el);
    const target = cursorOverride != null
      ? Math.min(Math.max(0, cursorOverride), maxOffset)
      : entry.cursor;
    restoreCursor(el, target);
    el.focus({ preventScroll: true });
    keepCaretInView(el);
    onChange(entry.value);
    requestAnimationFrame(() => {
      isUpdatingRef.current = false;
    });
  }, [onChange]);

  const performUndo = useCallback(() => {
    flushPendingSnapshot();
    const el = editorRef.current;
    let currentCursor: number | undefined;
    if (el) {
      const currentPlain = toPlainText(el);
      currentCursor = saveCursor(el);
      const top = historyRef.current[historyIndexRef.current];
      if (top && top.value !== currentPlain) {
        commitSnapshot(currentPlain, currentCursor);
      }
    }
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    applyHistoryEntry(historyRef.current[historyIndexRef.current], currentCursor);
  }, [applyHistoryEntry, commitSnapshot, flushPendingSnapshot]);

  const performRedo = useCallback(() => {
    flushPendingSnapshot();
    const el = editorRef.current;
    const currentCursor = el ? saveCursor(el) : undefined;
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    applyHistoryEntry(historyRef.current[historyIndexRef.current], currentCursor);
  }, [applyHistoryEntry, flushPendingSnapshot]);

  // Sync external value changes into contentEditable
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isUpdatingRef.current) return;

    const currentText = toPlainText(el);
    if (currentText !== value) {
      const pos = saveCursor(el);
      el.innerHTML = toHTML(value);
      applyHangingIndents(el);
      restoreCursor(el, pos);
      // External value replaced the editor contents (e.g. editing a different
      // item) — reset undo history so we don't rewind into unrelated state.
      flushPendingSnapshot();
      historyRef.current = [{ value, cursor: pos }];
      historyIndexRef.current = 0;
    }
  }, [value, flushPendingSnapshot]);

  // The hanging indents depend on the box's width (the half-width cap) and the font: measure again
  // when either changes
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => applyHangingIndents(el));
    observer.observe(el);
    document.fonts?.ready.then(() => applyHangingIndents(el)).catch(() => {});
    return () => observer.disconnect();
  }, []);

  /**
   * Save an edit made by a button or key (not typing): report the new text,
   * record it for undo, then re-render and put the caret/selection back.
   */
  const commitEdit = useCallback((newValue: string, selStart: number, selEnd = selStart) => {
    const el = editorRef.current;
    if (!el) return;
    onChange(newValue);
    pushSnapshotNow(newValue, selEnd);
    isUpdatingRef.current = true;
    const token = ++renderTokenRef.current;
    requestAnimationFrame(() => {
      if (token !== renderTokenRef.current) return;
      redraw(el, toHTML(newValue));
      el.focus({ preventScroll: true });
      restoreSelection(el, selStart, selEnd);
      keepCaretInView(el);
      isUpdatingRef.current = false;
    });
  }, [onChange, pushSnapshotNow]);

  const handleInput = useCallback((e?: React.FormEvent<HTMLDivElement>) => {
    const el = editorRef.current;
    if (!el) return;
    // Phone keyboards and input methods (e.g. Thai) compose text provisionally.
    // Rewriting the editor mid-composition breaks it (cut-off words, jumping caret),
    // so wait: handleCompositionEnd runs this again once the text is committed.
    if (composingRef.current || (e?.nativeEvent as InputEvent | undefined)?.isComposing) return;

    isUpdatingRef.current = true;
    const plainText = toPlainText(el);
    const pos = saveCursor(el);
    onChange(plainText);
    scheduleTypingSnapshot(plainText, pos);

    // Re-render with formatting after a tick. Only the latest edit's render runs,
    // and only when the formatted HTML actually differs, so plain typing leaves the
    // browser's own text and caret untouched (better for autocorrect on phones).
    const token = ++renderTokenRef.current;
    requestAnimationFrame(() => {
      if (token !== renderTokenRef.current) return;
      const html = toHTML(plainText);
      if (withoutIndents(el.innerHTML) !== html) {
        redraw(el, html);
        restoreCursor(el, pos);
      }
      isUpdatingRef.current = false;
    });
  }, [onChange, scheduleTypingSnapshot]);

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    composingRef.current = false;
    handleInput();
  }, [handleInput]);

  /**
   * Tab / Shift+Tab: indent or un-indent the caret's line, or every line the selection touches, by
   * one tab (6 spaces). The same lines stay selected so it can be pressed again.
   */
  const shiftLines = useCallback((outdent: boolean) => {
    const el = editorRef.current;
    if (!el) return;
    const chars = domChars(el);
    const range = selectionInside(el) ? getSelectionVisibleRange(el) : null;
    const start = Math.min(range?.start ?? chars.length, chars.length);
    const end = Math.min(Math.max(range?.end ?? start, start), chars.length);
    const edit = (outdent ? outdentLines : indentLines)(chars, start, end, TAB_SPACES);
    commitEdit(writeChars(edit.chars), edit.start, edit.end);
  }, [commitEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // A word still being composed (phone keyboards, input methods): Tab and Space are left to it
    const composing = e.nativeEvent.isComposing;
    // Undo / Redo — intercept before the browser's native (broken) undo runs.
    const mod = e.ctrlKey || e.metaKey;

    if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      setTabMoves((moves) => !moves);
      return;
    }
    if (e.key === 'Tab' && !mod && !e.altKey && !composing) {
      // Switched with Ctrl+M: Tab moves on to the next field as usual
      if (tabMoves) return;
      e.preventDefault();
      shiftLines(e.shiftKey);
      return;
    }

    // Space with one whole line, or two or more lines, selected adds a space at the start of each
    // line instead of replacing them. Part of one line selected, or the "Normal" setting: Space
    // types as usual.
    if (e.key === ' ' && !mod && !e.altKey && !composing && spaceIndent === 'quick') {
      const el = editorRef.current;
      const range = el && selectionInside(el) ? getSelectionVisibleRange(el) : null;
      if (el && range && range.end > range.start) {
        const chars = domChars(el);
        const start = Math.min(range.start, chars.length);
        const end = Math.min(range.end, chars.length);
        if (isWholeLine(chars, start, end) || linesInSelection(chars, start, end).length > 1) {
          e.preventDefault();
          const edit = indentLines(chars, start, end, 1);
          commitEdit(writeChars(edit.chars), edit.start, edit.end);
          return;
        }
      }
    }

    if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      performUndo();
      return;
    }
    if (mod && ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      performRedo();
      return;
    }

    // Keyboard shortcuts for formatting (lowercased so they also work with Caps Lock on)
    const keyLower = e.key.toLowerCase();
    if (mod && !e.shiftKey && keyLower === 'b') {
      e.preventDefault();
      applyFormatToggleRef.current('**');
      return;
    }
    if (mod && !e.shiftKey && keyLower === 'i') {
      e.preventDefault();
      applyFormatToggleRef.current('*');
      return;
    }
    if (mod && e.shiftKey && keyLower === 's') {
      e.preventDefault();
      applyFormatToggleRef.current('~~');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const el = editorRef.current;
      if (!el || !selectionInside(el)) return;

      // Edit the visible characters: replace any selection with the new line.
      // Characters after the caret keep their styles (e.g. Enter inside bold
      // gives "**ab**\n**cd**").
      const chars = domChars(el);
      const range = getSelectionVisibleRange(el);
      const start = Math.min(range?.start ?? chars.length, chars.length);
      const end = Math.min(Math.max(range?.end ?? start, start), chars.length);
      const before = chars.slice(0, start);
      const after = chars.slice(end);

      // At the end of a checklist line's text: a new checklist line with the same indent (Auto • on or
      // off); on an empty checklist line, the list ends: the box goes, leaving a plain line
      {
        const lineStart = lineStartOf(before);
        const lineEnd = after.findIndex((c) => c.ch === '\n');
        const line = [...before.slice(lineStart), ...(lineEnd === -1 ? after : after.slice(0, lineEnd))].map((c) => c.ch).join('');
        const box = lineBox(line);
        if (box && before.length - lineStart >= box.at + 4) {
          if (!line.slice(box.at + 4).trim()) {
            const kept = before.slice(0, lineStart);
            commitEdit(writeChars([...kept, ...after.slice(lineEnd === -1 ? after.length : lineEnd)]), kept.length);
            return;
          }
          const indent = ' '.repeat(box.at);
          commitEdit(writeChars([...before, ...plainChars(`\n${indent}[ ] `), ...after]), before.length + 5 + indent.length);
          return;
        }
      }

      if (autoBullet) {
        const lineStart = lineStartOf(before);
        const currentLine = before.slice(lineStart).map((c) => c.ch).join('');

        if (currentLine.trim() === '•') {
          // Enter on an empty bullet ends the list: drop the bullet, keep a plain new line
          const kept = lineStart === 0 ? plainChars('\n') : before.slice(0, lineStart);
          commitEdit(writeChars([...kept, ...after]), kept.length);
          return;
        }

        // New bullet line, indented like the line it follows; the caret goes after the "• " so
        // typing lands in the bullet
        const indent = currentLine.match(/^ */)?.[0] ?? '';
        commitEdit(writeChars([...before, ...plainChars(`\n${indent}• `), ...after]), before.length + 3 + indent.length);
        return;
      }

      // Normal enter: caret at the start of the new line
      commitEdit(writeChars([...before, ...plainChars('\n'), ...after]), before.length + 1);
    }
  }, [autoBullet, commitEdit, performRedo, performUndo, shiftLines, spaceIndent, tabMoves]);

  /**
   * "☑ Check": a box at the start of the caret's line, or of every selected line; when they all have
   * one already, the boxes go (so it toggles). With the caret never placed, a new checklist line at
   * the end.
   */
  const toggleChecklist = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const chars = domChars(el);
    const range = selectionInside(el) ? getSelectionVisibleRange(el) : null;
    if (!range) {
      const added = plainChars(chars.length === 0 ? '[ ] ' : '\n[ ] ');
      commitEdit(writeChars([...chars, ...added]), chars.length + added.length);
      return;
    }
    const start = Math.min(range.start, chars.length);
    const end = Math.min(Math.max(range.end, start), chars.length);
    const edit = toggleChecklistLines(chars, linesInSelection(chars, start, end));
    commitEdit(writeChars(edit.chars), edit.shift(start), edit.shift(end));
  }, [commitEdit]);

  // A click on a checklist box ticks or unticks it (one undo step); the caret goes just after it
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = editorRef.current;
    const box = (e.target as HTMLElement).closest('[data-check]');
    if (!el || !box || !el.contains(box) || !box.parentNode) return;
    e.preventDefault();
    const at = getVisibleOffset(el, box.parentNode, Array.from(box.parentNode.childNodes).indexOf(box as ChildNode));
    const chars = domChars(el);
    if (!chars[at + 1]) return;
    chars[at + 1] = { ...chars[at + 1], ch: chars[at + 1].ch === ' ' ? 'x' : ' ' };
    commitEdit(writeChars(chars), at + 4);
  }, [commitEdit]);

  const insertBullet = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;

    // If the caret isn't in the editor (e.g. it was never clicked), add the bullet at the end
    const chars = domChars(el);
    const pos = selectionInside(el) ? Math.min(saveCursor(el), chars.length) : chars.length;
    const atLineStart = pos === 0 || chars[pos - 1].ch === '\n';
    const inserted = plainChars(atLineStart ? '• ' : '\n• ');
    commitEdit(writeChars([...chars.slice(0, pos), ...inserted, ...chars.slice(pos)]), pos + inserted.length);
  }, [commitEdit]);

  /**
   * Bold / italic / strikethrough on the selected characters: turned off if every
   * selected character already has it, otherwise on. Works on any part of the
   * text, including half of an already formatted word.
   */
  const applyFormatToggle = useCallback((marker: string) => {
    const el = editorRef.current;
    if (!el) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    // Ignore selections elsewhere on the page (e.g. text in a card)
    if (!selectionInside(el)) return;

    const range = getSelectionVisibleRange(el);
    if (!range || range.start === range.end) return;

    const chars = domChars(el);
    const start = Math.min(range.start, chars.length);
    const end = Math.min(range.end, chars.length);
    const attr = marker === '**' ? 'b' : marker === '*' ? 'i' : 's';
    commitEdit(writeChars(toggleStyle(chars, start, end, attr)), start, end);
  }, [commitEdit]);

  applyFormatToggleRef.current = applyFormatToggle;

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    // Normalize Windows/old-Mac line breaks so no stray \r ends up in the text
    const text = e.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n');
    const el = editorRef.current;
    if (!el) return;

    // Replace the selected text (if any); otherwise insert at the caret.
    // Pasted text is plain: any * or ~ in it stays a literal character.
    const chars = domChars(el);
    const range = selectionInside(el) ? getSelectionVisibleRange(el) : null;
    const start = Math.min(range?.start ?? chars.length, chars.length);
    const end = Math.min(Math.max(range?.end ?? start, start), chars.length);
    commitEdit(writeChars([...chars.slice(0, start), ...plainChars(text), ...chars.slice(end)]), start + text.length);
  }, [commitEdit]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 flex-wrap">
        <Button
          type="button"
          variant={autoBullet ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoBullet(!autoBullet)}
          className="h-7 px-2 text-xs gap-1"
          title="Toggle auto-bullet on Enter"
        >
          <List size={14} />
          Auto •
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertBullet}
          className="h-7 px-2 text-xs"
          title="Insert bullet point"
        >
          • Add
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          // Keep the editor's selection, so the button can be pressed again and again
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => shiftLines(false)}
          className="h-7 px-2 text-xs gap-1"
          title="Indent the line (6 spaces)"
          aria-label="Indent the line (6 spaces)"
        >
          <IndentIncrease size={14} />
          Tab
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          // Shift+Tab as a button: phone keyboards have no Tab key. Keeps the selection like Tab.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => shiftLines(true)}
          className="h-7 px-2 text-xs gap-1"
          title="Move the line back out (6 spaces)"
          aria-label="Move the line back out (6 spaces)"
        >
          <IndentDecrease size={14} />
          Tab
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          // Keep the editor's selection, so the button can be pressed on the selected lines
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleChecklist}
          className="h-7 px-2 text-xs gap-1"
          title="Checklist: a box at the start of the line"
          aria-label="Checklist: a box at the start of the line"
        >
          <ListChecks size={14} />
          Check
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyFormatToggle('~~')}
          className="h-7 px-2 text-xs gap-1"
          title="Strikethrough: ~~text~~"
        >
          <Strikethrough size={14} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyFormatToggle('**')}
          className="h-7 px-2 text-xs gap-1"
          title="Bold: **text**"
        >
          <Bold size={14} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyFormatToggle('*')}
          className="h-7 px-2 text-xs gap-1"
          title="Italic: *text*"
        >
          <Italic size={14} />
        </Button>
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onClick={handleEditorClick}
          aria-describedby={tabMoves ? tabHintId : undefined}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className={cn(
            // Phones: 16px text, or an iPhone zooms the page in when the box is tapped (and a zoomed page
            // pans instead of letting the selection handles move), and room to grow to half the screen,
            // so a selection over several lines doesn't hit the box's edge as soon. Computers: 14px, 240px.
            "min-h-[80px] max-h-[50svh] sm:max-h-[240px] overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
            className
          )}
          suppressContentEditableWarning
        />
      </div>
      {tabMoves && (
        <p id={tabHintId} role="status" className="text-xs text-muted-foreground">
          Tab moves to the next field. Press Ctrl+M to indent with Tab again.
        </p>
      )}
    </div>
  );
};
