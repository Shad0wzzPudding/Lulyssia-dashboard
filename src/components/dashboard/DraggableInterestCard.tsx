import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, ChevronDown, ChevronUp, ChevronsRight, X, GripVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Interest } from "@/lib/types";
import { playUnpinSound } from "@/lib/sounds";
import { FormattedText } from '@/components/ui/formatted-text';

interface DraggableInterestCardProps {
  interest: Interest;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onUnpin: (interest: Interest) => void;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export const DraggableInterestCard = ({
  interest,
  isCollapsed,
  onToggleCollapse,
  onUnpin,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: DraggableInterestCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isHorizontalDragging, setIsHorizontalDragging] = useState(false);
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);
  const translateXRef = useRef(0);
  const startXRef = useRef(0);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 60; // Lowered for easier triggering

  const updateTranslateX = (value: number) => {
    translateXRef.current = value;
    setTranslateX(value);
  };

  // Swipe right to unpin, only from its handle (mouse or touch), so selecting text on the card
  // can't unpin it. The pointer is captured, so the swipe keeps going when it leaves the handle.
  const handleSwipeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    setIsHorizontalDragging(true);
  };

  const handleSwipeMove = (e: React.PointerEvent) => {
    if (!isHorizontalDragging) return;
    updateTranslateX(Math.max(0, Math.min(e.clientX - startXRef.current, 150)));
  };

  const handleSwipeUp = () => {
    if (!isHorizontalDragging) return;
    // Check ref for immediate value (React state may be stale)
    if (translateXRef.current > SWIPE_THRESHOLD) {
      // Play sound FIRST, before any state updates
      playUnpinSound();
      updateTranslateX(300);
      setIsHorizontalDragging(false);
      setTimeout(() => {
        onUnpin(interest);
      }, 200);
    } else {
      updateTranslateX(0);
      setIsHorizontalDragging(false);
    }
  };

  // Vertical drag for reordering (on drag handle)
  const handleDragHandleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsVerticalDragging(true);
    onDragStart(index);
  };

  const handleDragHandleTouchMove = (e: React.TouchEvent) => {
    if (!isVerticalDragging) return;
    
    const touchY = e.touches[0].clientY;
    const elements = document.querySelectorAll('[data-interest-item]');
    elements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        onDragOver(i);
      }
    });
  };

  const handleDragHandleTouchEnd = () => {
    setIsVerticalDragging(false);
    onDragEnd();
  };

  return (
    <div 
      data-interest-item
      className={`relative overflow-hidden rounded-lg transition-all duration-200 ${
        isDragging && dragOverIndex === index ? 'ring-2 ring-sky-400 scale-[1.02]' : ''
      } ${isVerticalDragging ? 'opacity-70 scale-[0.98]' : ''}`}
    >
      {/* Background action indicator for unpin */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 flex items-center pl-4 rounded-lg"
        style={{ opacity: Math.min(translateX / SWIPE_THRESHOLD, 1) }}
      >
        <div className="flex items-center gap-2 text-white font-medium">
          <X size={20} />
          <span>Unpin</span>
        </div>
      </div>

      {/* Card content */}
      <div
        className="relative bg-card/80 border border-main-focus/30 rounded-lg transition-transform select-text"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isHorizontalDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(index);
        }}
        onDragEnd={onDragEnd}
      >
        <Collapsible open={!isCollapsed}>
          <div className="p-3 flex items-start gap-2">
            {/* Drag handle */}
            <div
              ref={dragHandleRef}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
              onTouchStart={handleDragHandleTouchStart}
              onTouchMove={handleDragHandleTouchMove}
              onTouchEnd={handleDragHandleTouchEnd}
            >
              <GripVertical size={18} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0 [overflow-wrap:anywhere]">
                  {interest.title}
                </h4>
                {/* Swipe handle: pull right to unpin */}
                <div
                  role="button"
                  aria-label="Pull right to unpin"
                  title="Pull right to unpin"
                  className="ml-2 flex h-6 w-6 flex-shrink-0 cursor-grab touch-none select-none items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                  onPointerDown={handleSwipeDown}
                  onPointerMove={handleSwipeMove}
                  onPointerUp={handleSwipeUp}
                  onPointerCancel={handleSwipeUp}
                >
                  <ChevronsRight size={16} />
                </div>
                {interest.description && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse(interest.id);
                      }}
                      className="ml-2 h-6 w-6 p-0"
                      aria-label={isCollapsed ? 'Unfold' : 'Fold'}
                    >
                      {isCollapsed ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronUp size={16} />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>

              <CollapsibleContent>
                {interest.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                    <FormattedText>{interest.description}</FormattedText>
                  </p>
                )}
              </CollapsibleContent>

              {interest.deadline && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={12} />
                  {format(parseISO(interest.deadline), 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
        </Collapsible>
      </div>
    </div>
  );
};
