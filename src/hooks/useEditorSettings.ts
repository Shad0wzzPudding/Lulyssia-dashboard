import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

/**
 * What Space does in the description editor with whole lines (or several lines) selected:
 * "quick" adds a space at the start of each line, "normal" replaces the selection as in other
 * editors. Saved to the account (user_preferences.prefs.editor.spaceIndent), so it's the same on
 * every device; anything missing or unknown means "quick".
 */
export type SpaceIndent = 'quick' | 'normal';

let spaceIndent: SpaceIndent = 'quick';
// The account the value belongs to: signing out doesn't reload the page, so the next account on
// this browser must load its own
let loadedFor: string | null = null;
// Set once a choice is made here, so a slow load of the saved one can't replace it
let chosen = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readPrefs = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('prefs')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.prefs ?? {}) as Record<string, unknown>;
};

// Read once per account (each editor and the Settings card ask when they open, and share the value)
const load = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id === loadedFor) return;
  loadedFor = user.id;
  chosen = false;
  spaceIndent = 'quick';
  notify();
  let editor: Record<string, unknown>;
  try {
    editor = ((await readPrefs(user.id)).editor ?? {}) as Record<string, unknown>;
  } catch (error) {
    // Not read (e.g. offline): Quick space for now, and the next editor or Settings visit asks again
    console.error('Reading the Editor setting failed:', error);
    if (loadedFor === user.id) loadedFor = null;
    return;
  }
  if (chosen || loadedFor !== user.id) return;
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
  const previous = spaceIndent;
  chosen = true;
  spaceIndent = next;
  notify();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Never read for this account (its read failed, e.g. offline): save it anyway; the save reads
  // the latest settings first, so it keeps the others. Only another account's choice is skipped.
  const neverRead = loadedFor === null;
  if (neverRead) loadedFor = user.id;
  if (user.id !== loadedFor) return;
  try {
    const prefs = await readPrefs(user.id);
    const editor = (prefs.editor ?? {}) as Record<string, unknown>;
    prefs.editor = { ...editor, spaceIndent: next };
    const { error } = await supabase
      .from('user_preferences')
      .upsert([{ user_id: user.id, prefs: prefs as never }], { onConflict: 'user_id' });
    if (error) throw error;
  } catch (error) {
    // Not saved: back to the choice that is saved, and say so
    console.error('Saving the Editor setting failed:', error);
    if (spaceIndent === next && loadedFor === user.id) {
      spaceIndent = previous;
      notify();
    }
    // Still never read for this account: the next editor or Settings visit asks again
    if (neverRead && loadedFor === user.id) {
      loadedFor = null;
      chosen = false;
    }
    toast.error("Couldn't save the Editor setting. Check your connection and try again.");
  }
}
