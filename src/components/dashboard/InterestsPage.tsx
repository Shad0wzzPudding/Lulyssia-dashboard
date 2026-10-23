import { useState, useMemo, useEffect } from 'react';
import { Interest } from '@/lib/types';
import type { DeleteTarget, ReorderArgs } from '@/hooks/useDashboardData';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { FormattedText } from '@/components/ui/formatted-text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Pin, PinOff, Clock, Copy, CheckSquare, Heart } from 'lucide-react';
import { PageIcon } from './PageIcon';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';
import { SelectModeOverlay } from './SelectionCorners';
import { cardSurface } from '@/lib/selectMode';
import { playSuccessSound, playCancelSound, playDeleteSound, playDuplicateSound, playPinSound, playUnpinSound, playUpdateSound, playEditSound, playSelectModeSound, playAddSound } from '@/lib/sounds';
import { TagPicker, TagChip } from './TagPicker';
import { AttachmentsField, AttachmentsChips, AttachmentsImages } from './AttachmentsField';
import { SortAndFilterBar } from './SortAndFilterBar';
import { type SortOption, sortItems, filterByTags, searchItems } from '@/lib/sortAndFilter';
import { useSortPreference } from '@/hooks/useSortPreference';
import { useTags } from '@/hooks/useTags';
import { DragReorderList } from './DragReorderList';

interface InterestsPageProps {
  interests: Interest[];
  onCreateInterest: (data: Omit<Interest, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }) => void;
  onUpdateInterest: (data: Partial<Interest> & { id: string; __silent?: boolean }) => void;
  onReorder: (args: ReorderArgs) => void;
  onDeleteInterest: (target: DeleteTarget) => void;
}

