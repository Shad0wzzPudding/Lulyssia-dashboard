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
import lulyssiaExcited from '@/assets/lulyssia-excited.png';
import lulyssiaWinking from '@/assets/lulyssia-winking.png';
import lulyssiaHappy from '@/assets/lulyssia-happy.png';
import lulyssiaCandy from '@/assets/lulyssia-candy.png';
import lulyssiaProud from '@/assets/lulyssia-proud.png';
import lulyssiaWelcoming from '@/assets/lulyssia-welcoming.png';
import lulyssiaConfident from '@/assets/lulyssia-confident.png';
import lulyssiaTg04 from '@/assets/lulyssia-tg-04.webp';
import lulyssiaTg05 from '@/assets/lulyssia-tg-05.webp';
import lulyssiaTg06 from '@/assets/lulyssia-tg-06.webp';
import lulyssiaTg07 from '@/assets/lulyssia-tg-07.webp';
import lulyssiaTg10 from '@/assets/lulyssia-tg-10.webp';
import lulyssiaTg11 from '@/assets/lulyssia-tg-11.webp';
import lulyssiaTg12 from '@/assets/lulyssia-tg-12.webp';
import lulyssiaTg13 from '@/assets/lulyssia-tg-13.webp';
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
  { text: "Whoa, wait a second!", sticker: lulyssiaExcited },
  { text: "Hold up, {nickname}!", sticker: lulyssiaWinking },
  { text: "Are you really sure??", sticker: lulyssiaExcited },
  { text: "Eep! Think it through, okay?", sticker: lulyssiaHappy },
  { text: "Wait wait wait — sweet treat first?", sticker: lulyssiaCandy },
  { text: "Trust me, double-check this one!", sticker: lulyssiaProud },
  { text: "Heyy, are we really doing this?", sticker: lulyssiaWelcoming },
  { text: "Hmph, I hope you know what you're doing!", sticker: lulyssiaConfident },
  { text: "Make a wish before you decide~", sticker: lulyssiaTg04 },
  { text: "Snack break first? ...No? Okay then!", sticker: lulyssiaTg05 },
  { text: "Hmph! Don't blame me if you regret it!", sticker: lulyssiaTg06 },
  { text: "Pretty please, think it over again?", sticker: lulyssiaTg07 },
  { text: "Ehehe, last chance to back out!", sticker: lulyssiaTg10 },
  { text: "Vacation later — decide first!", sticker: lulyssiaTg11 },
  { text: "Waaah, this is a scary choice!", sticker: lulyssiaTg12 },
  { text: "Staring at you... are you sure?", sticker: lulyssiaTg13 },
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
  const pickMessage = () => lulyssiaMessages[Math.floor(Math.random() * lulyssiaMessages.length)];
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