import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { Preset, PresetDueUnit } from '@/lib/types';
import { usePresets, type PresetFields } from '@/hooks/usePresets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { playSuccessSound, playCancelSound, playUpdateSound, playEditSound } from '@/lib/sounds';
import { refuseSaveOffline } from '@/lib/formSave';
import { PRESET_NAME_MAX, presetOffset } from '@/lib/presets';
import { TagPicker } from './TagPicker';

/** Opens the preset form: empty for a new preset, or filled in to edit one */
export interface PresetFormHandle {
  openNew: () => void;
  openEdit: (preset: Preset) => void;
}

interface PresetFormDialogProps {
  /** After a save went through, with the preset as saved */
  onSaved?: (preset: Preset) => void;
}

type FormState = {
  name: string;
  description: string;
  tag_ids: string[];
  dueOn: boolean;
  // '' while the box is being retyped; saving makes it a whole number from 1 to 999
  dueAmount: number | '';
  dueUnit: PresetDueUnit;
};

const EMPTY: FormState = { name: '', description: '', tag_ids: [], dueOn: true, dueAmount: 1, dueUnit: 'days' };

/** The preset add/edit form, one for the whole app (Settings, and the preset cards in the forms) */
export const PresetFormDialog = forwardRef<PresetFormHandle, PresetFormDialogProps>(function PresetFormDialog(
  { onSaved },
  ref
) {
  const { createPreset, updatePreset } = usePresets();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Preset | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [nameErrorShown, setNameErrorShown] = useState(false);
  // A save sent and not answered yet: the form waits for it ("Saving…"). The number tells a late
  // answer apart from the form opened since (closing the form lets go of the save).
  const [saving, setSaving] = useState(false);
  const saveRun = useRef(0);
  const closeForm = () => {
    saveRun.current += 1;
    setSaving(false);
    setOpen(false);
  };

  useImperativeHandle(ref, () => ({
    openNew: () => {
      setEditing(null);
      setForm(EMPTY);
      setNameErrorShown(false);
      setOpen(true);
    },
    openEdit: (preset) => {
      playEditSound();
      setEditing(preset);
      setForm({
        name: preset.name,
        description: preset.description,
        tag_ids: preset.tag_ids,
        dueOn: !!preset.due_amount,
        dueAmount: preset.due_amount ?? 1,
        dueUnit: preset.due_unit ?? 'days',
      });
      setNameErrorShown(false);
      setOpen(true);
    },
  }));

  const amount = Math.min(999, Math.max(1, Math.round(Number(form.dueAmount)) || 1));
  const offset = presetOffset({ due_amount: amount, due_unit: form.dueUnit });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A second Create/Enter while the first is still saving: one preset
    if (saving) return;
    if (!form.name.trim()) {
      setNameErrorShown(true);
      return;
    }
    const button = editing ? 'Update' : 'Create';
    if (refuseSaveOffline(button)) return;
    const fields: PresetFields = {
      name: form.name.trim(),
      description: form.description,
      tag_ids: form.tag_ids,
      due_amount: form.dueOn ? amount : null,
      due_unit: form.dueOn ? form.dueUnit : null,
    };
    const run = ++saveRun.current;
    setSaving(true);
    const callbacks = {
      onSuccess: (preset: Preset) => {
        if (saveRun.current !== run) return;
        closeForm();
        onSaved?.(preset);
      },
      onError: () => {
        if (saveRun.current === run) setSaving(false);
      },
    };
    if (editing) {
      updatePreset.mutate({ id: editing.id, ...fields }, callbacks);
      playUpdateSound();
    } else {
      createPreset.mutate(fields, callbacks);
      playSuccessSound();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && open) { playCancelSound(); closeForm(); } }}>
      <ResizableDialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Preset' : 'New Preset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="preset-name" className="text-sm font-medium block">Name</label>
            <Input
              id="preset-name"
              placeholder="Preset name"
              value={form.name}
              maxLength={PRESET_NAME_MAX}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              aria-invalid={nameErrorShown && !form.name.trim()}
              aria-describedby={nameErrorShown && !form.name.trim() ? 'preset-name-error' : undefined}
              className="text-base md:text-sm"
            />
            {nameErrorShown && !form.name.trim() && (
              <p id="preset-name-error" role="alert" className="text-sm text-destructive">Give the preset a name.</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium block">Description format <span className="text-muted-foreground">(optional)</span></label>
            <FormattedTextarea
              placeholder="What a task or event made with it starts with"
              value={form.description}
              onChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tags <span className="text-muted-foreground">(optional)</span></label>
            <TagPicker selected={form.tag_ids} onChange={(ids) => setForm((prev) => ({ ...prev, tag_ids: ids }))} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
              <Switch checked={form.dueOn} onCheckedChange={(v) => setForm((prev) => ({ ...prev, dueOn: v }))} />
              Set the Deadline / End from the start
            </label>
            {form.dueOn && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Start +</span>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  step={1}
                  value={form.dueAmount}
                  aria-label="How many"
                  // The box may be empty while a new number is typed; saving makes it 1 to 999
                  onChange={(e) => setForm((prev) => ({ ...prev, dueAmount: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-20 h-9 text-base md:text-sm"
                />
                <Select value={form.dueUnit} onValueChange={(v) => setForm((prev) => ({ ...prev, dueUnit: v as PresetDueUnit }))}>
                  <SelectTrigger className="w-28 h-9 text-sm" aria-label="Unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {form.dueOn
                ? `Picking this preset sets the Deadline (task) or End (event) to the start ${offset?.replace('+', '+ ')}. With no start yet, the start becomes now.`
                : 'Picking this preset leaves the Deadline / End as it is.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { playCancelSound(); closeForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </ResizableDialogContent>
    </Dialog>
  );
});
