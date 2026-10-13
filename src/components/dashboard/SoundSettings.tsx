import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Play, Volume1, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SOUND_GROUPS,
  resetSoundSettings,
  setMasterSound,
  setSound,
  useSoundSettings,
  type SoundId,
} from '@/lib/soundSettings';
import {
  playAddSound,
  playCancelSound,
  playCollapseSound,
  playCompletionSound,
  playConfirmSound,
  playDeleteSound,
  playDrawerCloseSound,
  playDrawerOpenSound,
  playDuplicateSound,
  playEditSound,
  playExpandSound,
  playLulyssiaSound,
  playMenuCloseSound,
  playMenuOpenSound,
  playPinSound,
  playSelectModeCloseSound,
  playSelectModeSound,
  playSelectionSound,
  playSuccessSound,
  playTickSound,
  playTrainSound,
  playTriggerSound,
  playUnpinSound,
  playUpdateSound,
  preloadDrawerSounds,
  preloadMenuCloseSounds,
  preloadMenuOpenSound,
  preloadSelectModeSounds,
  preloadSelectionSound,
  preloadTickSound,
  preloadTrainSound,
  preloadTriggerSound,
} from '@/lib/sounds';

// The play button of each row: the same call the app makes, so it plays at the current setting
const PLAY: Record<SoundId, () => void> = {
  add: playAddSound,
  create: playSuccessSound,
  edit: playEditSound,
  update: playUpdateSound,
  complete: playCompletionSound,
  duplicate: playDuplicateSound,
  delete: playDeleteSound,
  pin: playPinSound,
  unpin: playUnpinSound,
  cancel: playCancelSound,
  collapse: playCollapseSound,
  expand: playExpandSound,
  selectOn: playSelectModeSound,
  selectOff: playSelectModeCloseSound,
  menuOpen: playMenuOpenSound,
  menuClose: playMenuCloseSound,
  cursor: playTickSound,
  pick: playSelectionSound,
  drawerOpen: playDrawerOpenSound,
  drawerClose: playDrawerCloseSound,
  train: () => playTrainSound(),
  cutIn: playTriggerSound,
  ask: playLulyssiaSound,
  agree: playConfirmSound,
};

const DEFAULT_SOUND = { on: true, volume: 100 };

/** "Sound" settings: all sounds on/off and their volume, then each sound on its own. */
export const SoundSettings = () => {
  const settings = useSoundSettings();
  // Only the first group starts open, so the card stays short
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([SOUND_GROUPS[0].name]));

  // The sound files load now, so a play button sounds right the first time
  useEffect(() => {
    preloadMenuOpenSound();
    preloadMenuCloseSounds();
    preloadDrawerSounds();
    preloadSelectModeSounds();
    preloadSelectionSound();
    preloadTickSound();
    preloadTrainSound();
    preloadTriggerSound();
  }, []);

  const toggleGroup = (name: string, open: boolean) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (open) next.add(name);
      else next.delete(name);
      return next;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Volume2 size={18} className="text-primary" />
          Sound
        </CardTitle>
        <CardDescription>Saved on this device only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-lg border bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="sound-all" className="text-base">All sounds</Label>
              <p className="text-sm text-muted-foreground">Turns every sound in the app on or off</p>
            </div>
            <Switch id="sound-all" checked={settings.on} onCheckedChange={(on) => setMasterSound({ on })} />
          </div>
          <div className="flex items-center gap-3">
            <Volume1 size={18} className="shrink-0 text-muted-foreground" />
            <Slider
              value={[settings.volume]}
              min={0}
              max={100}
              step={5}
              disabled={!settings.on}
              onValueChange={([volume]) => setMasterSound({ volume })}
              aria-label="Volume of all sounds"
              className={cn(!settings.on && 'opacity-40')}
            />
            <span className="w-11 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
              {settings.volume}%
            </span>
          </div>
        </div>

        <div className="divide-y border-y">
          {SOUND_GROUPS.map((group) => {
            const off = group.sounds.filter((s) => settings.sounds[s.id]?.on === false).length;
            const open = openGroups.has(group.name);
            return (
              <Collapsible key={group.name} open={open} onOpenChange={(o) => toggleGroup(group.name, o)}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 py-3 text-left font-display text-lg font-extrabold italic">
                  <ChevronRight size={16} className={cn('text-muted-foreground transition-transform', open && 'rotate-90')} />
                  {group.name}
                  <span className="font-sans text-xs font-medium not-italic text-muted-foreground">
                    {group.sounds.length} sounds
                  </span>
                  {off > 0 && (
                    <span className="rounded-full bg-muted-foreground px-2 font-sans text-xs font-semibold not-italic text-background">
                      {off} off
                    </span>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 pb-3">
                  {group.sounds.map((sound) => {
                    const s = settings.sounds[sound.id] ?? DEFAULT_SOUND;
                    const silent = !s.on || !settings.on;
                    return (
                      <div
                        key={sound.id}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-md px-1 py-2 hover:bg-foreground/[0.03] sm:grid-cols-[auto_minmax(0,1fr)_10rem_2.75rem_auto]"
                      >
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={silent}
                          onClick={() => PLAY[sound.id]()}
                          aria-label={`Play ${sound.name}`}
                          title="Play"
                        >
                          <Play size={12} className="fill-current" />
                        </Button>
                        <div className={cn('min-w-0', silent && 'opacity-45')}>
                          <Label htmlFor={`sound-${sound.id}`} className="text-sm font-medium">{sound.name}</Label>
                          <p className="text-xs text-muted-foreground">{sound.when}</p>
                        </div>
                        <Switch
                          id={`sound-${sound.id}`}
                          checked={s.on}
                          disabled={!settings.on}
                          onCheckedChange={(on) => setSound(sound.id, { on })}
                          className="col-start-3 row-start-1 sm:col-start-5"
                        />
                        <Slider
                          value={[s.volume]}
                          min={0}
                          max={100}
                          step={5}
                          disabled={silent}
                          onValueChange={([volume]) => setSound(sound.id, { volume })}
                          aria-label={`${sound.name} volume`}
                          className={cn('col-start-2 sm:col-start-3 sm:row-start-1', silent && 'opacity-40')}
                        />
                        <span
                          className={cn(
                            'col-start-3 text-right text-xs tabular-nums text-muted-foreground sm:col-start-4 sm:row-start-1',
                            silent && 'opacity-45'
                          )}
                        >
                          {s.on ? `${s.volume}%` : 'Off'}
                        </span>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Sounds you turn off also stop their little vibration on phones that have one.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={resetSoundSettings}>
            Reset sounds
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
