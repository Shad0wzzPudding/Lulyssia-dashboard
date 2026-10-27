import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * What Space does in the description editor with whole lines (or several lines) selected:
 * "quick" adds a space at the start of each line, "normal" replaces the selection as in other
 * editors. Saved to the account (user_preferences.prefs.editor.spaceIndent), so it's the same on
 * every device; anything missing or unknown means "quick".
 */
export type SpaceIndent = 'quick' | 'normal';

let spaceIndent: SpaceIndent = 'quick';
let loadStarted = false;
// Set once a choice is made here, so a slow load of the saved one can't replace it
let chosen = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readPrefs = async (userId: string) => {
  const { data } = await supabase
    .from('user_preferences')
    .select('prefs')
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.prefs ?? {}) as Record<string, unknown>;
};

// Read once per visit; every editor and the Settings card share the value
const load = async () => {
  if (loadStarted) return;
  loadStarted = true;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    loadStarted = false;
    return;
  }
  const editor = ((await readPrefs(user.id)).editor ?? {}) as Record<string, unknown>;
  if (chosen) return;
  spaceIndent = editor.spaceIndent === 'normal' ? 'normal' : 'quick';
  notify();
};

export function useSpaceIndent(): SpaceIndent {
  useEffect(() => {
    load();
  }, []);
  return useSyncExternalStore(subscribe, () => spaceIndent);
}

/** Change the choice: open editors follow at once, and it's saved to the account (other settings kept). */
export async function setSpaceIndent(next: SpaceIndent) {
  chosen = true;
  spaceIndent = next;
  notify();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const prefs = await readPrefs(user.id);
  const editor = (prefs.editor ?? {}) as Record<string, unknown>;
  prefs.editor = { ...editor, spaceIndent: next };
  await supabase
    .from('user_preferences')
    .upsert([{ user_id: user.id, prefs: prefs as never }], { onConflict: 'user_id' });
}
