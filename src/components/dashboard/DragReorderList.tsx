import { useState, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { REORDER_INDEX_ATTR, isCoarsePointer, useTouchReorder } from '@/hooks/useTouchReorder';

interface DragReorderListProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** New order of the list, and the id of the item that was dragged */
  onReorder: (orderedIds: string[], movedId: string) => void;
  className?: string;
}

export function DragReorderList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  className,
}: DragReorderListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (fromIndex: number, toIndex: number) => {
    setDragIndex(null);
    setOverIndex(null);
    if (fromIndex === toIndex) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next.map(getId), getId(moved));
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null) {
      setOverIndex(null);
      return;
    }
    move(dragIndex, toIndex);
  };

  // Phones: press and hold a card to pick it up, then drag (mouse dragging below)
  const touchRef = useTouchReorder<HTMLDivElement>({
    onPickUp: (i) => setDragIndex(i),
    onOver: (i) => setOverIndex(i),
    onDrop: move,
    onCancel: () => {
      setDragIndex(null);
      setOverIndex(null);
    },
  });
  // A native drag on a touch screen would fight the press-and-hold drag
  const mouseDraggable = !isCoarsePointer();

  return (
    <div ref={touchRef} className={className ?? 'space-y-3'}>
      {items.map((item, idx) => (
        <div
          key={getId(item)}
          {...{ [REORDER_INDEX_ATTR]: idx }}
          draggable={mouseDraggable}
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIndex(idx);
          }}
          onDragLeave={() => setOverIndex((o) => (o === idx ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(idx);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={`relative group transition-all [-webkit-touch-callout:none] [@media(pointer:coarse)]:select-none ${
            dragIndex === idx ? 'opacity-50 scale-[0.98]' : ''
          } ${overIndex === idx && dragIndex !== idx ? 'ring-2 ring-pink-300 rounded-lg' : ''}`}
        >
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 opacity-40 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground bg-background/80 rounded p-0.5 pointer-events-none">
            <GripVertical size={14} />
          </div>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
