import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import lulyssiaChibi from '@/assets/image/lulyssia_trigger_chibi.png';
import { SkillCutIn, SKILL_CUT_IN_DURATION } from '@/components/dashboard/SkillCutIn';
import { playTriggerSound, preloadTriggerSound } from '@/lib/sounds';
import type { User, Session } from '@supabase/supabase-js';
import { useUserNames } from '@/hooks/useUserNames';

const Index = () => {
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const { names } = useUserNames();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCutIn, setShowCutIn] = useState(false);
  const cutInPlaying = useRef(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session) {
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
  }, [navigate]);
  
  const { 
    interests, 
    tasks, 
    dailyTasks,
    events, 
    activityLog, 
    isLoading: dataLoading, 
    error, 
    mutations 
  } = useDashboardData();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    preloadTriggerSound();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Something went wrong loading your dashboard</p>
          <p className="text-sm text-muted-foreground">Please refresh the page to try again</p>
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
          />
        );
      case 'interests':
        return (
          <InterestsPage 
            interests={interests}
            onCreateInterest={mutations.createInterest.mutate}
            onUpdateInterest={mutations.updateInterest.mutate}
            onDeleteInterest={mutations.deleteInterest.mutate}
          />
        );
      case 'tasks':
        return (
          <TasksPage 
            tasks={tasks}
            onCreateTask={mutations.createTask.mutate}
            onUpdateTask={mutations.updateTask.mutate}
            onDeleteTask={mutations.deleteTask.mutate}
            onClearCompleted={mutations.clearCompletedTasks.mutate}
            dailyTasks={dailyTasks}
            onCreateDailyTask={mutations.createDailyTask.mutate}
            onUpdateDailyTask={mutations.updateDailyTask.mutate}
            onDeleteDailyTask={mutations.deleteDailyTask.mutate}
          />
        );
      case 'events':
        return (
          <EventsPage 
            events={events}
            onCreateEvent={mutations.createEvent.mutate}
            onUpdateEvent={mutations.updateEvent.mutate}
            onDeleteEvent={mutations.deleteEvent.mutate}
            onClearPast={mutations.clearPastEvents.mutate}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };




  return (
    <div className="min-h-screen">
      {/* Top Navigation with User Info */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-start h-16">
            <Navigation activePage={activePage} onPageChange={setActivePage} />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {names.nickname || user.email} !
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 pt-8 pb-28">
        <WelcomeMessage />
        
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
              className="fixed bottom-20 left-0 w-20 h-20 pointer-events-none z-50"
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
              className="fixed bottom-6 left-6 z-50"
            >
              <Button
                variant="default"
                size="icon"
                className="rounded-full shadow-lg"
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
                      className: 'border-2 border-primary border-l-[6px] bg-black',
                      description: (
                        <div className="flex items-center gap-3">
                          <img src={lulyssiaChibi} alt="Lulyssia" className="w-11 h-11 object-contain" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase italic tracking-widest text-primary">
                              Trigger activated
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
    </div>
  );
};

export default Index;
