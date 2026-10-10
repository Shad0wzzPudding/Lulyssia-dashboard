import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NavigationPage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, Heart, CheckSquare, Calendar, Camera, MessageCircle, X, PanelLeftOpen, ChevronRight, LogOut, Info } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useReduceFlashing } from '@/hooks/usePageTransitions';
import {
  playDrawerCloseSound,
  playDrawerOpenSound,
  playMenuCloseSound,
  playMenuOpenSound,
  playSelectionSound,
  preloadDrawerSounds,
  preloadMenuCloseSounds,
  preloadMenuOpenSound,
  preloadSelectionSound,
  playTickSound,
  preloadTickSound,
} from '@/lib/sounds';
import lulyssiaPortrait from '@/assets/image/lulyssia_portrait.webp';
import { DrawerScene, SLASH_DURATION } from './DrawerScene';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';

interface NavigationProps {
  activePage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
  /** Signs the user out (asked to confirm first, from the side drawer). */
  onSignOut: () => void;
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

// Drawer items in screen order (the cursor moves through them with the arrow keys)
const DRAWER_PAGES: (NavigationPage | null)[] = ['settings', null, 'about'];

type ChoiceRefs = React.MutableRefObject<(HTMLButtonElement | null)[]>;

/** Moves a menu cursor to choice `index` by focusing it; ticks when it lands on a different choice. */
const moveCursorTo = (refs: ChoiceRefs, current: number | null, index: number) => {
  if (index !== current) playTickSound();
  refs.current[index]?.focus({ preventScroll: true });
};

/** Next cursor index for an Up/Down key (wrapping), or `start` when there is no cursor yet. */
const stepCursor = (current: number | null, key: string, count: number, start: number) =>
  current === null ? start : (current + (key === 'ArrowDown' ? 1 : -1) + count) % count;

export const Navigation = ({ activePage, onPageChange, onSignOut }: NavigationProps) => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  // Game-style cursor in the message menu and the drawer: the choice under the arrow keys or
  // the mouse (null until it is moved). The cursor is the focused choice, so Enter picks it.
  const [menuCursor, setMenuCursor] = useState<number | null>(null);
  const [drawerCursor, setDrawerCursor] = useState<number | null>(null);
  const menuChoiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drawerItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  // Opened from the keyboard: the cursor starts on a choice right away
  const menuOpenedByKeyboard = useRef(false);
  const drawerOpenedByKeyboard = useRef(false);
  const reduceMotion = useReducedMotion();
  // "Reduce flashing": no opening slash, so the drawer rows don't wait for it or snap in either
  const noSlash = useReduceFlashing();
  const cursorTransition = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 600, damping: 40 };

  // Drawer sounds for opening and for closing it yourself (X, outside click, Esc).
  // Picking Settings closes it via handlePageChange instead, which already plays the page sounds.
  const handleDrawerOpenChange = (next: boolean) => {
    if (next) {
      playDrawerOpenSound();
      setDrawerCursor(null);
    } else playDrawerCloseSound();
    setDrawerOpen(next);
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Props shared by every choice: cursor follows focus, and a mouse hover moves the cursor (with a tick).
  // Touch taps don't move it, so on phones only the page sound plays.
  const cursorProps = (refs: ChoiceRefs, cursor: number | null, setCursor: (i: number) => void, i: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      refs.current[i] = el;
    },
    onFocus: () => setCursor(i),
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') moveCursorTo(refs, cursor, i);
    },
  });

  /** Drawer cursor: an outline that slides from item to item (in the item's own accent color). */
  const drawerCursorMark = (i: number, borderColor: string) =>
    drawerCursor === i && (
      <motion.span
        layoutId="drawer-cursor"
        aria-hidden
        transition={cursorTransition}
        className={cn('pointer-events-none absolute -inset-[2px] border-2', borderColor)}
      />
    );

  /** Drawer rows slam in one after another as the opening slash passes, settling at their slant:
      MENU at 60% of the slash, then the rows from 77%, 0.05s apart. */
  const snapIn = (i: number, skew = -6) =>
    noSlash
      ? { initial: false as const, animate: { skewX: skew } }
      : {
          initial: { x: -90, opacity: 0, skewX: skew - 20 },
          animate: { x: 0, opacity: 1, skewX: skew },
          transition: {
            type: 'spring' as const,
            stiffness: 700,
            damping: 24,
            delay: i === 0 ? SLASH_DURATION * 0.6 : SLASH_DURATION * 0.77 + (i - 1) * 0.05,
          },
        };

  const menuStart = Math.max(0, navigationItems.findIndex((item) => item.page === activePage));
  const drawerStart = Math.max(0, DRAWER_PAGES.indexOf(activePage));

  // Opened with the keyboard: put the cursor on the current page right away
  useEffect(() => {
    if (open && menuOpenedByKeyboard.current) menuChoiceRefs.current[menuStart]?.focus({ preventScroll: true });
  }, [open, menuStart]);

  // Load the menu choice sound up front so the first pick plays it instantly
  useEffect(() => {
    preloadSelectionSound();
    preloadMenuOpenSound();
    preloadMenuCloseSounds();
    preloadDrawerSounds();
    preloadTickSound();
  }, []);

  // Close on a click outside the menu or on Escape (closing without picking a page plays the close sounds)
  useEffect(() => {
    if (!open) return;
    const closeMenu = () => {
      playMenuCloseSound();
      setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) closeMenu();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
      // Up/Down move the cursor (skipped when the drawer already used the key)
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !e.defaultPrevented) {
        e.preventDefault();
        moveCursorTo(menuChoiceRefs, menuCursor, stepCursor(menuCursor, e.key, navigationItems.length, menuStart));
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, menuCursor, menuStart]);

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
                const onCursor = menuCursor === i;
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
                      {...cursorProps(menuChoiceRefs, menuCursor, setMenuCursor, i)}
                      onClick={() => handlePageChange(page)}
                      aria-current={active ? 'page' : undefined}
                      className="relative block h-14 w-48 focus-visible:outline-none sm:w-56"
                    >
                      {/* White outline, then the fill, both cut to the same jagged bubble */}
                      <span aria-hidden className="absolute inset-0 bg-foreground" style={{ clipPath: CHOICE_SHAPE }} />
                      <span
                        aria-hidden
                        className={cn('absolute inset-[3px]', active ? 'bg-primary' : 'bg-background')}
                        style={{ clipPath: CHOICE_SHAPE }}
                      />
                      {/* Cursor: one white fill that slides from choice to choice */}
                      {onCursor && (
                        <motion.span
                          layoutId="menu-cursor"
                          aria-hidden
                          transition={cursorTransition}
                          className="pointer-events-none absolute inset-[3px] bg-foreground"
                          style={{ clipPath: CHOICE_SHAPE }}
                        />
                      )}
                      <span
                        className={cn(
                          "relative flex h-full items-center gap-3 pl-6 pr-12 font-display text-lg font-extrabold italic transition-colors",
                          onCursor ? 'text-background' : active ? 'text-primary-foreground' : 'text-foreground'
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
        onClick={(e) => {
          // Opening and closing (X) each play their own sounds; picking a page plays the page sounds instead
          if (!open) {
            playMenuOpenSound();
            setMenuCursor(null);
            menuOpenedByKeyboard.current = e.detail === 0;
          } else playMenuCloseSound();
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
      {/* Decorative scene (Lulyssia, bubbles, butterflies...) while the drawer is open */}
      <DrawerScene open={drawerOpen} />
      <Sheet open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open drawer"
            title="More"
            onClick={(e) => {
              drawerOpenedByKeyboard.current = e.detail === 0;
            }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex h-14 w-9 items-center justify-center border-2 border-l-0 border-foreground/80 bg-card/95 text-foreground backdrop-blur-sm shadow-[4px_4px_0_0_hsl(var(--primary))] transition-[width,color] hover:w-11 hover:text-primary"
          >
            <PanelLeftOpen size={18} />
          </button>
        </SheetTrigger>
        {/* Transparent layer above DrawerScene (which draws the dark panel behind Lulyssia),
            so these items always stay readable and clickable on top of her art */}
        <SheetContent
          ref={drawerContentRef}
          side="left"
          // The slash in DrawerScene opens it, so the sheet's own slide-in is turned off (slide-out stays)
          className={cn(
            // pt: leaves room for a phone's status bar (0 on laptops) when the app runs from the Home Screen
            'z-[60] flex w-72 flex-col gap-3 border-r-0 bg-transparent p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-none focus:outline-none',
            !noSlash && 'data-[state=open]:!animate-none'
          )}
          // Opened with the mouse: no cursor until it moves; opened with the keyboard: on the current page
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            if (drawerOpenedByKeyboard.current) drawerItemRefs.current[drawerStart]?.focus();
            else drawerContentRef.current?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            moveCursorTo(drawerItemRefs, drawerCursor, stepCursor(drawerCursor, e.key, DRAWER_PAGES.length, drawerStart));
          }}
        >
          <motion.div {...snapIn(0, 0)}>
            <SheetHeader className="mb-3 text-left">
              {/* "MENU" in ransom-note cut-out letters (styles in index.css). With the slash, the
                  block snaps in like the rows, then the letters drop onto it one by one */}
              <SheetTitle className="w-fit">
                <span className="sr-only">Menu</span>
                <span
                  aria-hidden
                  className={cn('menu-ransom', !noSlash && 'menu-ransom-drop')}
                  style={{ '--drop-start': `${SLASH_DURATION * 0.6 + 0.12}s` } as React.CSSProperties}
                >
                  {[...'MENU'].map((letter, i) => (
                    <span key={letter} style={{ '--i': i } as React.CSSProperties}>
                      {letter}
                    </span>
                  ))}
                </span>
              </SheetTitle>
              <SheetDescription className="sr-only">Extra pages and shortcuts</SheetDescription>
            </SheetHeader>
          </motion.div>
          <motion.button
            type="button"
            {...cursorProps(drawerItemRefs, drawerCursor, setDrawerCursor, 0)}
            {...snapIn(1)}
            onClick={() => handlePageChange('settings')}
            aria-current={activePage === 'settings' ? 'page' : undefined}
            className={cn(
              'relative flex w-full items-center gap-3 border-2 bg-card/90 px-3 py-2.5 text-left font-semibold transition-colors focus-visible:outline-none',
              activePage === 'settings'
                ? 'border-foreground/80 bg-gradient-to-r from-[#3bc6d4] to-white text-slate-900'
                : cn('border-foreground/30', drawerCursor === 0 && 'text-primary')
            )}
          >
            {drawerCursorMark(0, 'border-primary')}
            <Camera size={18} className="skew-x-6" />
            <span className="flex-1 skew-x-6">Settings</span>
            <ChevronRight size={16} className={cn('skew-x-6 opacity-60 transition-transform', drawerCursor === 0 && 'translate-x-0.5')} />
          </motion.button>
          {/* Sign out: closes the drawer, then asks to confirm */}
          <motion.button
            type="button"
            {...cursorProps(drawerItemRefs, drawerCursor, setDrawerCursor, 1)}
            {...snapIn(2)}
            onClick={() => {
              setDrawerOpen(false);
              setSignOutConfirmOpen(true);
            }}
            className={cn(
              'relative flex w-full items-center gap-3 border-2 border-foreground/30 bg-card/90 px-3 py-2.5 text-left font-semibold transition-colors focus-visible:outline-none',
              drawerCursor === 1 && 'text-destructive'
            )}
          >
            {drawerCursorMark(1, 'border-destructive')}
            <LogOut size={18} className="skew-x-6" />
            <span className="flex-1 skew-x-6">Sign out</span>
            <ChevronRight size={16} className={cn('skew-x-6 opacity-60 transition-transform', drawerCursor === 1 && 'translate-x-0.5')} />
          </motion.button>
          {/* About Lulyssia: opens the About page (profile card + her art) */}
          <motion.button
            type="button"
            {...cursorProps(drawerItemRefs, drawerCursor, setDrawerCursor, 2)}
            {...snapIn(3)}
            onClick={() => handlePageChange('about')}
            aria-current={activePage === 'about' ? 'page' : undefined}
            className={cn(
              'relative flex w-full items-center gap-3 border-2 bg-card/90 px-3 py-2.5 text-left font-semibold transition-colors focus-visible:outline-none',
              activePage === 'about'
                ? 'border-foreground/80 bg-gradient-to-r from-[#3bc6d4] to-white text-slate-900'
                : cn('border-foreground/30', drawerCursor === 2 && 'text-primary')
            )}
          >
            {drawerCursorMark(2, 'border-primary')}
            <Info size={18} className="skew-x-6" />
            <span className="flex-1 skew-x-6">About Lulyssia</span>
            <ChevronRight size={16} className={cn('skew-x-6 opacity-60 transition-transform', drawerCursor === 2 && 'translate-x-0.5')} />
          </motion.button>
        </SheetContent>
      </Sheet>

      <LulyssiaConfirmDialog
        open={signOutConfirmOpen}
        onOpenChange={setSignOutConfirmOpen}
        onConfirm={onSignOut}
        title="Sign out"
        description="You will need to log in again to see your dashboard."
        confirmText="Sign out"
      />
    </div>
  );
};
