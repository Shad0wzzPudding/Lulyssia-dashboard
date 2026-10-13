import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Copy, RefreshCw, Send } from 'lucide-react';
import { LulyssiaConfirmDialog } from './LulyssiaConfirmDialog';
import { STICKERS } from '@/lib/stickers';
import { cn } from '@/lib/utils';

interface LineLink {
  id: string;
  link_code: string;
  line_user_id: string | null;
  display_name: string | null;
  is_enabled: boolean;
  reminders_enabled: boolean;
  overdue_enabled: boolean;
  notice_enabled: boolean;
  /** Requests for today's list (LINE "today" + the button below), counted per Thai day */
  today_requests_date: string | null;
  today_requests_count: number;
}

/** The bot's monthly LINE messages (from line-bot-info): limit null when the plan has none */
interface LineQuota {
  limit: number | null;
  used: number;
}

const LINK_FIELDS =
  'id, link_code, line_user_id, display_name, is_enabled, reminders_enabled, overdue_enabled, notice_enabled, today_requests_date, today_requests_count';

/** Same as TODAY_REQUESTS_PER_DAY in supabase/functions/_shared/lineQuota.ts */
const TODAY_REQUESTS_PER_DAY = 3;

/** Today's date in Thai time, as stored in today_requests_date */
const thaiToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

const generateCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)),
    (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
    
/** scrollToken: when set (a new number each time), the card jumps to the top of the screen */
export const LineSettings = ({ scrollToken = null }: { scrollToken?: number | null }) => {
  const { toast } = useToast();
  const [link, setLink] = useState<LineLink | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [quota, setQuota] = useState<LineQuota | null>(null);
  // Lulyssia's "messages have run out" bubble over the send button
  const [showQuotaPout, setShowQuotaPout] = useState(false);
  // The KEEP OUT tape crosses the whole send button; its tilt comes from the button's width so the
  // ends rise about the same on a phone and on a wide screen
  const [sendWidth, setSendWidth] = useState(0);
  const sendWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sendWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSendWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
    // The button exists once the card has loaded and LINE is linked
  }, [loading, link?.line_user_id]);
  const tapeTilt = sendWidth > 0 ? (Math.atan2(14, sendWidth / 2) * 180) / Math.PI : 4;

  // The bot's LINE id (for the "Open LINE" button) and this month's message usage
  const loadBotInfo = () =>
    supabase.functions
      .invoke('line-bot-info')
      .then(({ data }) => {
        const info = data as { basicId?: string | null; quota?: LineQuota | null } | null;
        if (info?.basicId) setBotId(info.basicId);
        if (info?.quota) setQuota(info.quota);
      })
      .catch(() => { /* bot info unavailable — hide shortcut button and usage */ });

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('line_links')
      .select(LINK_FIELDS)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setLink(data as LineLink);
    } else {
      const { data: created } = await supabase
        .from('line_links')
        .insert({ user_id: userId, link_code: generateCode() })
        .select(LINK_FIELDS)
        .maybeSingle();
      if (created) setLink(created as LineLink);
    }
    setLoading(false);
  };

  // One load at a time (coming back to the app fires both "visible" and "focus"), and none while a
  // switch is saving, so a reload can't put back the old value of a switch just flipped
  const loadingRef = useRef(false);
  const savingRef = useRef(0);

  useEffect(() => {
    const refresh = async () => {
      if (loadingRef.current || savingRef.current > 0) return;
      loadingRef.current = true;
      try {
        await load();
      } finally {
        loadingRef.current = false;
      }
    };

    refresh();
    loadBotInfo();

    // Linking happens in LINE, so check again when coming back to the app (no reload needed)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // Opened from the drawer's LINE chip: jump here right away, and once more when the LINE data has
  // loaded (cards above, like Install app, can appear just after the page opens and push this down)
  useEffect(() => {
    if (scrollToken === null) return;
    cardRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [scrollToken, loading]);

  const regenerate = async () => {
    if (!link) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('line_links')
      .update({ link_code: generateCode(), line_user_id: null, display_name: null, linked_at: null })
      .eq('id', link.id)
      .select(LINK_FIELDS)
      .maybeSingle();
    setBusy(false);
    if (error || !data) {
      toast({ title: 'Could not generate a new code', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    setLink(data as LineLink);
    toast({ title: 'New code generated', description: 'Send it to the bot to link again.' });
  };

  // Switches update right away, then save. Each one changes only its own field
  // (so quick flips of different switches can't undo each other), and it flips
  // back with an error message if saving fails.
  const setLinkFlag = async (field: 'is_enabled' | 'reminders_enabled' | 'overdue_enabled' | 'notice_enabled', value: boolean) => {
    if (!link) return;
    setLink((prev) => (prev ? { ...prev, [field]: value } : prev));
    savingRef.current += 1;
    const { error } = await supabase.from('line_links').update({ [field]: value }).eq('id', link.id);
    savingRef.current -= 1;
    if (error) {
      setLink((prev) => (prev ? { ...prev, [field]: !value } : prev));
      toast({ title: 'Could not save that setting', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const toggleEnabled = (value: boolean) => setLinkFlag('is_enabled', value);
  const toggleReminders = (value: boolean) => setLinkFlag('reminders_enabled', value);
  const toggleOverdue = (value: boolean) => setLinkFlag('overdue_enabled', value);
  const toggleNotice = (value: boolean) => setLinkFlag('notice_enabled', value);

  const sendTest = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('send-line-daily');
    setBusy(false);
    const result = data as { sent?: number; reason?: string; message?: string } | null;
    if (error) {
      toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
    } else if (result?.sent) {
      toast({ title: 'Sent!', description: "Check your LINE chat~" });
    } else if (result?.reason) {
      // Out of requests today, or the month's messages are used up
      toast({ title: 'Not sent', description: result.message, variant: 'destructive' });
    } else {
      toast({ title: 'Nothing sent', description: 'Link your LINE account first.', variant: 'destructive' });
    }
    // The counts changed (or someone else used some): show the new ones
    load();
    loadBotInfo();
  };

  // The clipboard only exists on secure pages (https or localhost); on a local network
  // address like http://192.168.x.x it is missing, so check before claiming success.
  const copyCode = async () => {
    if (!link) return;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(link.link_code);
      toast({ title: 'Copied', description: 'Link code copied to clipboard.' });
    } catch {
      toast({
        title: 'Could not copy',
        description: 'Select the code and copy it manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card ref={cardRef} id="line-settings" className="scroll-mt-4 border-2 border-dotted">
      <LulyssiaConfirmDialog
        open={showUnlinkConfirm}
        onOpenChange={setShowUnlinkConfirm}
        onConfirm={() => {
          setShowUnlinkConfirm(false);
          regenerate();
        }}
        title="Unlink LINE and make a new code?"
        description="A new code also disconnects your LINE account: the morning letter, reminders and nudges stop until you send the new code to the bot."
        confirmText="Yes, unlink"
        cancelText="Wait, no!"
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle size={18} className="text-primary" />
          LINE daily digest
        </CardTitle>
        <CardDescription>
          Get a LINE message every morning at 08:00 (Thai time) with the day's tasks and events — or a
          "your day is clear" note.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !link ? (
          <p className="text-sm text-muted-foreground">Sign in to set up LINE messages.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {link.line_user_id ? (
                <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/15">
                  Linked{link.display_name ? ` · ${link.display_name}` : ''}
                </Badge>
              ) : (
                <Badge variant="secondary">Not linked yet</Badge>
              )}
            </div>

            <div className="rounded-lg border border-dashed p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Add the LINE bot as a friend, then send it this code in the chat:
              </p>
              {botId && (
                <Button
                  className="w-full bg-[#06C755] hover:bg-[#05b04c] text-white"
                  onClick={() =>
                    window.open(
                      `https://line.me/R/oaMessage/${encodeURIComponent(botId)}/?${encodeURIComponent(link.link_code)}`,
                      '_blank',
                      'noopener',
                    )
                  }
                >
                  <MessageCircle size={16} className="mr-2" />
                  Open LINE to link (code pre-filled)
                </Button>
              )}
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-lg font-mono tracking-widest">
                  {link.link_code}
                </code>
                <Button size="icon" variant="outline" onClick={copyCode} aria-label="Copy link code">
                  <Copy size={16} />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  // A new code also unlinks LINE: ask first while it is linked
                  onClick={() => (link.line_user_id ? setShowUnlinkConfirm(true) : regenerate())}
                  disabled={busy}
                  aria-label="Generate a new link code"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                In the chat you can also send <b>status</b>, <b>stop</b>, <b>start</b>,{' '}
                <b>remind on</b>, <b>remind off</b>, <b>notice on</b>, <b>notice off</b>,{' '}
                <b>overdue on</b>, or <b>overdue off</b>.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Daily message</p>
                <p className="text-xs text-muted-foreground">Sent at 08:00 Thai time</p>
              </div>
              <Switch checked={link.is_enabled} onCheckedChange={toggleEnabled} disabled={!link.line_user_id} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Start reminders</p>
                <p className="text-xs text-muted-foreground">
                  Sent 10-15 minutes before a task or event starts
                </p>
              </div>
              <Switch
                checked={link.reminders_enabled}
                onCheckedChange={toggleReminders}
                disabled={!link.line_user_id}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Day-before notice</p>
                <p className="text-xs text-muted-foreground">
                  At 08:00, items marked "Notice before" that start or are due the next day
                </p>
              </div>
              <Switch
                checked={link.notice_enabled}
                onCheckedChange={toggleNotice}
                disabled={!link.line_user_id}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Missed-deadline nudges</p>
                <p className="text-xs text-muted-foreground">
                  When an unfinished task passes its deadline, then each morning for up to 3 days
                </p>
              </div>
              <Switch
                checked={link.overdue_enabled}
                onCheckedChange={toggleOverdue}
                disabled={!link.line_user_id}
              />
            </div>

            {link.line_user_id && (() => {
              const usedToday = link.today_requests_date === thaiToday() ? link.today_requests_count : 0;
              const todayOut = usedToday >= TODAY_REQUESTS_PER_DAY;
              const limit = quota?.limit ?? null;
              const monthOut = limit !== null && quota !== null && quota.used >= limit;
              const monthLow = limit !== null && quota !== null && !monthOut && quota.used >= limit * 0.8;
              return (
                <>
                  <div className="space-y-3 rounded-lg border border-dashed bg-white/60 p-3">
                    {/* Your own requests today */}
                    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5">
                      <p className="text-sm font-medium">Today's list on request</p>
                      <p className={cn('flex items-center gap-2 whitespace-nowrap font-display text-base font-extrabold italic tabular-nums', todayOut && 'text-muted-foreground')}>
                        <span aria-hidden className="flex gap-1">
                          {Array.from({ length: TODAY_REQUESTS_PER_DAY }, (_, i) => (
                            <span key={i} className={cn('h-2 w-3.5 -skew-x-12', i < usedToday ? 'bg-primary' : 'bg-slate-300')} />
                          ))}
                        </span>
                        {usedToday} of {TODAY_REQUESTS_PER_DAY} used today
                      </p>
                      <p className="col-span-2 text-xs text-muted-foreground">
                        {todayOut
                          ? 'Back tomorrow. The 08:00 letter still comes as usual.'
                          : 'LINE "today" and the button below share these. Resets at midnight.'}
                      </p>
                    </div>
                    {/* The bot's shared messages this month */}
                    {quota && limit !== null && (
                      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-medium">Bot messages this month</p>
                        <p className={cn('whitespace-nowrap font-display text-base font-extrabold italic tabular-nums', monthOut ? 'text-red-600' : monthLow && 'text-amber-600')}>
                          {quota.used} / {limit}
                        </p>
                        <div className="col-span-2 h-2 -skew-x-12 overflow-hidden bg-slate-300">
                          <div
                            className={cn('h-full transition-[width]', monthOut ? 'bg-red-600' : monthLow ? 'bg-amber-600' : 'bg-[#06C755]')}
                            style={{ width: `${Math.min(100, (quota.used / limit) * 100)}%` }}
                          />
                        </div>
                        <p className={cn('col-span-2 text-xs', monthOut ? 'font-semibold text-red-600' : 'text-muted-foreground')}>
                          {monthOut
                            ? 'Used up for this month. Messages start again on the 1st.'
                            : monthLow
                              ? `Only ${limit - quota.used} left this month, shared by everyone.`
                              : 'Shared by everyone the bot messages.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Used up for the month: KEEP OUT tape over the button, and Lulyssia explains on
                      hover or tap */}
                  <div
                    ref={sendWrapRef}
                    className="relative"
                    onMouseEnter={() => monthOut && setShowQuotaPout(true)}
                    onMouseLeave={() => setShowQuotaPout(false)}
                  >
                    {monthOut && showQuotaPout && (
                      <div className="absolute inset-x-0 bottom-full z-10 mb-2 flex items-end gap-1.5 animate-scale-in">
                        <img src={STICKERS.no} alt="Lulyssia pouting" className="h-20 w-20 shrink-0 object-contain drop-shadow-md" />
                        <div className="relative mb-5 max-w-[300px] rounded-2xl border-2 border-[#3cb3d2] bg-[#10171c] px-3.5 py-2.5 text-sm font-medium text-[#fafafa] shadow-xl">
                          Hmph. My messages for this month have run out. Wait for the next month, okay? The morning
                          letters will be back on the 1st.
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className={cn('w-full', monthOut && 'bg-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-400')}
                      onClick={() => (monthOut ? setShowQuotaPout((v) => !v) : sendTest())}
                      onBlur={() => setShowQuotaPout(false)}
                      disabled={busy || (todayOut && !monthOut)}
                      aria-label={monthOut ? "Send me today's digest now: this month's messages are used up" : undefined}
                    >
                      <Send size={16} className="mr-2" />
                      {todayOut && !monthOut ? `Used ${TODAY_REQUESTS_PER_DAY} of ${TODAY_REQUESTS_PER_DAY} today · back tomorrow` : "Send me today's digest now"}
                    </Button>
                    {/* Two strips crossing the whole button */}
                    {monthOut &&
                      [-1, 1].map((side) => (
                        <div
                          key={side}
                          aria-hidden
                          className="pointer-events-none absolute -inset-x-1.5 top-1/2 flex h-6 -translate-y-1/2 items-center justify-around overflow-hidden border-y-[3px] border-black bg-[#facc15] shadow-[0_3px_0_rgba(0,0,0,0.25)]"
                          style={{ rotate: `${side * tapeTilt}deg` }}
                        >
                          {Array.from({ length: Math.max(2, Math.round(sendWidth / 220)) }, (_, i) => (
                            <span key={i} className="whitespace-nowrap font-display text-xs font-black italic tracking-[0.12em] text-black">
                              KEEP OUT
                            </span>
                          ))}
                        </div>
                      ))}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </CardContent>
    </Card>
  );
};
