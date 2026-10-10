// Shared pieces of Lulyssia's LINE cards (Flex Messages): the morning letter, the starting-soon
// reminder and the missed-deadline nudge. Banners are PNGs on the site (public/line-cards/),
// drawn from art-source/line-cards/banners.html.

export const SITE_URL = 'https://personal-dashboard-opal-gamma.vercel.app';

export type FlexComponent = Record<string, unknown>;
export type FlexMessage = { type: 'flex'; altText: string; contents: FlexComponent };

export const CARD = {
  bg: '#10171C',
  item: '#18232A',
  ink: '#EAF6F9',
  muted: '#A9C3CC',
  detail: '#C9DBE1',
  date: '#8FB3BF',
  neon: '#5EE3F0',
  cyan: '#3AADD0',
  dark: '#04131A',
  chip: '#BFEEF7',
  line: '#24323A',
  warn: '#FACC15',
};

// LINE limits one card's layout to about 30 KB; stay well under it
export const CARD_MAX_CHARS = 24000;

export const flexText = (text: string, extra: FlexComponent = {}): FlexComponent => ({
  type: 'text',
  text,
  wrap: true,
  ...extra,
});

/** "🕒 16:00 – 18:00", "🕒 Starts 08:00", "🕒 Due 23:59", or null when the item has no times. */
export function timeRange(start: string | null, due: string | null): string | null {
  if (start && due) return `🕒 ${start} – ${due}`;
  if (start) return `🕒 Starts ${start}`;
  if (due) return `🕒 Due ${due}`;
  return null;
}

/** A light-cyan "🏷 School, Homework" chip. */
export const tagChip = (tags: string): FlexComponent => ({
  type: 'box',
  layout: 'horizontal',
  contents: [{
    type: 'box',
    layout: 'vertical',
    flex: 0,
    backgroundColor: CARD.chip,
    cornerRadius: '4px',
    paddingStart: '6px',
    paddingEnd: '6px',
    contents: [flexText(`🏷 ${tags}`, { size: 'xs', weight: 'bold', color: CARD.dark })],
  }],
});

/** "Starts   16:00" — a muted label and a bold value on one line. */
export const labelRow = (label: string, value: string, valueColor: string = CARD.ink): FlexComponent => ({
  type: 'box',
  layout: 'baseline',
  spacing: 'md',
  contents: [
    flexText(label, { size: 'sm', color: CARD.date, flex: 0 }),
    flexText(value, { size: 'sm', weight: 'bold', color: valueColor, flex: 1 }),
  ],
});

/** A full card: banner on top (tapping it opens the dashboard), dark body, one button. */
export function lineCard(opts: {
  banner: string;
  altText: string;
  body: FlexComponent[];
  button: string;
  size?: 'kilo' | 'mega';
}): FlexMessage {
  return {
    type: 'flex',
    altText: opts.altText.slice(0, 400),
    contents: {
      type: 'bubble',
      size: opts.size ?? 'mega',
      hero: {
        type: 'image',
        url: `${SITE_URL}/line-cards/${opts.banner}.png`,
        size: 'full',
        aspectRatio: '26:10',
        aspectMode: 'cover',
        action: { type: 'uri', uri: SITE_URL },
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: CARD.bg,
        paddingAll: '14px',
        spacing: 'md',
        contents: opts.body,
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: CARD.bg,
        paddingAll: '14px',
        paddingTop: '0px',
        contents: [{
          type: 'button',
          style: 'primary',
          color: CARD.cyan,
          height: 'sm',
          action: { type: 'uri', label: opts.button, uri: SITE_URL },
        }],
      },
    },
  };
}
