import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { playCollapseSound, playExpandSound } from '@/lib/sounds';

export const InstallAppCard = () => {
  const { canInstall, isInstalled, isStandalone, isIOS, installApp } = usePWA();

  const [isInstallCollapsed, setIsInstallCollapsed] = useState(() => {
    try {
      return localStorage.getItem('installSectionCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleInstallCollapse = () => {
    setIsInstallCollapsed(prev => {
      const newValue = !prev;
      if (newValue) playCollapseSound(); else playExpandSound();
      try {
        localStorage.setItem('installSectionCollapsed', String(newValue));
      } catch { /* storage unavailable */ }
      return newValue;
    });
  };

  // For iOS Safari (not standalone), always show the install help even if canInstall is false
  const shouldShowInstallPrompt = (canInstall && !isInstalled) || (isIOS && !isStandalone);
  if (!shouldShowInstallPrompt) return null;

  return (
    <Collapsible open={!isInstallCollapsed} onOpenChange={() => toggleInstallCollapse()}>
      {/* Cyan, set apart from the black and white cards below it; a white shadow (cyan wouldn't show) */}
      <Card className="border-primary bg-primary text-primary-foreground shadow-[5px_5px_0_0_hsl(var(--foreground))]">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-black/5">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {isIOS ? 'Add to Home Screen' : 'Install App'}
              </div>
              {isInstallCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </CardTitle>
            {isInstallCollapsed && (
              <CardDescription className="text-primary-foreground/75">
                Tap to expand for installation instructions
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <CardDescription className="mb-4 text-primary-foreground/75">
              {isIOS
                ? 'Add this app to your home screen using Safari\'s share menu for quick access.'
                : 'Install the app on your device for quick access, just like a regular app.'
              }
            </CardDescription>
            <div className="space-y-4">
              {isIOS ? (
                <div className="space-y-2">
                  <p className="text-sm">To add it on iOS:</p>
                  <ol className="text-xs text-primary-foreground/75 space-y-1 list-decimal list-inside">
                    <li>Open this page in Safari (not Chrome/Firefox)</li>
                    <li>Tap the share button at the bottom</li>
                    <li>Select "Add to Home Screen"</li>
                    <li>Open the app from your home screen</li>
                  </ol>
                </div>
              ) : (
                <Button onClick={installApp} className="w-full bg-background text-foreground hover:bg-background/85">
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
