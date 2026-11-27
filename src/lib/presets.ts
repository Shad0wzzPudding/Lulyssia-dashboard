import type { Preset, PresetDueUnit } from '@/lib/types';

export const PRESET_NAME_MAX = 40;

const UNIT_WORDS: Record<PresetDueUnit, [string, string]> = {
  hours: ['hour', 'hours'],
  days: ['day', 'days'],
  weeks: ['week', 'weeks'],
};

/** "+3 days" ("+1 day"), or null with no due offset */
export const presetOffset = (preset: Pick<Preset, 'due_amount' | 'due_unit'>) => {
  if (!preset.due_amount || !preset.due_unit) return null;
  const [one, many] = UNIT_WORDS[preset.due_unit];
  return `+${preset.due_amount} ${preset.due_amount === 1 ? one : many}`;
};

/** "Due: start +3 days", or "No due date" */
export const presetDueLabel = (preset: Pick<Preset, 'due_amount' | 'due_unit'>) => {
  const offset = presetOffset(preset);
  return offset ? `Due: start ${offset}` : 'No due date';
};
