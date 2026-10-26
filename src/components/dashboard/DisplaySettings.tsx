import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  dismissMotionNotice,
  setMenuAnimationsEnabled,
  useFlashingSwitch,
  useMenuAnimations,
  useMotionNotice,
  usePageTransitionsSwitch,
} from '@/hooks/usePageTransitions';
import { useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/** "Animating menu" settings: page transitions and the side menu's moving effects. */
export const DisplaySettings = () => {
  const transitions = usePageTransitionsSwitch();
  const menuAnimationsEnabled = useMenuAnimations();
  const flashing = useFlashingSwitch();
  const deviceReducedMotion = useReducedMotion();
  // The device asks for less motion, so the train and flashing start off: a "!" by the title says
  // there is something here, until it is pressed
  const showNotice = useMotionNotice();
  const reducedMotionNote = (
    <p className="text-sm text-primary">Your device asks for less motion, so this starts off. You can turn it on here.</p>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <Sparkles size={18} className="text-primary" />
          Animating menu
          {showNotice && (
            <button
              type="button"
              onClick={dismissMotionNotice}
              aria-label="Dismiss: page transitions and flashing are off because your device asks for less motion"
              title="Dismiss"
              className="group ml-1 flex items-center gap-1.5 font-sans text-xs font-normal not-italic text-destructive"
            >
              <span
                aria-hidden
                className="line-alert grid h-5 w-5 -rotate-[8deg] place-items-center border-2 border-foreground bg-destructive font-display text-sm font-black italic leading-none text-foreground transition-transform group-hover:scale-110"
              >
                !
              </span>
              <span className="underline-offset-2 group-hover:underline">Tap to dismiss</span>
            </button>
          )}
        </CardTitle>
        <CardDescription>Saved on this device only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="page-transitions" className="text-base">Page transitions</Label>
            <p className="text-sm text-muted-foreground">Play the train crowd animation when switching pages</p>
            {deviceReducedMotion && reducedMotionNote}
          </div>
          <Switch
            id="page-transitions"
            checked={transitions.checked}
            onCheckedChange={transitions.set}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="menu-animations" className="text-base">Side menu effects</Label>
            <p className="text-sm text-muted-foreground">
              Moving water, butterflies, bubbles and sparkles in the side menu (they stay visible when off), and the
              round menu button sliding away while a form is open
            </p>
          </div>
          <Switch
            id="menu-animations"
            checked={menuAnimationsEnabled}
            onCheckedChange={setMenuAnimationsEnabled}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="enable-flashing" className="text-base">Enable flashing</Label>
            <p className="text-sm text-muted-foreground">
              Bright flashes and screen shakes: the slash when the side menu opens, and the white flash and shake
              when Lulyssia casts a skill. Turn this off if flashing light bothers you.
            </p>
            {deviceReducedMotion && reducedMotionNote}
          </div>
          <Switch
            id="enable-flashing"
            checked={flashing.checked}
            onCheckedChange={flashing.set}
          />
        </div>
      </CardContent>
    </Card>
  );
};
