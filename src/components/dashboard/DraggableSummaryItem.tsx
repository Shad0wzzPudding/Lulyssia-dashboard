import { REORDER_INDEX_ATTR, isCoarsePointer } from "@/hooks/useTouchReorder";

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
  /** This tile is the one being moved */
  isPicked: boolean;
  dragOverIndex: number | null;
}

/**
 * One of Home's count tiles. Mouse: drag and drop. Touch: press and hold, then drag
 * (handled for the whole row by useTouchReorder in HomePage).
 */
export const DraggableSummaryItem = ({
  value,
  label,
  colorClass,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isPicked,
  dragOverIndex,
}: DraggableSummaryItemProps) => (
  <div
    {...{ [REORDER_INDEX_ATTR]: index }}
    draggable={!isCoarsePointer()}
    onDragStart={() => onDragStart(index)}
    onDragOver={(e) => {
      e.preventDefault();
      onDragOver(index);
    }}
    onDragEnd={onDragEnd}
    className={`text-center p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 select-none [-webkit-touch-callout:none]
      ${isDragging && dragOverIndex === index && !isPicked ? 'scale-105 ring-2 ring-blue-400' : ''}
      ${isPicked ? 'opacity-70 scale-95 ring-2 ring-primary' : ''}
      bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80
    `}
  >
    <div className={`text-2xl font-bold ${colorClass}`}>
      {value}
    </div>
    <div className={`text-sm ${colorClass}`}>{label}</div>
  </div>
);
