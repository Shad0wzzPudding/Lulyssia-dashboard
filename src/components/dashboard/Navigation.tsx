import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavigationPage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, Heart, CheckSquare, Calendar, Camera, MessageCircle, X, PanelLeftOpen, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  playDrawerCloseSound,
  playDrawerOpenSound,
  playMenuOpenSound,
  playSelectionSound,
  preloadDrawerSounds,
  preloadMenuOpenSound,
  preloadSelectionSound,
} from '@/lib/sounds';
import lulyssiaPortrait from '@/assets/image/lulyssia_portrait.webp';

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

// Jagged speech bubble with its tail pointing right (toward the portrait)
const CHOICE_SHAPE = 'polygon(0% 22%, 5% 0%, 86% 10%, 88% 32%, 100% 52%, 87% 68%, 84% 100%, 2% 86%)';
const PORTRAIT_SHAPE = 'polygon(14% 0%, 100% 3%, 94% 100%, 0% 93%)';
// Each choice is tilted and nudged a little differently, like the P5 dialog menu
const CHOICE_LAYOUT = [
  { tilt: -3, offset: 20 },
  { tilt: 2, offset: 0 },
  { tilt: -2, offset: 28 },
  { tilt: 3, offset: 6 },
];

export const Navigation = ({ activePage, onPageChange }: NavigationProps) => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drawer sounds for opening and for closing it yourself (X, outside click, Esc).
  // Picking Settings closes it via handlePageChange instead, which already plays the page sounds.
  const handleDrawerOpenChange = (next: boolean) => {
    if (next) playDrawerOpenSound();
    else playDrawerCloseSound();
    setDrawerOpen(next);
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the menu choice sound up front so the first pick plays it instantly
  useEffect(() => {
    preloadSelectionSound();
    preloadMenuOpenSound();
    preloadDrawerSounds();
  }, []);

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
      playSelectionSound();
      onPageChange(page);
    }
    setOpen(false);
    setDrawerOpen(false);
  };

  return (
    <div ref={containerRef}>
      {/* Persona 5 style dialog choices: speech-bubble options pointing at Lulyssia's portrait */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id="main-navigation"
            aria-label="Main navigation"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            className="fixed right-3 bottom-24 z-[60] flex items-end sm:right-6"
          >
            <motion.ul
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              className="relative z-10 -mr-8 mb-10 flex flex-col items-end gap-2.5"
            >
              {navigationItems.map(({ page, icon: Icon, label }, i) => {
                const active = activePage === page;
                const choice = CHOICE_LAYOUT[i % CHOICE_LAYOUT.length];
                return (
                  <motion.li
                    key={page}
                    variants={{
                      hidden: { opacity: 0, x: 60, rotate: choice.tilt + 8 },
                      show: { opacity: 1, x: 0, rotate: choice.tilt },
                    }}
                    transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                    style={{ marginRight: choice.offset }}
                  >
                    <button
                      type="button"
                      onClick={() => handlePageChange(page)}
                      aria-current={active ? 'page' : undefined}
                      className="group relative block h-14 w-48 focus-visible:outline-none sm:w-56"
                    >
                      {/* White outline, then the fill, both cut to the same jagged bubble */}
                      <span aria-hidden className="absolute inset-0 bg-foreground" style={{ clipPath: CHOICE_SHAPE }} />
                      <span
                        aria-hidden
                        className={cn(
                          'absolute inset-[3px] transition-colors',
                          active ? 'bg-primary' : 'bg-background group-hover:bg-foreground group-focus-visible:bg-foreground'
                        )}
                        style={{ clipPath: CHOICE_SHAPE }}
                      />
                      <span
                        className={cn(
                          "relative flex h-full items-center gap-3 pl-6 pr-12 font-['Kanit',sans-serif] text-lg font-extrabold italic transition-colors",
                          active
                            ? 'text-primary-foreground'
                            : 'text-foreground group-hover:text-background group-focus-visible:text-background'
                        )}
                      >
                        <Icon size={18} className="shrink-0" />
                        {label}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>

            {/* Lulyssia's portrait in a slanted frame */}
            <motion.div
              variants={{ hidden: { opacity: 0, x: 40 }, show: { opacity: 1, x: 0 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="relative h-60 w-44 shrink-0 sm:h-72 sm:w-56"
            >
              <span aria-hidden className="absolute inset-0 bg-foreground" style={{ clipPath: PORTRAIT_SHAPE }} />
              <span className="absolute inset-[5px] overflow-hidden bg-background" style={{ clipPath: PORTRAIT_SHAPE }}>
                <img src={lulyssiaPortrait} alt="" className="h-full w-full object-cover object-top" />
              </span>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Menu toggle, bottom-right corner */}
      <Button
        size="icon"
        onClick={() => {
          // Sound only when opening; closing the menu stays quiet
          if (!open) playMenuOpenSound();
          setOpen(!open);
        }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="main-navigation"
        title={open ? 'Close menu' : 'Menu'}
        className="fixed right-6 bottom-6 z-[60] h-14 w-14 rounded-full border-2 border-foreground/80 shadow-[4px_4px_0_0_hsl(var(--foreground)/0.8)] transition-transform hover:scale-105 [&_svg]:size-6"
      >
        {open ? <X /> : <MessageCircle />}
      </Button>

      {/* Side drawer (opened from a tab on the left edge) with secondary links */}
      <Sheet open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
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