export const InterestsPage = ({ 
  interests, 
  onCreateInterest, 
  onUpdateInterest, 
  onReorder,
  onDeleteInterest 
}: InterestsPageProps) => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // A file still uploading: saving waits, or the item would be saved without it
  const [uploading, setUploading] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    is_pinned: false,
    sort_order: 0,
    tag_ids: [] as string[],
    attachments: [] as import('@/lib/types').Attachment[],
  });
  const [sort, setSort] = useSortPreference('interests');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { tags } = useTags();
  const tagsById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  const { selectedIds, selectedCount, isSelecting, toggle, selectAll, keepOnly, clearSelection, enterSelectMode, isSelected } = useMultiSelect<Interest>();

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      is_pinned: false,
      sort_order: 0,
      tag_ids: [],
      attachments: [],
    });
    setEditingInterest(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    
    const submissionData = {
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
    };

    if (editingInterest) {
      // The form's place in "User sort" and "Pin" are as they were when it opened: the place is
      // never saved from here, and Pin only when it was changed in the form, so a drag or an
      // unpin made elsewhere (another tab, Home) while the form was open isn't undone
      const { sort_order: _order, is_pinned, ...rest } = submissionData;
      onUpdateInterest({
        id: editingInterest.id,
        ...rest,
        ...(is_pinned !== editingInterest.is_pinned ? { is_pinned } : {}),
      });
      playUpdateSound();
    } else {
      onCreateInterest(submissionData);
      playSuccessSound();
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (interest: Interest) => {
    playEditSound();
    setEditingInterest(interest);
    setFormData({
      title: interest.title,
      description: interest.description || '',
      deadline: interest.deadline ? format(parseISO(interest.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      is_pinned: interest.is_pinned,
      sort_order: interest.sort_order,
      tag_ids: interest.tag_ids || [],
      attachments: interest.attachments || [],
    });
    setIsCreateOpen(true);
  };

  const handlePin = (interest: Interest) => {
    if (interest.is_pinned) {
      playUnpinSound();
    } else {
      playPinSound();
    }
    onUpdateInterest({
      id: interest.id,
      is_pinned: !interest.is_pinned
    });
  };

  const handleCopy = (interest: Interest) => {
    onCreateInterest({
      title: interest.title,
      description: interest.description,
      deadline: interest.deadline,
      is_pinned: false,
      sort_order: 0,
      tag_ids: interest.tag_ids || [],
      attachments: interest.attachments || [],
      __duplicate: true,
    });
    playDuplicateSound();
  };

  // Batch actions
  const handleBatchCopy = () => {
    // Each copy goes above the one made before it, so copy from the last to the first: the copies
    // keep the originals' order in "User sort" instead of coming out reversed
    const selected = sortItems(interests.filter(i => selectedIds.has(i.id)), 'user').reverse();
    selected.forEach((interest, idx) => {
      onCreateInterest({
        title: interest.title,
        description: interest.description,
        deadline: interest.deadline,
        is_pinned: false,
        sort_order: 0,
        tag_ids: interest.tag_ids || [],
        attachments: interest.attachments || [],
        __duplicate: true,
        __silent: idx !== selected.length - 1,
      });
    });
    playDuplicateSound();
    clearSelection();
  };

  const handleBatchDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    // Silent: the summary toast below replaces one toast per item
    selectedIds.forEach(id => onDeleteInterest({ id, __silent: true }));
    playDeleteSound();
    toast({ title: `${selectedCount} interest(s) deleted` });
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleBatchPin = () => {
    const selected = interests.filter(i => selectedIds.has(i.id) && !i.is_pinned);
    selected.forEach(interest => {
      onUpdateInterest({ id: interest.id, is_pinned: true, __silent: true });
    });
    playPinSound();
    toast({ title: `${selected.length} interest(s) pinned` });
    clearSelection();
  };

  const handleBatchUnpin = () => {
    const selected = interests.filter(i => selectedIds.has(i.id) && i.is_pinned);
    selected.forEach(interest => {
      onUpdateInterest({ id: interest.id, is_pinned: false, __silent: true });
    });
    playUnpinSound();
    toast({ title: `${selected.length} interest(s) unpinned` });
    clearSelection();
  };

  const handleCardClick = (interest: Interest) => {
    if (isSelecting) {
      toggle(interest.id);
    }
  };

  const visibleInterests = useMemo(
    () => sortItems(searchItems(filterByTags(interests, filterTagIds), search), sort, tagsById),
    [interests, filterTagIds, search, sort, tagsById]
  );
  // A search or tag filter that hides picked items also unpicks them
  useEffect(() => {
    keepOnly(visibleInterests);
  }, [visibleInterests, keepOnly]);
  const pinnedInterests = visibleInterests.filter(i => i.is_pinned);
  const unpinnedInterests = visibleInterests.filter(i => !i.is_pinned);

  const handleUserReorder = (orderedIds: string[], movedId: string) => {
    onReorder({ table: 'interests', orderedIds, movedId });
  };

  const renderPinnedCard = (interest: Interest) => (
    <Card
      key={interest.id}
      className={`bg-main-focus/20 border-main-focus/40 transition-all relative overflow-visible flex flex-col h-full min-h-[200px] ${
        cardSurface(isSelecting, isSelected(interest.id))
      } ${isSelected(interest.id) ? 'ring-2 ring-main-focus shadow-lg' : ''}`}
      onClick={() => handleCardClick(interest)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {isSelecting && (
              <Checkbox
                checked={isSelected(interest.id)}
                onCheckedChange={() => toggle(interest.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <CardTitle className="min-w-0 text-lg text-main-focus [overflow-wrap:anywhere]">{interest.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="bg-main-focus/20 text-main-focus">
              <Pin size={12} />
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {interest.description && (
          <p className="w-full text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}><FormattedText>{interest.description}</FormattedText></p>
        )}
        <AttachmentsImages attachments={interest.attachments} />
        <AttachmentsChips attachments={interest.attachments} />
        {interest.deadline && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock size={12} />
            {format(parseISO(interest.deadline), 'MMM dd, yyyy HH:mm')}
          </div>
        )}
        {interest.tag_ids && interest.tag_ids.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interest.tag_ids.map(id => tagsById[id] && (
              <TagChip key={id} tag={tagsById[id]} />
            ))}
          </div>
        )}
        {!isSelecting && (
          <div data-card-actions className="flex items-center gap-2 pt-2 mt-auto">
            <Button size="sm" variant="outline" onClick={() => handlePin(interest)} aria-label={interest.is_pinned ? 'Unpin from Main Focus' : 'Pin to Main Focus'} title={interest.is_pinned ? 'Unpin' : 'Pin'}>
              <PinOff size={12} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleCopy(interest)} aria-label="Copy interest" title="Copy">
              <Copy size={12} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleEdit(interest)} aria-label="Edit interest" title="Edit">
              <Edit size={12} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { playDeleteSound(); onDeleteInterest(interest.id); }}
              aria-label="Delete interest"
              title="Delete"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderUnpinnedCard = (interest: Interest) => (
    <Card
      key={interest.id}
      className={`hover:shadow-md transition-all relative overflow-visible flex flex-col h-full min-h-[200px] ${
        cardSurface(isSelecting, isSelected(interest.id))
      } ${isSelected(interest.id) ? 'ring-2 ring-main-focus shadow-lg' : ''}`}
      onClick={() => handleCardClick(interest)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {isSelecting && (
              <Checkbox
                checked={isSelected(interest.id)}
                onCheckedChange={() => toggle(interest.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <CardTitle className="min-w-0 text-lg [overflow-wrap:anywhere]">{interest.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {interest.description && (
          <p className="w-full text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}><FormattedText>{interest.description}</FormattedText></p>
        )}
        <AttachmentsImages attachments={interest.attachments} />
        <AttachmentsChips attachments={interest.attachments} />
        {interest.deadline && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock size={12} />
            {format(parseISO(interest.deadline), 'MMM dd, yyyy HH:mm')}
          </div>
        )}
        {interest.tag_ids && interest.tag_ids.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interest.tag_ids.map(id => tagsById[id] && (
              <TagChip key={id} tag={tagsById[id]} />
            ))}
          </div>
        )}
        {!isSelecting && (
          <div data-card-actions className="flex items-center gap-2 pt-2 mt-auto">
            <Button size="sm" variant="outline" onClick={() => handlePin(interest)} aria-label={interest.is_pinned ? 'Unpin from Main Focus' : 'Pin to Main Focus'} title={interest.is_pinned ? 'Unpin' : 'Pin'}>
              <Pin size={12} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleCopy(interest)} aria-label="Copy interest" title="Copy">
              <Copy size={12} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleEdit(interest)} aria-label="Edit interest" title="Edit">
              <Edit size={12} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { playDeleteSound(); onDeleteInterest(interest.id); }}
              aria-label="Delete interest"
              title="Delete"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Check if any selected interests are pinned/unpinned (for showing pin/unpin actions)
  const hasSelectedPinned = interests.some(i => selectedIds.has(i.id) && i.is_pinned);
  const hasSelectedUnpinned = interests.some(i => selectedIds.has(i.id) && !i.is_pinned);

  return (
    <div className="space-y-6 animate-fade-in">
      <SelectModeOverlay visible={isSelecting} onExit={clearSelection} />
      <LulyssiaConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmBatchDelete}
        title={`Delete ${selectedCount} interest(s)?`}
        description="This will permanently delete the selected interests."
        confirmText="Yes, delete them!"
        cancelText="Wait, no!"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <PageIcon icon={Heart} />
          <h2 className="p5-title w-fit text-2xl">
            My Interests
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isSelecting && interests.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { playSelectModeSound(); enterSelectMode(); }}
            >
              <CheckSquare size={14} className="mr-2" />
              Select
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open && isCreateOpen) playCancelSound(); setIsCreateOpen(open); }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { playAddSound(); resetForm(); }}
                className="bg-main-focus hover:bg-main-focus/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Interest
              </Button>
            </DialogTrigger>
            <ResizableDialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingInterest ? 'Edit Interest' : 'Create New Interest'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Interest title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
                <FormattedTextarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                />
                <Input
                  type="datetime-local"
                  placeholder="Deadline (optional)"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
                <div>
                  <label className="text-sm font-medium mb-1 block">Tags</label>
                  <TagPicker
                    selected={formData.tag_ids}
                    onChange={(ids) => setFormData(prev => ({ ...prev, tag_ids: ids }))}
                  />
                </div>
                <AttachmentsField
                  value={formData.attachments}
                  onChange={(atts) => setFormData(prev => ({ ...prev, attachments: atts }))}
                  onUploadingChange={setUploading}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="is_pinned" className="text-sm">Pin to main focus</label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? 'Uploading file…' : editingInterest ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { playCancelSound(); setIsCreateOpen(false); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </ResizableDialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pinned Interests */}
      {interests.length > 0 && (
        <SortAndFilterBar
          sort={sort}
          onSortChange={setSort}
          filterTagIds={filterTagIds}
          onFilterChange={setFilterTagIds}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search interests…"
        />
      )}
      <>
      {pinnedInterests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-main-focus mb-3 flex items-center gap-2">
            <Pin size={16} />
            Pinned ({pinnedInterests.length}){sort === 'user' ? ' — drag to arrange' : ''}
          </h3>
          {sort === 'user' ? (
            <DragReorderList
              items={pinnedInterests}
              getId={(i) => i.id}
              onReorder={handleUserReorder}
              renderItem={(interest) => renderPinnedCard(interest)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pinnedInterests.map((interest) => renderPinnedCard(interest))}
            </div>
          )}
        </div>
      )}

      {/* Unpinned Interests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-3">
          All Interests ({unpinnedInterests.length}){sort === 'user' ? ' — drag to arrange' : ''}
        </h3>
        {sort === 'user' ? (
          <DragReorderList
            items={unpinnedInterests}
            getId={(i) => i.id}
            onReorder={handleUserReorder}
            renderItem={(interest) => renderUnpinnedCard(interest)}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unpinnedInterests.map((interest) => renderUnpinnedCard(interest))}
          </div>
        )}
      </div>
      </>

      {interests.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No interests yet! Add your first interest to get started.</p>
            <Button onClick={() => { playAddSound(); resetForm(); setIsCreateOpen(true); }}>
              <Plus size={16} className="mr-2" />
              Add Your First Interest
            </Button>
          </CardContent>
        </Card>
      )}

      <MultiSelectActionBar
        selectedCount={selectedCount}
        onCopy={handleBatchCopy}
        onDelete={handleBatchDelete}
        onPin={hasSelectedUnpinned ? handleBatchPin : undefined}
        onUnpin={hasSelectedPinned ? handleBatchUnpin : undefined}
        onSelectAll={() => selectAll(visibleInterests)}
        totalCount={interests.length}
      />
    </div>
  );
};
