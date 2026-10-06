import type { LucideIcon } from 'lucide-react';

/** Round badge shown beside a page title; matches the active item in the menu. */
export const PageIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-r from-[#3bc6d4] to-white border-2 border-foreground/80 flex items-center justify-center text-slate-900 shadow-md">
    <Icon size={20} />
  </div>
);
