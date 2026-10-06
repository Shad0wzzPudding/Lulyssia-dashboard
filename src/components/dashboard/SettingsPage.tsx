import { InstallAppCard } from './InstallAppCard';
import { TagManager } from './TagManager';
import { LineSettings } from './LineSettings';
import { Camera } from 'lucide-react';
import { PageIcon } from './PageIcon';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PageIcon icon={Camera} />
        <h1 className="p5-title w-fit text-2xl">Settings</h1>
      </div>
      <InstallAppCard />
      {/* LINE card uses the light panel theme (whiteish background, black text) */}
      <div className="theme-light">
        <LineSettings />
      </div>
      <TagManager />
    </div>
  );
};