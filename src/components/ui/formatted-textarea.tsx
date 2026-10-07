import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { List, Strikethrough, Bold, Italic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseChars, plainChars, toggleStyle, toSegments, writeChars, type StyledChar } from '@/lib/inlineFormat';

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Stored text (with **bold**, *italic*, ~~strike~~ markers) -> editor HTML.
 * Parsing is shared with the cards (src/lib/inlineFormat.ts) so both always agree.
 */
const toHTML = (text: string): string => {
  if (!text) return '';
  const chars = parseChars(text);
  let html = toSegments(chars)
    .map((seg) => {
      let h = escapeHtml(seg.text).replace(/\n/g, '<br>');
      if (seg.i) h = `<em class="italic">${h}</em>`;
      if (seg.b) h = `<strong class="font-bold">${h}</strong>`;
      if (seg.s) h = `<s class="line-through opacity-60">${h}</s>`;
      return h;
    })
    .join('');
  // A trailing line break is invisible in contentEditable; add an extra one so the caret can land there
  if (chars.length > 0 && chars[chars.length - 1].ch === '\n') html += '<br>';
  return html;
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
 * Count caret position as the number of characters/<br>s in the rendered DOM
 * up to the caret. This mirrors restoreCursor's traversal so save→restore is symmetric.
 */
const measureDomOffset = (root: Node): number => {
  let count = 0;
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      count += (node.textContent || '').length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      if (tag === 'br') {
        count += 1;
      } else {
        node.childNodes.forEach(walk);
      }
    }
  };
  root.childNodes.forEach(walk);
  return count;
};

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

  let currentPos = 0;
  let lastBreakNode: Node | null = null;
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || '').length;
      if (pos <= currentPos + len) {
        setCaretAt(sel, node, Math.max(0, pos - currentPos));
        return true;
      }
      currentPos += len;
      return false;
    }

    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'br') {
      lastBreakNode = node;
      if (pos === currentPos) {
        setCaretBeforeNode(sel, node);
        return true;
      }

      currentPos += 1;
      if (pos === currentPos) {
        setCaretAfterNode(sel, node);
        return true;
      }

      return false;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of Array.from(node.childNodes)) {
        if (walk(child)) return true;
      }
    }

    return false;
  };

  if (walk(el)) return;

  if (pos === currentPos && lastBreakNode) {
    setCaretAfterNode(sel, lastBreakNode);
    return;
  }

  setCaretAt(sel, el, el.childNodes.length);
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
    el.innerHTML = toHTML(entry.value);
    // Measure the maximum caret offset in the newly-rendered DOM so we can
    // clamp any override without walking past the end.
    const maxOffset = measureDomOffset(el);
    const target = cursorOverride != null
      ? Math.min(Math.max(0, cursorOverride), maxOffset)
      : entry.cursor;
    restoreCursor(el, target);
    el.focus();
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
      restoreCursor(el, pos);
      // External value replaced the editor contents (e.g. editing a different
      // item) — reset undo history so we don't rewind into unrelated state.
      flushPendingSnapshot();
      historyRef.current = [{ value, cursor: pos }];
      historyIndexRef.current = 0;
    }
  }, [value, flushPendingSnapshot]);

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
      el.innerHTML = toHTML(newValue);
      el.focus();
      restoreSelection(el, selStart, selEnd);
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
      if (el.innerHTML !== html) {
        el.innerHTML = html;
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Undo / Redo — intercept before the browser's native (broken) undo runs.
    const mod = e.ctrlKey || e.metaKey;
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

      if (autoBullet) {
        const lineStart = lineStartOf(before);
        const currentLine = before.slice(lineStart).map((c) => c.ch).join('');

        if (currentLine.trim() === '•') {
          // Enter on an empty bullet ends the list: drop the bullet, keep a plain new line
          const kept = lineStart === 0 ? plainChars('\n') : before.slice(0, lineStart);
          commitEdit(writeChars([...kept, ...after]), kept.length);
          return;
        }

        // New bullet line; the caret goes after the "• " so typing lands in the bullet
        commitEdit(writeChars([...before, ...plainChars('\n• '), ...after]), before.length + 3);
        return;
      }

      // Normal enter: caret at the start of the new line
      commitEdit(writeChars([...before, ...plainChars('\n'), ...after]), before.length + 1);
    }
  }, [autoBullet, commitEdit, performRedo, performUndo]);

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
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className={cn(
            "min-h-[80px] max-h-[240px] overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
            className
          )}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};
