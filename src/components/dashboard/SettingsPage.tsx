import { InstallAppCard } from './InstallAppCard';
import { TagManager } from './TagManager';
import { LineSettings } from './LineSettings';
import { Camera } from 'lucide-react';
import { PageIcon } from './PageIcon';
import { NameSettings } from './NameSettings';
import { DisplaySettings } from './DisplaySettings';
import { SoundSettings } from './SoundSettings';

/** lineFocus: set (a new number each time) when Settings should jump to the LINE card */
export const SettingsPage = ({ lineFocus = null }: { lineFocus?: number | null }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PageIcon icon={Camera} />
        <h1 className="p5-title w-fit text-2xl">Settings</h1>
      </div>
      {/* Install App (cyan) stands apart and is hidden once the app is installed. The cards
          below alternate black / white, starting with black. */}
      <InstallAppCard />
      <NameSettings />
      <div className="theme-light">
        <LineSettings scrollToken={lineFocus} />
      </div>
      <TagManager />
      <div className="theme-light">
        <DisplaySettings />
      </div>
      <SoundSettings />
    </div>
  );
};