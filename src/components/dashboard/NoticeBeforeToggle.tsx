import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';

let cachedLinked: boolean | null = null;

/** "Notice before" switch — only shown once the account is linked with LINE. */
export const NoticeBeforeToggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) => {
  const [linked, setLinked] = useState<boolean>(cachedLinked ?? false);

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

  if (!linked) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-dashed p-3">
      <div>
        <p className="text-sm font-medium flex items-center gap-1">
          <BellRing size={14} /> Notice before
        </p>
        <p className="text-xs text-muted-foreground">
          LINE sends a separate heads-up the morning of the day before it starts or is due
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
};
