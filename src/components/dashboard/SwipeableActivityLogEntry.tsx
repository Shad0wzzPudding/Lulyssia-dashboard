import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Lock, Undo2 } from "lucide-react";
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
  const startYRef = useRef(0);

  const SWIPE_THRESHOLD = 80;
  // A locked entry only gives a little: it can't be swiped far enough to undo
  const LOCKED_GIVE = 28;
  const maxSwipe = locked ? LOCKED_GIVE : 150;

  const updateTranslateX = (value: number) => {
    translateXRef.current = value;
    setTranslateX(value);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startXRef.current - e.touches[0].clientX;
    // A mostly up/down movement is a page scroll, not a swipe: stop tracking it, so a
    // scroll that drifts sideways can't trigger the undo (which reverts the change)
    const vertical = Math.abs(startYRef.current - e.touches[0].clientY);
    if (vertical > Math.abs(diff) && translateXRef.current < 10) {
      setIsDragging(false);
      updateTranslateX(0);
      return;
    }
    // Only allow left swipe (negative translateX)
    if (diff > 0) {
      updateTranslateX(Math.min(diff, maxSwipe));
    }
  };

  // Let go: undo when swiped far enough, or explain when locked
  const release = () => {
    if (locked) {
      if (translateXRef.current > LOCKED_GIVE / 2) onLocked?.();
      updateTranslateX(0);
      setIsDragging(false);
      return true;
    }
    return false;
  };

  const handleTouchEnd = () => {
    if (release()) return;
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

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = startXRef.current - e.clientX;
    if (diff > 0) {
      updateTranslateX(Math.min(diff, maxSwipe));
    }
  };

  const handleMouseUp = () => {
    if (release()) return;
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

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      updateTranslateX(0);
    }
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
        className="relative flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 cursor-grab active:cursor-grabbing select-text"
        style={{
          transform: `translateX(-${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
          <span className="text-sm font-medium">{log.item_title}</span>
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
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {format(parseISO(log.created_at), "MMM dd, HH:mm")}
        </span>
      </div>
    </div>
  );
};
