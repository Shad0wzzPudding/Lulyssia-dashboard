import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavigationPage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, Heart, CheckSquare, Calendar, Camera, MessageCircle, X, PanelLeftOpen, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { playNavigationSound } from '@/lib/sounds';

interface NavigationProps {
  activePage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
}

const navigationItems = [
  { page: 'home' as const, icon: Home, label: 'Home' },
  { page: 'interests' as const, icon: Heart, label: 'Interests' },
  { page: 'tasks' as const, icon: CheckSquare, label: 'Tasks' },
  { page: 'events' as const, icon: Calendar, label: 'Events' },
];

export const Navigation = ({ activePage, onPageChange }: NavigationProps) => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the menu or on Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handlePageChange = (page: NavigationPage) => {
    if (page !== activePage) {
      playNavigationSound();
      onPageChange(page);
    }
    setOpen(false);
    setDrawerOpen(false);
  };

  return (
    <div ref={containerRef}>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="main-navigation"
            aria-label="Main navigation"
            initial={{ opacity: 0, x: 24, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, y: 12, scale: 0.9 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed right-6 bottom-24 z-[60] bg-card/95 backdrop-blur-sm border-2 border-foreground/80 p-3 shadow-[5px_5px_0_0_hsl(var(--primary))]"
          >
            <div className="flex flex-col gap-3">
              {navigationItems.map(({ page, icon: Icon, label }) => (
                <Button
                  key={page}
                  variant={activePage === page ? "default" : "ghost"}
                  size="icon"
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "w-12 h-12 rounded-full transition-all duration-300 group relative",
                    activePage === page
                      ? "p5-burst rounded-none bg-gradient-to-r from-[#3bc6d4] to-white text-slate-900 scale-125"
                      : "hover:bg-accent hover:scale-105"
                  )}
                  title={label}
                >
                  <Icon size={20} />

                  {/* Tooltip */}
                  <div className="absolute right-full mr-3 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {label}
                  </div>
                </Button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Menu toggle, bottom-right corner */}
      <Button
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="main-navigation"
        title={open ? 'Close menu' : 'Menu'}
        className="fixed right-6 bottom-6 z-[60] h-14 w-14 rounded-full border-2 border-foreground/80 shadow-[4px_4px_0_0_hsl(var(--foreground)/0.8)] transition-transform hover:scale-105 [&_svg]:size-6"
      >
        {open ? <X /> : <MessageCircle />}
      </Button>

      {/* Side drawer (opened from a tab on the left edge) with secondary links */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open drawer"
            title="More"
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex h-14 w-9 items-center justify-center border-2 border-l-0 border-foreground/80 bg-card/95 text-foreground backdrop-blur-sm shadow-[4px_4px_0_0_hsl(var(--primary))] transition-[width,color] hover:w-11 hover:text-primary"
          >
            <PanelLeftOpen size={18} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-r-2 border-foreground/80 bg-card p-5">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle className="p5-title w-fit text-xl">Menu</SheetTitle>
            <SheetDescription className="sr-only">Extra pages and shortcuts</SheetDescription>
          </SheetHeader>
          <button
            type="button"
            onClick={() => handlePageChange('settings')}
            aria-current={activePage === 'settings' ? 'page' : undefined}
            className={cn(
              'group flex w-full -skew-x-6 items-center gap-3 border-2 px-3 py-2.5 text-left font-semibold transition-colors',
              activePage === 'settings'
                ? 'border-foreground/80 bg-gradient-to-r from-[#3bc6d4] to-white text-slate-900'
                : 'border-foreground/30 hover:border-primary hover:text-primary'
            )}
          >
            <Camera size={18} className="skew-x-6" />
            <span className="flex-1 skew-x-6">Settings</span>
            <ChevronRight size={16} className="skew-x-6 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
};
