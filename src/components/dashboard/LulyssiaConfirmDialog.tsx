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
  const [lulyssiaMessage] = useState(() => {
    return lulyssiaMessages[Math.floor(Math.random() * lulyssiaMessages.length)];
  });
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
      <AlertDialogContent className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/40 dark:to-purple-950/40 border-2 border-pink-200 dark:border-pink-800 max-w-md w-[calc(100vw-2rem)] [&>*]:min-w-0">
        <AlertDialogHeader className="text-center min-w-0">
          <div className="flex justify-center mb-2">
            <img 
              src={lulyssiaMessage.sticker} 
              alt="Lulyssia" 
              className="w-20 h-20 object-contain animate-bounce"
            />
          </div>
          <AlertDialogTitle className="text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent font-bold">
            {fillNames(lulyssiaMessage.text, names)}
          </AlertDialogTitle>
          <div className="py-3 min-w-0 w-full">
            <p className="text-base font-semibold text-pink-700 dark:text-pink-300 break-all">
              {title}
            </p>
            <AlertDialogDescription className="text-sm text-pink-600/80 dark:text-pink-400/80 mt-2 break-all max-h-40 overflow-y-auto">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            type="button"
            onClick={() => {
              console.log("Cancel button onClick fired");
              playCancelSound();
              onOpenChange(false);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              console.log("Cancel button onTouchEnd fired");
              playCancelSound();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/50"
          >
            {cancelText}
          </Button>
          <AlertDialogAction
            onClick={() => {
              justConfirmedRef.current = true;
              handleConfirmClick(onConfirm);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};