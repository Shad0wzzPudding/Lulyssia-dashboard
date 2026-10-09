import { toast as sonnerToast, type ExternalToast } from 'sonner';
import { pickRandom, TOAST_LINES, type ToastMood } from '@/lib/stickers';

type Message = Parameters<typeof sonnerToast>[0];

const stickerIcon = (src: string) => <img src={src} alt="" className="h-full w-full object-contain" />;

// Lulyssia's sticker beside the message, and one of her lines under it
const withLine = (mood: ToastMood, show: (message: Message, data?: ExternalToast) => string | number) =>
  (message: Message, data?: ExternalToast) => {
    const line = pickRandom(TOAST_LINES[mood]);
    return show(message, { icon: stickerIcon(line.sticker), description: line.text, ...data });
  };

/**
 * Sonner's toast with Lulyssia on it. toast.success / toast.error add a fitting sticker
 * and line; plain toast() is for messages already in her voice, so it only adds a sticker.
 */
export const toast = Object.assign(
  (message: Message, data?: ExternalToast) =>
    sonnerToast(message, { icon: stickerIcon(pickRandom(TOAST_LINES.info).sticker), ...data }),
  {
    success: withLine('success', sonnerToast.success),
    error: withLine('error', sonnerToast.error),
  },
);
