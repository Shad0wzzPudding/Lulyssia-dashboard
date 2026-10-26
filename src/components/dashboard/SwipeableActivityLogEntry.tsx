import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronsLeft, Lock, Undo2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ActivityLog } from "@/lib/types";
import { playDeleteSound } from "@/lib/sounds";

interface SwipeableActivityLogEntryProps {
  log: ActivityLog;
  onDelete: (id: string) => void;
  /** A newer change to the same item exists: this one can't be undone yet */
  locked?: boolean;
  /** Swiped while locked (to explain why nothing happens) */
  onLocked?: () => void;
}

export const SwipeableActivityLogEntry = ({
  log,
  onDelete,
  locked = false,
  onLocked,
}: SwipeableActivityLogEntryProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const translateXRef = useRef(0);
  const startXRef = useRef(0);

  const SWIPE_THRESHOLD = 80;
  // A locked entry only gives a little: it can't be swiped far enough to undo
  const LOCKED_GIVE = 28;
  const maxSwipe = locked ? LOCKED_GIVE : 150;

  const updateTranslateX = (value: number) => {
    translateXRef.current = value;
    setTranslateX(value);
  };

  // Swiping starts only from the handle (mouse or touch), so selecting text on the entry can't
  // undo it. The pointer is captured, so the swipe keeps going when it leaves the handle.
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    // Only allow left swipe (negative translateX)
    updateTranslateX(Math.max(0, Math.min(startXRef.current - e.clientX, maxSwipe)));
  };

  // Let go: undo when swiped far enough, or explain when locked
  const handlePointerUp = () => {
    if (!isDragging) return;
    if (locked) {
      if (translateXRef.current > LOCKED_GIVE / 2) onLocked?.();
      updateTranslateX(0);
      setIsDragging(false);
      return;
    }
    if (translateXRef.current > SWIPE_THRESHOLD) {
      playDeleteSound();
      updateTranslateX(300);
      setIsDragging(false);
      setTimeout(() => onDelete(log.id), 200);
    } else {
      updateTranslateX(0);
      setIsDragging(false);
    }
  };

  // Keyboard (Enter or Space on the focused handle): the same as a full swipe
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (locked) {
      onLocked?.();
      return;
    }
    playDeleteSound();
    updateTranslateX(300);
    setTimeout(() => onDelete(log.id), 200);
  };

  return (
    <div className="relative overflow-hidden rounded">
      {/* Background action indicator - right side */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-3 rounded ${
          locked ? "bg-slate-500" : "bg-gradient-to-l from-red-500 to-red-400 pr-4"
        }`}
        style={{ opacity: Math.min(translateX / (locked ? LOCKED_GIVE : SWIPE_THRESHOLD), 1) }}
      >
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          {locked ? <Lock size={16} /> : <Undo2 size={16} />}
          {!locked && <span>Undo</span>}
        </div>
      </div>

      {/* Card content */}
      <div
        className="relative flex items-center justify-between gap-2 p-2 pr-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 select-text"
        style={{
          transform: `translateX(-${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant={
              log.action_type === "created"
                ? "default"
                : log.action_type === "updated"
                ? "secondary"
                : log.action_type === "reordered"
                ? "outline"
                : "destructive"
            }
            className="text-xs"
          >
            {log.action_type}
          </Badge>
          <span className="min-w-0 text-sm font-medium whitespace-pre-wrap [overflow-wrap:anywhere]">{log.item_title}</span>
          {locked && (
            <Lock
              size={12}
              className="shrink-0 text-gray-400"
              aria-label="Undo the newer change to this item first"
            />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({log.item_type})
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(parseISO(log.created_at), "MMM dd, HH:mm")}
          </span>
          {/* Swipe handle: pull left to undo */}
          <div
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={locked ? "Undo the newer change to this item first" : "Pull left to undo"}
            title={locked ? "Undo the newer change to this item first" : "Pull left to undo"}
            className="flex h-7 w-6 cursor-grab touch-none select-none items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing dark:hover:bg-gray-700 dark:hover:text-gray-200"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <ChevronsLeft size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};
