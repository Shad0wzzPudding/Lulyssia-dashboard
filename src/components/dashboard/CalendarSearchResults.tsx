import { forwardRef, type CSSProperties } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { searchHasFilter } from '@/lib/sortAndFilter';
import { hitDateLines, hitKey, type CalendarHit } from '@/lib/calendarSearch';
import { SearchChips } from './SortAndFilterBar';

/** The Calendar Overview's small search box, like the "Show all" window's */
export const CalendarSearchBox = forwardRef<
  HTMLInputElement,
  { value: string; onChange: (value: string) => void; className?: string }
>(({ value, onChange, className }, ref) => {
  const clear = () => {
    onChange('');
    if (ref && typeof ref !== 'function') ref.current?.focus();
  };
  return (
    <div className={cn('relative w-full max-w-[280px]', className)}>
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder="Search tasks and events…"
        aria-label="Search tasks and events on the calendar"
        autoComplete="off"
        spellCheck={false}
        className="h-8 pl-8 pr-8 text-base md:text-sm"
      />
      {!!value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
});
CalendarSearchBox.displayName = 'CalendarSearchBox';

const GREEN = 'hsl(142 71% 45%)';
const RED = 'hsl(0 84% 60%)';

/**
 * One date line ("Start Tue 3 Nov, 10:46"). It stays on one line, unless the row is too narrow for
 * it (a phone, a date in another year): then the time goes under the date instead of being cut off
 */
const DateLine = ({ text, className }: { text: string; className: string }) => {
  const cut = text.lastIndexOf(', ');
  if (cut < 0) return <span className={cn('whitespace-nowrap', className)}>{text}</span>;
  return (
    <span className={className}>
      <span className="whitespace-nowrap">{text.slice(0, cut + 1)}</span>{' '}
      <span className="whitespace-nowrap">{text.slice(cut + 2)}</span>
    </span>
  );
};

/** One found item: its title and type, its dates on the right; a button that opens its date */
const HitRow = ({ hit, past, index, onPick }: { hit: CalendarHit; past: boolean; index: number; onPick: (hit: CalendarHit) => void }) => {
  const lines = hitDateLines(hit);
  // The thin line at its left edge, like the date panel's cards: green start, red due/end
  const bar = hit.start && hit.end
    ? `linear-gradient(to bottom, ${GREEN} 0%, ${GREEN} 50%, ${RED} 50%, ${RED} 100%)`
    : hit.start ? GREEN : RED;
  return (
    <button
      type="button"
      data-hit={hitKey(hit)}
      onClick={() => onPick(hit)}
      style={{ '--i': index } as CSSProperties}
      className={cn(
        'group relative flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-p5-200/60 bg-white/80 p-3 text-left shadow-sm transition-all duration-200 hover:scale-[1.01] hover:border-p5-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-p5-700/40 dark:bg-gray-800/60 dark:hover:border-p5-600',
        past && 'opacity-70'
      )}
    >
      <span className="absolute left-0 top-0 h-full w-0.5 rounded-l-lg" style={{ background: bar }} aria-hidden="true" />
      <span className="ml-2 min-w-[8rem] flex-1">
        <span className="whitespace-pre-wrap text-sm font-semibold leading-tight text-gray-900 [overflow-wrap:anywhere] dark:text-gray-100">
          {hit.title}
        </span>
        <Badge variant={hit.type === 'task' ? 'default' : 'secondary'} className="ml-1.5 h-5 px-1.5 py-0.5 align-middle text-xs">
          {hit.type}
        </Badge>
      </span>
      <span className="ml-auto grid min-w-0 max-w-full gap-0.5 text-right text-xs font-medium">
        {lines.sameDay ? (
          <DateLine text={lines.sameDay} className="text-p5-700 dark:text-p5-300" />
        ) : (<>
          {lines.start && <DateLine text={lines.start} className="text-green-600 dark:text-green-400" />}
          {lines.end && <DateLine text={lines.end} className="text-red-600 dark:text-red-400" />}
        </>)}
      </span>
    </button>
  );
};

/** The date panel while searching: "Results for …", how many, and the found items */
export const CalendarSearchResults = ({
  search,
  upcoming,
  past,
  onPick,
  rising,
}: {
  search: string;
  upcoming: CalendarHit[];
  past: CalendarHit[];
  onPick: (hit: CalendarHit) => void;
  /** The rows rise in one by one (when the results show, not on every key typed) */
  rising?: boolean;
}) => {
  const count = upcoming.length + past.length;
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 pb-3 border-b border-p5-200/60 dark:border-p5-700/50">
        <div className="p-1.5 bg-p5-100 dark:bg-p5-900/50 rounded-lg shrink-0">
          <Search size={16} className="text-p5-600 dark:text-p5-400" />
        </div>
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-1.5 font-bold text-base text-p5-800 dark:text-p5-200">
            <span>Results for</span>
            {searchHasFilter(search) ? (
              <SearchChips search={search} />
            ) : (
              <span className="[overflow-wrap:anywhere]">"{search.trim()}"</span>
            )}
          </h3>
          <p aria-live="polite" className="text-xs text-p5-600 dark:text-p5-400">
            {count ? `${count} found · pick one to open its date` : 'Nothing matches'}
          </p>
        </div>
      </div>
      {count > 0 && (
        <div className={cn('space-y-2 max-h-72 overflow-y-auto pr-1', rising && 'calendar-rise')}>
          {upcoming.map((hit, i) => <HitRow key={hitKey(hit)} hit={hit} past={false} index={i} onPick={onPick} />)}
          {past.length > 0 && (
            <p className="pt-1 text-xs font-semibold text-muted-foreground" style={{ '--i': upcoming.length } as CSSProperties}>Past</p>
          )}
          {past.map((hit, i) => <HitRow key={hitKey(hit)} hit={hit} past index={upcoming.length + 1 + i} onPick={onPick} />)}
        </div>
      )}
    </div>
  );
};
