import { useState, useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { STICKERS, pickRandom } from '@/lib/stickers';
import { playLulyssiaSound, playConfirmSound, playCancelSound } from '@/lib/sounds';
import { useUserNames } from '@/hooks/useUserNames';
import { fillNames } from '@/lib/names';

interface LulyssiaConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

const handleConfirmClick = (onConfirm: () => void) => {
  playConfirmSound();
  onConfirm();
};

// Cancel button just closes the dialog - sound is handled by handleOpenChange
const handleCancelClick = (onOpenChange: (open: boolean) => void) => {
  onOpenChange(false);
};

const lulyssiaMessages = [
  { text: "Objection! Think this through first.", sticker: STICKERS.objection },
  { text: "Hold on, {nickname}.", sticker: STICKERS.restPointing },
  { text: "Are you really sure about this?", sticker: STICKERS.suspicious },
  { text: "Hmm... let me consider this for a moment.", sticker: STICKERS.contemplate },
  { text: "Wha-! You're doing what?", sticker: STICKERS.startle },
  { text: "I'd rather you didn't... but it's your call.", sticker: STICKERS.no },
  { text: "Um... are we sure this is a good idea?", sticker: STICKERS.unconfident },
  { text: "Let me take a picture first, just in case.", sticker: STICKERS.polaroid },
  { text: "Hmhm~ hope you won't regret this.", sticker: STICKERS.mocking },
  { text: "Let me finish my coffee before you decide.", sticker: STICKERS.coffee },
  { text: "You woke me up for this? Fine, decide.", sticker: STICKERS.sleepAnnoyed },
  { text: "Too many choices... just confirm it, okay?", sticker: STICKERS.notSoChill },
];

export const LulyssiaConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Yes, I'm sure!",
  cancelText = "Nevermind~"
}: LulyssiaConfirmDialogProps) => {
  const pickMessage = () => pickRandom(lulyssiaMessages);
  const [lulyssiaMessage, setLulyssiaMessage] = useState(pickMessage);
  // Pick a new line each time the dialog opens (it used to be picked once per page
  // load, so every confirmation showed the same line). Done while rendering the
  // opening, so the previous line never flashes and it doesn't change while closing.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setLulyssiaMessage(pickMessage());
  }
  const { names } = useUserNames();
  const justConfirmedRef = useRef(false);

  // Play sound when dialog opens
  useEffect(() => {
    if (open) {
      playLulyssiaSound();
    }
  }, [open]);

  // Intercept all close attempts (clicking outside, pressing Escape, etc.)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // Dialog is being closed - play cancel sound,
      // unless we just confirmed (confirm sound already played).
      if (justConfirmedRef.current) {
        justConfirmedRef.current = false;
      } else {
        playCancelSound();
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-card border-2 border-foreground/80 shadow-[6px_6px_0_0_hsl(var(--primary))] max-w-md w-[calc(100vw-2rem)] [&>*]:min-w-0">
        <AlertDialogHeader className="text-center min-w-0">
          <div className="flex justify-center mb-2">
            <img 
              src={lulyssiaMessage.sticker} 
              alt="Lulyssia" 
              className="w-20 h-20 object-contain animate-bounce"
            />
          </div>
          <AlertDialogTitle className="text-xl text-primary">
            {fillNames(lulyssiaMessage.text, names)}
          </AlertDialogTitle>
          <div className="py-3 min-w-0 w-full">
            <p className="text-base font-semibold text-foreground break-all">
              {title}
            </p>
            <AlertDialogDescription className="text-sm text-muted-foreground mt-2 break-all max-h-40 overflow-y-auto">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            type="button"
            onClick={() => {
              playCancelSound();
              onOpenChange(false);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              playCancelSound();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto border-foreground/40 hover:border-primary hover:text-primary"
          >
            {cancelText}
          </Button>
          <AlertDialogAction
            onClick={() => {
              justConfirmedRef.current = true;
              handleConfirmClick(onConfirm);
            }}
            className="w-full sm:w-auto font-semibold"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};