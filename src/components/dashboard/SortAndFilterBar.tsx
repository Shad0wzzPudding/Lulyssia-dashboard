import { useTags } from '@/hooks/useTags';
import { TagChip } from './TagPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, X, Sparkles, Image as ImageIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/sounds';
import type { SortOption } from '@/lib/sortAndFilter';
import { useUserNames } from '@/hooks/useUserNames';
import { fillNames } from '@/lib/names';

interface Props {
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  filterTagIds: string[];
  onFilterChange: (ids: string[]) => void;
  showPinned?: boolean;
  showCompleted?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
}

export const SortAndFilterBar = ({
  sort,
  onSortChange,
  filterTagIds,
  onFilterChange,
  showPinned,
  showCompleted,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
}: Props) => {
  const { tags } = useTags();

  const toggleTag = (id: string) => {
    if (filterTagIds.includes(id)) onFilterChange(filterTagIds.filter((x) => x !== id));
    else onFilterChange([...filterTagIds, id]);
  };

  const { names } = useUserNames();

  const lulyssiaMessages = [
    "Lulyssia is on the case! Sorting by what's due soonest~ ❄️",
    "Leave it to me! Lulyssia has rearranged everything by deadline! ✨",
    "Don't worry, I got this! Putting the urgent stuff up top~ 🏹",
    "Lulyssia to the rescue! Soonest deadlines first, just for you! 💖",
    "Tada~! Sorted by deadline! You can thank me later~ 📸",
    "Ehehe~ Lulyssia magic! All your urgent stuff is now front and center! ✨",
    "Ice arrows locked on the deadlines! Sorted and ready, {nickname}! 🏹❄️",
    "Smile~! Lulyssia took a snapshot and rearranged everything by deadline! 📷",
    "Astral Express express delivery! Soonest tasks coming through! 🚂💨",
    "Pom-Pom would be so proud~ Sorted by what's due first! 📦",
    "Trust me, I'm a memory expert! Deadlines first, no time to lose! 💫",
    "Hehe, leave the boring sorting to me! Earliest deadlines on top! 💝",
    "Boop! Lulyssia's deadline radar activated~ ❄️✨",
    "Yoink! Grabbed all your tasks and lined them up by deadline! 🎀",
    "Don't panic, {nickname}! Lulyssia has your schedule under control~ 🌟",
  ];

  const requestHelp = () => {
    onSortChange('deadline_asc');
    playSuccessSound();
    const msg = lulyssiaMessages[Math.floor(Math.random() * lulyssiaMessages.length)];
    toast(fillNames(msg, names));
  };

  return (
    <div className="p-3 rounded-lg border bg-card/50 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
      <ArrowUpDown size={14} className="text-muted-foreground" />
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_desc">Newest first</SelectItem>
          <SelectItem value="created_asc">Oldest first</SelectItem>
          <SelectItem value="deadline_asc">Deadline (soonest)</SelectItem>
          <SelectItem value="deadline_desc">Deadline (latest)</SelectItem>
          <SelectItem value="title_asc">Title A–Z</SelectItem>
          <SelectItem value="title_desc">Title Z–A</SelectItem>
          <SelectItem value="tag">By tag</SelectItem>
          <SelectItem value="user">User sort (drag to arrange)</SelectItem>
          {showPinned && <SelectItem value="pinned_first">Pinned first</SelectItem>}
          {showCompleted && <SelectItem value="completed_last">Completed last</SelectItem>}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={requestHelp}
        className="h-8 px-2 text-xs gap-1 border-p5-400 text-p5-400 hover:bg-p5-950 hover:text-p5-300"
      >
        <Sparkles size={12} />
        Request Lulyssia help
      </Button>

      {tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap flex-1 ml-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 gap-1.5 text-xs relative bg-card/95 text-foreground border-foreground/30 hover:bg-accent hover:text-foreground shadow-sm max-w-[260px]"
                title="Filter by tag"
                aria-label="Filter by tag"
              >
                {/* Polaroid-style icon */}
                <span className="relative inline-flex items-center justify-center w-5 h-6 bg-zinc-800 border border-zinc-500 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] rotate-[-6deg]">
                  <ImageIcon size={10} className="text-p5-400" />
                </span>
                {filterTagIds.length === 0 ? (
                  <span>Filter</span>
                ) : (
                  (() => {
                    const selected = tags.filter((t) => filterTagIds.includes(t.id));
                    const first = selected[0];
                    const extra = selected.length - 1;
                    if (!first) return <span>Filter</span>;
                    return (
                      <span className="flex items-center gap-1 min-w-0">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border max-w-[140px] truncate"
                          style={{
                            background: `${first.color}22`,
                            borderColor: `${first.color}66`,
                            color: first.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: first.color }}
                          />
                          <span className="truncate">{first.name}</span>
                        </span>
                        {extra > 0 && (
                          <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-p5-500 text-primary-foreground text-[10px] font-bold">
                            +{extra}
                          </span>
                        )}
                      </span>
                    );
                  })()
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2" align="start">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Filter by tag</p>
                {filterTagIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onFilterChange([])}
                  >
                    <X size={10} className="mr-1" /> Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 max-h-56 overflow-y-auto">
                {tags.map((t) => (
                  <TagChip
                    key={t.id}
                    tag={t}
                    onClick={() => toggleTag(t.id)}
                    active={filterTagIds.length === 0 ? undefined : filterTagIds.includes(t.id)}
                  />
                ))}
              </div>
              {filterTagIds.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">Tap a tag to filter. Tap again to remove.</p>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
      </div>

      {onSearchChange && (
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 pr-8 text-xs"
          />
          {!!search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
