import { InstallAppCard } from './InstallAppCard';
import { TagManager } from './TagManager';
import { LineSettings } from './LineSettings';
import { Camera } from 'lucide-react';
import { PageIcon } from './PageIcon';
import { NameSettings } from './NameSettings';
import { DisplaySettings } from './DisplaySettings';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PageIcon icon={Camera} />
        <h1 className="p5-title w-fit text-2xl">Settings</h1>
      </div>
      {/* Cards alternate black / white, starting with black. Install App is hidden once the
          app is installed; the rest still alternates without it. */}
      <InstallAppCard />
      <div className="theme-light">
        <NameSettings />
      </div>
      <DisplaySettings />
      <div className="theme-light">
        <LineSettings />
      </div>
      <TagManager />
    </div>
  );
};