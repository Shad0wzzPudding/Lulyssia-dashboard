import { useState, useCallback } from 'react';

export function useMultiSelect<T extends { id: string }>() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Auto-exit selection mode if nothing selected
      if (next.size === 0) {
        setIsSelecting(false);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(new Set(items.map(i => i.id)));
  }, []);

  // Drop picked items that are no longer shown (a search or tag filter hid them), so a batch
  // action never touches something off screen. Select mode stays on.
  const keepOnly = useCallback((items: T[]) => {
    const shown = new Set(items.map(i => i.id));
    setSelectedIds(prev => {
      const next = new Set([...prev].filter(id => shown.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  }, []);

  const enterSelectMode = useCallback(() => {
    setIsSelecting(true);
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelecting,
    toggle,
    selectAll,
    keepOnly,
    clearSelection,
    enterSelectMode,
    isSelected,
  };
}
