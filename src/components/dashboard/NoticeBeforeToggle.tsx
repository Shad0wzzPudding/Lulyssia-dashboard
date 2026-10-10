import { BellRing } from 'lucide-react';
import { useLineLinked } from '@/hooks/useLineLinked';
import { Switch } from '@/components/ui/switch';

/** "Notice before" switch — only shown once the account is linked with LINE. */
export const NoticeBeforeToggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) => {
  const linked = useLineLinked();

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
