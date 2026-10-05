import { supabase } from '@/integrations/supabase/client';

// Supabase emits PASSWORD_RECOVERY right after the client starts up, before most React
// components have mounted. The listener is therefore registered at import time so the
// event is not missed, and the result is remembered until the router can act on it.
let recoveryPending = false;
const listeners = new Set<() => void>();

supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryPending = true;
    listeners.forEach((listener) => listener());
  }
});

/** Returns true once if a password-recovery link was just opened, then resets. */
export const consumeRecovery = () => {
  const wasPending = recoveryPending;
  recoveryPending = false;
  return wasPending;
};

export const onRecovery = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
