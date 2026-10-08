import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  setMenuAnimationsEnabled,
  setPageTransitionsEnabled,
  useMenuAnimations,
  usePageTransitions,
} from '@/hooks/usePageTransitions';
import { Sparkles } from 'lucide-react';

/** "Animating menu" settings: page transitions and the side menu's moving effects. */
export const DisplaySettings = () => {
  const transitionsEnabled = usePageTransitions();
  const menuAnimationsEnabled = useMenuAnimations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles size={18} className="text-primary" />
          Animating menu
        </CardTitle>
        <CardDescription>Both are on by default. Saved on this device only.</CardDescription>
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
      </CardContent>
    </Card>
  );
};
