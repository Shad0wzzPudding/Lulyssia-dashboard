import coffee from '@/assets/emote/lulyssia_coffee.webp';
import contemplate from '@/assets/emote/lulyssia_contemplate.webp';
import mocking from '@/assets/emote/lulyssia_mocking.webp';
import no from '@/assets/emote/lulyssia_no.webp';
import notSoChill from '@/assets/emote/lulyssia_notsochill.webp';
import objection from '@/assets/emote/lulyssia_objection.webp';
import polaroid from '@/assets/emote/lulyssia_polaroid.webp';
import resting from '@/assets/emote/lulyssia_resting.webp';
import restPointing from '@/assets/emote/lulyssia_restpointing.webp';
import ritualing from '@/assets/emote/lulyssia_ritualing.webp';
import sleep from '@/assets/emote/lulyssia_sleep.webp';
import sleepAnnoyed from '@/assets/emote/lulyssia_sleep_annoyed.webp';
import startle from '@/assets/emote/lulyssia_startle.webp';
import suspicious from '@/assets/emote/lulyssia_suspicious.webp';
import triggerChibi from '@/assets/emote/lulyssia_trigger_chibi.webp';
import unconfident from '@/assets/emote/lulyssia_unconfident.webp';
import yes from '@/assets/emote/lulyssia_yes.webp';

/** Lulyssia's sticker set, by expression. */
export const STICKERS = {
  coffee,
  contemplate,
  mocking,
  no,
  notSoChill,
  objection,
  polaroid,
  resting,
  restPointing,
  ritualing,
  sleep,
  sleepAnnoyed,
  startle,
  suspicious,
  triggerChibi,
  unconfident,
  yes,
} as const;

export type StickerLine = { text: string; sticker: string };

export const pickRandom = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/**
 * Short lines Lulyssia adds under a toast, each with the sticker that fits it.
 * success: something was saved/done; error: something failed; info: anything else.
 */
export type ToastMood = 'success' | 'error' | 'info';

export const TOAST_LINES: Record<ToastMood, StickerLine[]> = {
  success: [
    { text: 'Good. Exactly as I deduced.', sticker: STICKERS.yes },
    { text: 'Nicely done. You have my approval~', sticker: STICKERS.yes },
    { text: 'Filed away. Now, where was my coffee...', sticker: STICKERS.coffee },
    { text: 'Noted over a sip of coffee ☕', sticker: STICKERS.coffee },
    { text: "See? That wasn't so hard.", sticker: STICKERS.restPointing },
    { text: 'Snap. Logged as evidence.', sticker: STICKERS.polaroid },
    { text: 'Hmhm~ took you long enough.', sticker: STICKERS.mocking },
    { text: 'Case closed 🦋', sticker: STICKERS.triggerChibi },
    { text: 'All in order. I checked twice.', sticker: STICKERS.ritualing },
  ],
  error: [
    { text: "Nope. That one didn't go through.", sticker: STICKERS.no },
    { text: 'Wha-! Something went wrong!', sticker: STICKERS.startle },
    { text: 'Um... I may have dropped that one.', sticker: STICKERS.unconfident },
    { text: 'Too much at once... give it a moment and try again.', sticker: STICKERS.notSoChill },
    { text: 'Ugh. Wake me when the server behaves.', sticker: STICKERS.sleepAnnoyed },
    { text: 'Objection! That was refused.', sticker: STICKERS.objection },
    { text: 'Suspicious... that should have worked.', sticker: STICKERS.suspicious },
  ],
  info: [
    { text: 'Hmm... interesting.', sticker: STICKERS.contemplate },
    { text: "I'll keep an eye on it.", sticker: STICKERS.suspicious },
    { text: 'Leave the rest to me.', sticker: STICKERS.ritualing },
    { text: 'Noted~', sticker: STICKERS.resting },
    { text: "I'll remember that.", sticker: STICKERS.polaroid },
    { text: 'Just so you know~', sticker: STICKERS.restPointing },
  ],
};
