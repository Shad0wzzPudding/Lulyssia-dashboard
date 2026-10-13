import { useSyncExternalStore } from 'react';

/** Every sound the app plays, as Settings lists them (sounds.ts plays each one under its id). */
export const SOUND_GROUPS = [
  {
    name: 'Items',
    sounds: [
      { id: 'add', name: 'Add', when: 'Opening the form for a new task, event or interest' },
      { id: 'create', name: 'Create', when: 'Saving something new, applying a sort' },
      { id: 'edit', name: 'Edit', when: 'Opening an edit form' },
      { id: 'update', name: 'Save changes', when: 'Saving an edit, unticking a task' },
      { id: 'complete', name: 'Tick done', when: 'Ticking a task or daily task' },
      { id: 'duplicate', name: 'Copy', when: 'Copying an item' },
      { id: 'delete', name: 'Delete', when: 'Deleting, undoing a change' },
      { id: 'pin', name: 'Pin', when: 'Pinning an interest to Main Focus' },
      { id: 'unpin', name: 'Unpin', when: 'Unpinning an interest' },
      { id: 'cancel', name: 'Cancel', when: 'Closing a form without saving' },
      { id: 'collapse', name: 'Fold', when: 'Folding a section' },
      { id: 'expand', name: 'Unfold', when: 'Unfolding a section' },
      { id: 'selectOn', name: 'Select mode on', when: 'Starting to pick several items' },
      { id: 'selectOff', name: 'Select mode off', when: 'Leaving select mode' },
    ],
  },
  {
    name: 'Menus & pages',
    sounds: [
      { id: 'menuOpen', name: 'Message menu opens', when: 'The round button in the corner' },
      { id: 'menuClose', name: 'Message menu closes', when: 'Closing it without picking a page' },
      { id: 'cursor', name: 'Cursor moves', when: 'Moving between choices in a menu' },
      { id: 'pick', name: 'Choice picked', when: 'Picking a page from a menu' },
      { id: 'drawerOpen', name: 'Drawer opens', when: 'The side drawer' },
      { id: 'drawerClose', name: 'Drawer closes', when: 'Closing the side drawer' },
      { id: 'train', name: 'Page change', when: 'The train crowd when switching pages' },
    ],
  },
  {
    name: 'Lulyssia',
    sounds: [
      { id: 'cutIn', name: 'Skill cut-in', when: 'Back to top, with her skill' },
      { id: 'ask', name: 'Lulyssia asks', when: 'Her questions before something big' },
      { id: 'agree', name: 'Agree', when: 'Saying yes to her question' },
    ],
  },
] as const;

export type SoundId = (typeof SOUND_GROUPS)[number]['sounds'][number]['id'];

/** One sound's setting: on or off, and its volume in percent of how loud it plays by default. */
export interface SoundSetting {
  on: boolean;
  volume: number;
}

export interface SoundSettings {
  /** All sounds: the master switch and volume */
  on: boolean;
  volume: number;
  /** Only the sounds that were changed; the rest are on at 100% */
  sounds: Partial<Record<SoundId, SoundSetting>>;
}

const STORAGE_KEY = 'soundSettings';
const DEFAULT_SOUND: SoundSetting = { on: true, volume: 100 };
const defaults = (): SoundSettings => ({ on: true, volume: 100, sounds: {} });

const clampVolume = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 100);

// Saved per device in this browser, like the Animating menu settings
const read = (): SoundSettings => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object') return defaults();
    const sounds: SoundSettings['sounds'] = {};
    for (const [id, s] of Object.entries(stored.sounds ?? {})) {
      const setting = s as Partial<SoundSetting>;
      sounds[id as SoundId] = { on: setting.on !== false, volume: clampVolume(setting.volume) };
    }
    return { on: stored.on !== false, volume: clampVolume(stored.volume), sounds };
  } catch {
    return defaults();
  }
};

// Read once and kept, so every sound doesn't parse storage (and React gets a stable snapshot)
let current: SoundSettings | null = null;
const listeners = new Set<() => void>();

export const getSoundSettings = () => (current ??= read());

const save = (next: SoundSettings) => {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* storage unavailable: the change still applies until reload */ }
  listeners.forEach((listener) => listener());
};

export const soundSetting = (id: SoundId): SoundSetting => getSoundSettings().sounds[id] ?? DEFAULT_SOUND;

/** How loud a sound plays now, 0 (silent) to 1 (as designed): its own volume times the master. */
export const soundLevel = (id: SoundId) => {
  const settings = getSoundSettings();
  const sound = soundSetting(id);
  if (!settings.on || !sound.on) return 0;
  return (settings.volume / 100) * (sound.volume / 100);
};

export const setMasterSound = (patch: Partial<Pick<SoundSettings, 'on' | 'volume'>>) =>
  save({ ...getSoundSettings(), ...patch });

export const setSound = (id: SoundId, patch: Partial<SoundSetting>) => {
  const settings = getSoundSettings();
  save({ ...settings, sounds: { ...settings.sounds, [id]: { ...soundSetting(id), ...patch } } });
};

export const resetSoundSettings = () => save(defaults());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const SERVER_SNAPSHOT = defaults();
/** The sound settings, updating the component when they change. */
export const useSoundSettings = () => useSyncExternalStore(subscribe, getSoundSettings, () => SERVER_SNAPSHOT);
