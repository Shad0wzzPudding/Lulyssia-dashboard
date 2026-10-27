import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { NavigationPage } from '@/lib/types';
import { useDashboardData } from '@/hooks/useDashboardData';
import { WelcomeMessage } from '@/components/dashboard/WelcomeMessage';
import { Navigation } from '@/components/dashboard/Navigation';
import { HomePage } from '@/components/dashboard/HomePage';
import { InterestsPage } from '@/components/dashboard/InterestsPage';
import { TasksPage } from '@/components/dashboard/TasksPage';
import { EventsPage } from '@/components/dashboard/EventsPage';
import { SettingsPage } from '@/components/dashboard/SettingsPage';
import { AboutPage } from '@/components/dashboard/AboutPage';

import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import lulyssiaChibi from '@/assets/emote/lulyssia_trigger_chibi.webp';
import { SkillCutIn, SKILL_CUT_IN_DURATION } from '@/components/dashboard/SkillCutIn';
import { CrowdTransition, CROWD_TRANSITION_MS, CROWD_TRANSITION_DELAY_MS } from '@/components/dashboard/CrowdTransition';
import { usePageTransitions } from '@/hooks/usePageTransitions';
import { playTriggerSound, preloadTriggerSound, playTrainSound, preloadTrainSound } from '@/lib/sounds';
import type { User, Session } from '@supabase/supabase-js';
import { useUserNames } from '@/hooks/useUserNames';

/**
 * Shown under a loading spinner once it has taken a while. Opened offline with an expired
 * sign-in, the check keeps retrying until the connection is back, which looked stuck.
 */
const SlowConnectionHint = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!show) return null;
  return (
    <p className="mt-2 max-w-sm px-4 text-sm text-muted-foreground">
      Still connecting... Check your internet connection. It carries on by itself once you're back online.
    </p>
  );
};

// The installed app's "Add Task" shortcut opens /?action=add-task. The request is kept for this tab
// until the dashboard has loaded (sign-in may come first), and taken out of the address so a reload
// or going back doesn't open the form again. Any other action is ignored.
const PENDING_ACTION_KEY = 'pendingAction';
const takeShortcutFromAddress = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') !== 'add-task') return;
  try {
    sessionStorage.setItem(PENDING_ACTION_KEY, 'add-task');
  } catch { /* storage unavailable: the form just won't open */ }
  params.delete('action');
  const query = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
};
const consumePendingAction = () => {
  try {
    const action = sessionStorage.getItem(PENDING_ACTION_KEY);
    sessionStorage.removeItem(PENDING_ACTION_KEY);
    return action;
  } catch {
    return null;
  }
};

