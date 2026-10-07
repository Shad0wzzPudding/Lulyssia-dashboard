import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { setPageTransitionsEnabled, usePageTransitions } from '@/hooks/usePageTransitions';
import { Sparkles } from 'lucide-react';

export const DisplaySettings = () => {
  const transitionsEnabled = usePageTransitions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles size={18} className="text-primary" />
          Display
        </CardTitle>
        <CardDescription>Saved on this device only.</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};
