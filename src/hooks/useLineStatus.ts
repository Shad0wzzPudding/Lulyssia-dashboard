import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Whether this account is linked with LINE, and whether the daily message is on. */
export interface LineStatus {
  linked: boolean;
  dailyOn: boolean;
}

/**
 * LINE status for the drawer: null until the first check. Checks again whenever `refreshKey`
 * changes (the drawer opening) and when the app comes back into view (linking happens in LINE).
 */
export const useLineStatus = (refreshKey: unknown) => {
  const [status, setStatus] = useState<LineStatus | null>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data, error } = await supabase
        .from('line_links')
        .select('line_user_id, is_enabled')
        .eq('user_id', uid)
        .maybeSingle();
      // A failed check keeps the last answer rather than claiming "not linked"
      if (error || !active) return;
      setStatus({ linked: !!data?.line_user_id, dailyOn: !!data?.is_enabled });
    };
    check();
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshKey]);

  return status;
};
