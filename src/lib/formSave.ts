import { onlineManager } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import type { FormSaveMarker } from '@/lib/types';

type FormButton = NonNullable<FormSaveMarker['__form']>;

/** The add/edit forms' failure message: the form stays open, so try the same button again. */
export const formSaveFailed = (button: FormButton) =>
  toast.error(`Couldn't save. Check your connection and press ${button} again.`);

/**
 * True (and the failure message shown) when the device is offline. A save sent offline doesn't
 * fail: it waits for the connection and goes through later, even after the form was closed, so
 * the forms refuse it up front instead.
 */
export const refuseSaveOffline = (button: FormButton) => {
  if (onlineManager.isOnline()) return false;
  formSaveFailed(button);
  return true;
};
