import type { Preset, PresetDueUnit, Tag } from '@/lib/types';

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

/** The preset's tags as they still exist (a deleted tag drops out) */
export const presetTags = (preset: Preset, tags: Tag[]) =>
  preset.tag_ids.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => !!t);

const luminance = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** Dark or white text, whichever reads better on the colour */
export const textOn = (hex: string) => {
  const l = luminance(hex);
  return (l + 0.05) / (0.0091 + 0.05) >= 1.05 / (l + 0.05) ? '#0b1418' : '#ffffff';
};

