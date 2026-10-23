import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HoldButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  /** Runs once the button has been held down for `holdMs` (or pressed from the keyboard) */
  onHold: () => void;
  holdMs?: number;
  /** Shown in place of the label for a moment after a press that was let go too early */
  hint?: string;
  children: ReactNode;
};

/**
 * A button that has to be pressed and held, for actions a stray click shouldn't start (e.g. "Clear
 * Completed", which sits where "Undo" was a moment earlier). A fill sweeps across while it is held;
 * letting go early cancels and shows the hint. Enter or Space from the keyboard still work with a
 * normal press: nobody double-clicks there by accident.
 */
export const HoldButton = ({ onHold, holdMs = 700, hint = 'Hold to confirm', children, className, ...props }: HoldButtonProps) => {
  const [holding, setHolding] = useState(false);
  const [hinting, setHinting] = useState(false);
  const timer = useRef<number>();
  const hintTimer = useRef<number>();

  const stop = (tooEarly: boolean) => {
    if (timer.current === undefined) return;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
    if (tooEarly) {
      setHinting(true);
      window.clearTimeout(hintTimer.current);
      hintTimer.current = window.setTimeout(() => setHinting(false), 1500);
    }
  };

  useEffect(() => () => {
    window.clearTimeout(timer.current);
    window.clearTimeout(hintTimer.current);
  }, []);

  return (
    <Button
      {...props}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        setHinting(false);
        setHolding(true);
        timer.current = window.setTimeout(() => {
          timer.current = undefined;
          setHolding(false);
          onHold();
        }, holdMs);
      }}
      onPointerUp={() => stop(true)}
      onPointerLeave={() => stop(false)}
      onPointerCancel={() => stop(false)}
      // A pointer click is handled by the hold above; only a keyboard press (detail 0) runs here
      onClick={(e) => { if (e.detail === 0) onHold(); }}
      // A long press on a phone would otherwise open the browser's own menu
      onContextMenu={(e) => e.preventDefault()}
      className={cn('relative select-none overflow-hidden [-webkit-touch-callout:none] [touch-action:manipulation]', className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 bg-destructive/25"
        style={{ width: holding ? '100%' : '0%', transition: holding ? `width ${holdMs}ms linear` : 'none' }}
      />
      <span className="relative flex items-center">{hinting ? hint : children}</span>
    </Button>
  );
};
