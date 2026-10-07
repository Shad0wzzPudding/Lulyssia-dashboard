import { Button } from '@/components/ui/button';
import { Copy, Trash2, Pin, PinOff, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiSelectActionBarProps {
  selectedCount: number;
  onCopy: () => void;
  onDelete: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onSelectAll: () => void;
  totalCount: number;
}

export const MultiSelectActionBar = ({
  selectedCount,
  onCopy,
  onDelete,
  onPin,
  onUnpin,
  onSelectAll,
  totalCount,
}: MultiSelectActionBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          // Centered at the bottom (mx-auto, since framer-motion owns the transform).
          // Phones: sits above the corner buttons; wider screens: between them.
          // z-[65]: above the corner sticker and the open menu, below the page transition (z-[70]).
          // P5 panel: sharp corners, white border, hard cyan offset shadow (like the cards and menu).
          className="fixed inset-x-0 bottom-24 z-[65] mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 overflow-x-auto border-2 border-foreground/80 bg-card px-3 py-2.5 shadow-[5px_5px_0_0_hsl(var(--primary))] sm:bottom-6 sm:max-w-[calc(100vw-12rem)]"
        >
          {/* Count in a slanted cyan block, like the page titles */}
          <span className="shrink-0 -skew-x-12 bg-primary px-3 py-1">
            <span className="block skew-x-12 whitespace-nowrap font-['Kanit',sans-serif] text-sm font-extrabold uppercase italic text-primary-foreground">
              {selectedCount} selected
            </span>
          </span>

          <div className="h-6 w-0.5 shrink-0 -skew-x-12 bg-foreground/40" />

          <Button
            size="sm"
            variant="ghost"
            onClick={onSelectAll}
            className="text-xs"
            disabled={selectedCount === totalCount}
          >
            <CheckSquare size={14} className="mr-1" />
            All
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            className="text-xs"
          >
            <Copy size={14} className="mr-1" />
            Copy
          </Button>

          {onPin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onPin}
              className="text-xs text-upcoming-events hover:text-upcoming-events/80"
            >
              <Pin size={14} className="mr-1" />
              Pin
            </Button>
          )}

          {onUnpin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onUnpin}
              className="text-xs text-orange-500 hover:text-orange-600"
            >
              <PinOff size={14} className="mr-1" />
              Unpin
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-xs text-destructive hover:text-destructive"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
