import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Last answer, so the next component that asks starts from it instead of "unknown"
let cachedLinked: boolean | null = null;

/**
 * Whether this account is linked with LINE: true / false, or null while the first check runs.
 * Checks again every time a component using it appears, so linking in Settings shows up on
 * the next page.
 */
export const useLineLinked = () => {
  const [linked, setLinked] = useState<boolean | null>(cachedLinked);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('line_links')
        .select('line_user_id')
        .eq('user_id', uid)
        .maybeSingle();
      cachedLinked = !!data?.line_user_id;
      if (active) setLinked(cachedLinked);
    })();
    return () => {
      active = false;
    };
  }, []);

  return linked;
};