const Index = () => {
  // Read once, before anything can send a signed-out visitor to the sign-in page
  useState(takeShortcutFromAddress);
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const { names } = useUserNames();

  // Page changes play the crowd transition; the page switches while the screen is covered.
  // It can be turned off per device in Settings > Display.
  const transitionsEnabled = usePageTransitions();
  const [pageTransitionId, setPageTransitionId] = useState<number | null>(null);
  const pendingPage = useRef<NavigationPage | null>(null);
  // Set (a new number each time) when the Tasks page should open the new-task form
  const [newTaskRequest, setNewTaskRequest] = useState<number | null>(null);
  // A new page always opens at the top (instant, not the smooth scroll-to-top button). Any page
  // change lets go of the "Add Task" request, or coming back to Tasks would open the form again.
  const showPage = (page: NavigationPage) => {
    setActivePage(page);
    setNewTaskRequest(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  // Opened from the drawer's LINE chip: Settings jumps to its LINE card (a new number each time,
  // so a second tap while already on Settings jumps again)
  const [lineFocus, setLineFocus] = useState<number | null>(null);
  const navigateTo = (page: NavigationPage, focus?: 'line') => {
    if (pageTransitionId !== null) return;
    setLineFocus(focus === 'line' ? Date.now() : null);
    if (page === activePage) return;
    if (!transitionsEnabled) {
      showPage(page);
      return;
    }
    pendingPage.current = page;
    // Scheduled here, in the click handler, so phones allow the sound.
    // It starts after the same short delay as the animation, so the tap sound is heard first.
    playTrainSound(CROWD_TRANSITION_MS, CROWD_TRANSITION_DELAY_MS);
    setPageTransitionId(Date.now());
  };
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCutIn, setShowCutIn] = useState(false);
  const cutInPlaying = useRef(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session) {
          // Signed out (here or in another tab): drop the cached data so the next
          // account on this browser never sees the previous one's items
          queryClient.clear();
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, queryClient]);
  
  const { 
    interests, 
    tasks, 
    dailyTasks,
    dailyTasksStale,
    events, 
    activityLog, 
    isLoading: dataLoading, 
    error, 
    refreshFailed,
    mutations 
  } = useDashboardData();

  // A failed refresh (e.g. briefly offline) keeps the dashboard and any open form; just say so
  useEffect(() => {
    if (refreshFailed) {
      toast({ title: "Couldn't refresh your dashboard", description: 'Showing what was already loaded. It will try again when you come back to the app.', variant: 'destructive' });
    }
  }, [refreshFailed]);

  // The "Add Task" shortcut: once signed in and loaded, go straight to Tasks (no train, it isn't a
  // page change the person made) with the new-task form open
  useEffect(() => {
    if (!user || dataLoading || error) return;
    if (consumePendingAction() !== 'add-task') return;
    showPage('tasks');
    setNewTaskRequest(Date.now());
  }, [user, dataLoading, error]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    preloadTriggerSound();
    preloadTrainSound();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
          <SlowConnectionHint />
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return null; // Will redirect to auth page via useEffect
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
          <SlowConnectionHint />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Something went wrong loading your dashboard</p>
          {/* The installed app has no reload button; it also tries again by itself once back online */}
          <p className="text-sm text-muted-foreground mb-4">Check your connection, then try again</p>
          <Button onClick={() => queryClient.refetchQueries({ type: 'active' })}>Try again</Button>
        </div>
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return (
          <HomePage 
            interests={interests}
            tasks={tasks}
            events={events}
            activityLog={activityLog}
            onUpdateInterest={mutations.updateInterest.mutate}
            onDeleteActivityLog={mutations.deleteActivityLog.mutate}
            onRevertActivityLog={mutations.revertActivityLog.mutate}
            onCreateTask={mutations.createTask.mutate}
            onUpdateTask={mutations.updateTask.mutate}
            onCreateEvent={mutations.createEvent.mutate}
            onUpdateEvent={mutations.updateEvent.mutate}
          />
        );
      case 'interests':
        return (
          <InterestsPage 
            interests={interests}
            onCreateInterest={mutations.createInterest.mutate}
            onUpdateInterest={mutations.updateInterest.mutate}
            onReorder={mutations.reorderItems.mutate}
            onDeleteInterest={mutations.deleteInterest.mutate}
            onDeleteInterests={mutations.deleteInterests.mutate}
          />
        );
      case 'tasks':
        return (
          <TasksPage 
            tasks={tasks}
            onCreateTask={mutations.createTask.mutate}
            onUpdateTask={mutations.updateTask.mutate}
            onReorder={mutations.reorderItems.mutate}
            onDeleteTask={mutations.deleteTask.mutate}
            onDeleteTasks={mutations.deleteTasks.mutate}
            onClearCompleted={mutations.clearCompletedTasks.mutate}
            onRestoreTasks={(items) => mutations.restoreClearedItems.mutate({ table: 'tasks', items })}
            dailyTasks={dailyTasks}
            dailyTasksStale={dailyTasksStale}
            onCreateDailyTask={mutations.createDailyTask.mutate}
            onUpdateDailyTask={mutations.updateDailyTask.mutate}
            onDeleteDailyTask={mutations.deleteDailyTask.mutate}
            newTaskRequest={newTaskRequest}
          />
        );
      case 'events':
        return (
          <EventsPage 
            events={events}
            onCreateEvent={mutations.createEvent.mutate}
            onUpdateEvent={mutations.updateEvent.mutate}
            onReorder={mutations.reorderItems.mutate}
            onDeleteEvent={mutations.deleteEvent.mutate}
            onDeleteEvents={mutations.deleteEvents.mutate}
            onClearPast={mutations.clearPastEvents.mutate}
            onRestoreEvents={(items) => mutations.restoreClearedItems.mutate({ table: 'events', items })}
          />
        );
      case 'settings':
        return <SettingsPage lineFocus={lineFocus} />;
      case 'about':
        return <AboutPage />;
      default:
        return null;
    }
  };




  // On the About page, Lulyssia's art hangs past the bottom of the page on wider screens:
  // cut it off at the page's bottom edge instead of making the page scroll further
  const isAbout = activePage === 'about';

  return (
    <div className={`min-h-screen ${isAbout ? 'md:overflow-y-clip' : ''}`}>
      {/* Top Navigation with User Info (below an iPhone's see-through status bar in the installed app) */}
      <div className="border-b bg-card pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-start h-16">
            <Navigation
              activePage={activePage}
              onPageChange={navigateTo}
              onOpenLineSettings={() => navigateTo('settings', 'line')}
              onSignOut={handleSignOut}
            />
            <div className="flex min-w-0 items-center gap-4">
              {/* An email (shown when no nickname is set) can't wrap at spaces: break it if needed */}
              <span className="min-w-0 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                Welcome, {names.nickname || user.email} !
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* On the About page this is where Lulyssia's art is anchored (over the greeting) */}
      <div className={`container mx-auto px-4 pt-8 pb-28 ${isAbout ? 'md:relative' : ''}`}>
        {/* New greeting on every page change (under the crowd transition when it plays) */}
        <WelcomeMessage key={activePage} />
        
        <main className="max-w-6xl mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Persona-style skill cut-in when scrolling to top */}
      <SkillCutIn show={showCutIn} />

      <AnimatePresence>
        {showScrollTop && (
          <>
            {/* Chibi Lulyssia peeking from left edge */}
            <motion.div
              className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 w-20 h-20 pointer-events-none z-50"
              initial={{ x: -60, opacity: 0, scale: 0.8 }}
              animate={{ x: -8, opacity: 1, scale: 1 }}
              exit={{ x: -60, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Mirrored so she faces into the page from the left edge */}
              <div className="w-full h-full" style={{ transform: 'scaleX(-1)' }}>
                <motion.img
                  src={lulyssiaChibi}
                  alt="Lulyssia"
                  className="w-full h-full object-contain drop-shadow-[0_0_6px_hsl(var(--primary)/0.7)]"
                  // Idle float while waiting; a quick "cast" pop when the skill fires
                  animate={
                    showCutIn
                      ? { y: [0, -8, 0], scale: [1, 1.25, 1], rotate: 0 }
                      : { y: [0, -6, 0], scale: 1, rotate: [0, 3, 0] }
                  }
                  transition={
                    showCutIn
                      ? { duration: 0.4, ease: 'easeOut' }
                      : { duration: 2.4, ease: 'easeInOut', repeat: Infinity }
                  }
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.15 }}
              className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-6 z-50"
            >
              <Button
                variant="default"
                size="icon"
                className="rounded-full shadow-lg"
                aria-label="Back to top"
                title="Back to top"
                onClick={() => {
                  // Ignore extra clicks while the cut-in is still on screen
                  if (cutInPlaying.current) return;
                  cutInPlaying.current = true;
                  playTriggerSound();
                  setShowCutIn(true);
                  setTimeout(() => {
                    setShowCutIn(false);
                    cutInPlaying.current = false;
                  }, SKILL_CUT_IN_DURATION);
                  const quotes = [
                    "Back to the top. Don't fall behind~",
                    "Target locked. Returning to base!",
                    "Too slow~ I'm already at the top.",
                    "One strike, and we're back where it started.",
                    "Showtime's over. Back to the top~",
                    "Did you see that? Of course you didn't~",
                    "Path cleared. Lulyssia never misses!",
                    "Retreat? No. A tactical return~",
                  ];
                  const quote = quotes[Math.floor(Math.random() * quotes.length)];
                  setTimeout(() => {
                    toast({
                      mood: false, // has its own chibi art
                      className: 'border-2 border-primary border-l-[6px] bg-black',
                      description: (
                        <div className="flex items-center gap-3">
                          <img src={lulyssiaChibi} alt="Lulyssia" className="w-11 h-11 object-contain" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase italic tracking-widest text-primary">
                              Skill activated
                            </span>
                            <span className="text-sm font-medium">{quote}</span>
                          </div>
                        </div>
                      ),
                      duration: 2500,
                    });
                  }, SKILL_CUT_IN_DURATION);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Crowd page transition (covers the screen, page switches underneath) */}
      {pageTransitionId !== null && (
        <CrowdTransition
          key={pageTransitionId}
          onCovered={() => {
            if (pendingPage.current) showPage(pendingPage.current);
          }}
          onDone={() => {
            pendingPage.current = null;
            setPageTransitionId(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
