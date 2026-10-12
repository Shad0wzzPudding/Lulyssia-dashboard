import { useState, useRef } from "react";

interface DraggableSummaryItemProps {
  id: string;
  value: number;
  label: string;
  colorClass: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export const DraggableSummaryItem = ({
  id,
  value,
  label,
  colorClass,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: DraggableSummaryItemProps) => {
  const [currentX, setCurrentX] = useState(0);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const touchDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchDraggingRef.current = true;
    setIsTouchDragging(true);
    onDragStart(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDraggingRef.current) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diff = touchX - startRef.current.x;
    const vertical = Math.abs(touchY - startRef.current.y);
    // Wait for a clear direction before deciding (a finger jitters a few pixels)
    if (vertical < 8 && Math.abs(diff) < 8) return;

    // A mostly up/down movement is a page scroll, not a drag: stop tracking it, so scrolling
    // past the tiles can't reorder them
    if (vertical > Math.abs(diff) && Math.abs(currentX) < 10) {
      touchDraggingRef.current = false;
      setIsTouchDragging(false);
      setCurrentX(0);
      onDragEnd();
      return;
    }
    setCurrentX(diff);

    // The tile under the finger (both directions: on a phone the tiles wrap into two rows)
    const elements = document.querySelectorAll('[data-summary-item]');
    elements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (touchX >= rect.left && touchX <= rect.right && touchY >= rect.top && touchY <= rect.bottom) {
        onDragOver(i);
      }
    });
  };

  const handleTouchEnd = () => {
    if (!touchDraggingRef.current) return;
    touchDraggingRef.current = false;
    setIsTouchDragging(false);
    setCurrentX(0);
    onDragEnd();
  };

  return (
    <div
      ref={itemRef}
      data-summary-item
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`text-center p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 select-none
        ${isDragging && dragOverIndex === index ? 'scale-105 ring-2 ring-blue-400' : ''}
        ${isTouchDragging ? 'opacity-80' : ''}
        bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80
      `}
      style={{
        transform: isTouchDragging ? `translateX(${currentX}px)` : undefined,
      }}
    >
      <div className={`text-2xl font-bold ${colorClass}`}>
        {value}
      </div>
      <div className={`text-sm ${colorClass}`}>{label}</div>
    </div>
  );
};
