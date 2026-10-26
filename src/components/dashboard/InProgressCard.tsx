import { differenceInCalendarDays, format, isToday, parseISO } from 'date-fns';
import { Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsiblePreview } from './CollapsiblePreview';
import { useTags } from '@/hooks/useTags';

export type InProgressItem = {
  id: string;
  type: 'task' | 'event';
  title: string;
  description?: string | null;
  start: string;
  end: string;
  tag_ids?: string[];
};

/**
 * "In progress..." on Home: tasks and events that started on an earlier day and aren't finished
 * yet, each with a bar from start to end, "Day 3 of 5" and when it ends. Shows 3, then the
 * "+N more" control opens the full list. Hidden when nothing is in progress.
 */
export const InProgressCard = ({
  items,
  onOpen,
}: {
  items: InProgressItem[];
  onOpen: (item: InProgressItem) => void;
}) => {
  const { tags } = useTags();
  if (items.length === 0) return null;
  const tagName = new Map(tags.map((t) => [t.id, t.name]));
  const now = new Date();

  const renderList = (list: InProgressItem[]) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((item) => {
        const start = parseISO(item.start);
        const end = parseISO(item.end);
        const progress = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100));
        const day = differenceInCalendarDays(now, start) + 1;
        const days = differenceInCalendarDays(end, start) + 1;
        const endsToday = isToday(end);
        const names = (item.tag_ids ?? []).map((id) => tagName.get(id)).filter(Boolean) as string[];
        return (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            onClick={() => onOpen(item)}
            className="flex w-full flex-col gap-2 rounded border border-p5-200/40 bg-card/90 p-3 text-left transition-colors hover:border-primary dark:border-p5-800/40"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="min-w-0 text-sm font-medium whitespace-pre-wrap [overflow-wrap:anywhere]">{item.title}</p>
              <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.type === 'event' ? '📅 Event' : '📋 Task'}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`Day ${day} of ${days}`}
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full ${item.type === 'event' ? 'bg-gradient-to-r from-primary to-p5-300' : 'bg-gradient-to-r from-slate-300 to-white'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Day <b className="font-semibold text-foreground">{day}</b> of {days}
              </span>
              <span className={endsToday ? 'text-amber-500' : undefined}>
                {item.type === 'event' ? 'Ends' : 'Due'}{' '}
                <b className={`font-semibold ${endsToday ? '' : 'text-foreground'}`}>
                  {endsToday ? `today, ${format(end, 'HH:mm')}` : format(end, 'EEE d MMM, HH:mm')}
                </b>
              </span>
            </div>
            {names.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {names.map((name) => (
                  <span key={name} className="rounded border border-primary/35 bg-primary/10 px-1.5 text-[11px] text-primary">
                    🏷 {name}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <Card className="bg-gradient-to-r from-p5-50 to-p5-50 dark:from-p5-950/20 dark:to-p5-950/20 border-p5-200 dark:border-p5-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-p5-700 dark:text-p5-300">
          <Hourglass size={20} />
          <span className="font-bold">In progress...</span>
          <span className="rounded-full bg-primary px-2 text-xs font-semibold not-italic text-primary-foreground">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* First 3, then the same "+N more" control as Completed Tasks (opens the full list) */}
        <CollapsiblePreview items={items} previewCount={3} label="in progress" renderList={renderList} />
      </CardContent>
    </Card>
  );
};
