import { useRef, useState } from 'react';
import { GalleryHorizontalEnd, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Preset } from '@/lib/types';
import { usePresets } from '@/hooks/usePresets';
import { useTags } from '@/hooks/useTags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { playDeleteSound } from '@/lib/sounds';
import { presetDueLabel } from '@/lib/presets';
import { TagChip } from './TagPicker';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';
import { PresetFormDialog, type PresetFormHandle } from './PresetFormDialog';

/** Asks first with Lulyssia's usual question, then deletes the preset (with the delete sound) */
export const PresetDeleteDialog = ({ preset, onClose, onDeleted }: { preset: Preset | null; onClose: () => void; onDeleted?: (preset: Preset) => void }) => {
  const { deletePreset } = usePresets();
  return (
    <LulyssiaConfirmDialog
      open={!!preset}
      onOpenChange={(o) => !o && onClose()}
      title={preset ? `Delete the preset "${preset.name}"?` : ''}
      description="Tasks and events already made with it stay as they are."
      confirmText="Yes, delete it"
      cancelText="Cancel"
      onConfirm={() => {
        if (preset) {
          playDeleteSound();
          deletePreset.mutate(preset.id);
          onDeleted?.(preset);
        }
        onClose();
      }}
    />
  );
};

/** Settings' "Presets" card: every preset, most used first, to make, change and delete */
export const PresetManager = () => {
  const { presets, isLoading } = usePresets();
  const { tags } = useTags();
  const form = useRef<PresetFormHandle>(null);
  const [pendingDelete, setPendingDelete] = useState<Preset | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GalleryHorizontalEnd size={18} className="text-p5-600" />
          Presets
        </CardTitle>
        <CardDescription>
          Ready-made setups for a task or an event. Pick one with "Presets" in the form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button size="sm" onClick={() => form.current?.openNew()}>
          <Plus size={14} className="mr-1" />
          New preset
        </Button>
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading presets…</p>
          ) : presets.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No presets yet. Make one to fill a task or event in one tap.</p>
          ) : (
            presets.map((preset) => {
              const presetTags = preset.tag_ids.map((id) => tags.find((t) => t.id === id)).filter((t) => !!t);
              return (
                <div key={preset.id} className="relative flex items-center gap-2 rounded-lg border bg-card p-2 pl-4 overflow-hidden">
                  {/* A stripe in its first tag's colour (grey with no tag) */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ background: presetTags[0]?.color ?? '#94a3b8' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm [overflow-wrap:anywhere]">{preset.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {presetTags.map((t) => <TagChip key={t.id} tag={t} />)}
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {presetDueLabel(preset)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">used {preset.use_count}×</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => form.current?.openEdit(preset)} aria-label={`Edit preset ${preset.name}`} title="Edit">
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setPendingDelete(preset)} aria-label={`Delete preset ${preset.name}`} title="Delete">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
      <PresetFormDialog ref={form} />
      <PresetDeleteDialog preset={pendingDelete} onClose={() => setPendingDelete(null)} />
    </Card>
  );
};
