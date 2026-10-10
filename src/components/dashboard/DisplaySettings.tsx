import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  setMenuAnimationsEnabled,
  setPageTransitionsEnabled,
  setReduceFlashing,
  useMenuAnimations,
  usePageTransitions,
  useReduceFlashingSetting,
} from '@/hooks/usePageTransitions';
import { useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/** "Animating menu" settings: page transitions and the side menu's moving effects. */
export const DisplaySettings = () => {
  const transitionsEnabled = usePageTransitions();
  const menuAnimationsEnabled = useMenuAnimations();
  const reduceFlashing = useReduceFlashingSetting();
  const deviceReducedMotion = useReducedMotion();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles size={18} className="text-primary" />
          Animating menu
        </CardTitle>
        <CardDescription>Saved on this device only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="page-transitions" className="text-base">Page transitions</Label>
            <p className="text-sm text-muted-foreground">Play the train crowd animation when switching pages</p>
          </div>
          <Switch
            id="page-transitions"
            checked={transitionsEnabled}
            onCheckedChange={setPageTransitionsEnabled}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="menu-animations" className="text-base">Side menu effects</Label>
            <p className="text-sm text-muted-foreground">
              Moving water, butterflies, bubbles and sparkles in the side menu (they stay visible when off)
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
            <Label htmlFor="reduce-flashing" className="text-base">Reduce flashing</Label>
            <p className="text-sm text-muted-foreground">
              Turns off bright flashes and screen shakes: the slash when the side menu opens, and the white flash and
              shake when Lulyssia casts a skill. Use this if flashing light bothers you.
            </p>
            {deviceReducedMotion && (
              <p className="text-sm text-primary">Your device asks for less motion, so flashing is already off.</p>
            )}
          </div>
          <Switch
            id="reduce-flashing"
            checked={reduceFlashing || !!deviceReducedMotion}
            disabled={!!deviceReducedMotion}
            onCheckedChange={setReduceFlashing}
          />
        </div>
      </CardContent>
    </Card>
  );
};
