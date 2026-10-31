import { Button } from '@/components/ui/button';
import type { TodayTab } from '@/lib/todayTabs';

const TABS: [TodayTab, string][] = [
  ['all', 'All'],
  ['start', 'Start today'],
  ['end', 'End today'],
];

/** The tabs of the Tasks and Events pages' Today sections, each with its count. */
export const TodayTabs = ({
  value,
  onChange,
  counts,
}: {
  value: TodayTab;
  onChange: (tab: TodayTab) => void;
  counts: Record<TodayTab, number>;
}) => (
  <div role="tablist" aria-label="Today's items" className="mb-3 flex flex-wrap gap-2">
    {TABS.map(([tab, label]) => (
      <Button
        key={tab}
        type="button"
        role="tab"
        aria-selected={value === tab}
        size="sm"
        variant={value === tab ? 'default' : 'outline'}
        onClick={() => onChange(tab)}
        className="h-7 px-3 text-xs"
      >
        {label}
        <span className="ml-1 font-normal opacity-75">{counts[tab]}</span>
      </Button>
    ))}
  </div>
);
