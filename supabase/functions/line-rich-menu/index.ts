// One-off setup: creates the LINE rich menu (chat buttons) and sets it as default.
// POST (no body needed) with header x-cron-secret.
// The menu has two pages, switched by the tabs along its top: "Choice" (today, notice, status, open
// app; opens first) and "Settings" (the on/off switches). Their pictures are public/line-menu/*.jpg
// on the website (source: docs/line-rich-menu.html), so the site must be deployed with them first.
const LINE_API = 'https://api.line.me/v2/bot';
const SITE_URL = 'https://personal-dashboard-opal-gamma.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const WIDTH = 2500;
const HEIGHT = 1686;
// The tab strip along the top, and the footer strip along the bottom (no button)
const TABS_BOTTOM = 208;
const BUTTONS_BOTTOM = 1624;

// Postback data starting with this only switches pages; line-webhook ignores it (keep in step)
const MENU_SWITCH_PREFIX = 'menu-switch:';

type Bounds = { x: number; y: number; width: number; height: number };
type Area = { bounds: Bounds; action: Record<string, string> };

const ALIASES = { choice: 'lulyssia-choice', settings: 'lulyssia-settings' } as const;

const box = (x: number, y: number, right: number, bottom: number): Bounds =>
  ({ x, y, width: right - x, height: bottom - y });

const command = (label: string, data: string) => ({ type: 'postback', label, data, displayText: label });

// Both pages: CHOICE on the left half of the top strip, SETTINGS on the right
const tabAreas = (): Area[] => [
  {
    bounds: box(0, 0, WIDTH / 2, TABS_BOTTOM),
    action: { type: 'richmenuswitch', richMenuAliasId: ALIASES.choice, data: `${MENU_SWITCH_PREFIX}choice` },
  },
  {
    bounds: box(WIDTH / 2, 0, WIDTH, TABS_BOTTOM),
    action: { type: 'richmenuswitch', richMenuAliasId: ALIASES.settings, data: `${MENU_SWITCH_PREFIX}settings` },
  },
];

// Choice page: the four speech choices on the left (Lulyssia's portrait on the right has no button)
const CHOICE_RIGHT = 1450;
const choiceRows = [208, 560, 870, 1180, BUTTONS_BOTTOM];
const choiceButtons = [
  command('Today', 'today'),
  command('Notice', 'notice'),
  command('Status', 'status'),
  { type: 'uri', label: 'Open app', uri: SITE_URL },
];

// Settings page: 4 x 2 switches
const settingButtons = [
  command('Remind on', 'remind on'),
  command('Remind off', 'remind off'),
  command('Overdue on', 'overdue on'),
  command('Overdue off', 'overdue off'),
  command('Notice on', 'notice on'),
  command('Notice off', 'notice off'),
  command('Letter start', 'start'),
  command('Letter stop', 'stop'),
];

const pages = [
  {
    alias: ALIASES.choice,
    name: 'Lulyssia menu: Choice',
    image: `${SITE_URL}/line-menu/choice.jpg`,
    areas: [
      ...tabAreas(),
      ...choiceButtons.map((action, i) => ({ bounds: box(0, choiceRows[i], CHOICE_RIGHT, choiceRows[i + 1]), action })),
    ],
  },
  {
    alias: ALIASES.settings,
    name: 'Lulyssia menu: Settings',
    image: `${SITE_URL}/line-menu/settings.jpg`,
    areas: [
      ...tabAreas(),
      ...settingButtons.map((action, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const rowHeight = (BUTTONS_BOTTOM - TABS_BOTTOM) / 2;
        // Rounded edges so the buttons fill the width with no gaps
        const x = Math.round((col * WIDTH) / 4);
        const right = Math.round(((col + 1) * WIDTH) / 4);
        const y = Math.round(TABS_BOTTOM + row * rowHeight);
        return { bounds: box(x, y, right, Math.round(TABS_BOTTOM + (row + 1) * rowHeight)), action };
      }),
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!accessToken) return json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, 500);

  const secret = req.headers.get('x-cron-secret');
  const valid = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
  if (!secret || !valid.includes(secret)) return json({ error: 'Unauthorized' }, 401);

  const auth = { Authorization: `Bearer ${accessToken}` };

  // Both pictures first, so nothing is removed if the site doesn't have them yet
  const images: ArrayBuffer[] = [];
  for (const page of pages) {
    const res = await fetch(page.image);
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) {
      return json({ error: `Menu picture not found at ${page.image} (deploy the site first)` }, 500);
    }
    images.push(await res.arrayBuffer());
  }

  // Remove previous menus and page names so buttons never stack up
  try {
    const aliasRes = await fetch(`${LINE_API}/richmenu/alias/list`, { headers: auth });
    if (aliasRes.ok) {
      for (const a of (await aliasRes.json()).aliases ?? []) {
        await fetch(`${LINE_API}/richmenu/alias/${a.richMenuAliasId}`, { method: 'DELETE', headers: auth });
      }
    }
    const listRes = await fetch(`${LINE_API}/richmenu/list`, { headers: auth });
    if (listRes.ok) {
      for (const m of (await listRes.json()).richmenus ?? []) {
        await fetch(`${LINE_API}/richmenu/${m.richMenuId}`, { method: 'DELETE', headers: auth });
      }
    }
  } catch (err) {
    console.error('Failed clearing old rich menus', err);
  }

  const ids: string[] = [];
  for (const [i, page] of pages.entries()) {
    const createRes = await fetch(`${LINE_API}/richmenu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({
        size: { width: WIDTH, height: HEIGHT },
        selected: true,
        name: page.name,
        chatBarText: 'Menu 💠',
        areas: page.areas,
      }),
    });
    if (!createRes.ok) return json({ error: `create failed (${page.name})`, detail: await createRes.text() }, 500);
    const { richMenuId } = await createRes.json();
    ids.push(richMenuId);

    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', ...auth },
      body: images[i],
    });
    if (!uploadRes.ok) return json({ error: `upload failed (${page.name})`, detail: await uploadRes.text() }, 500);

    // The name the tabs switch to
    const aliasRes = await fetch(`${LINE_API}/richmenu/alias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ richMenuAliasId: page.alias, richMenuId }),
    });
    if (!aliasRes.ok) return json({ error: `alias failed (${page.name})`, detail: await aliasRes.text() }, 500);
  }

  // Everyone starts on the Choice page
  const defaultRes = await fetch(`${LINE_API}/user/all/richmenu/${ids[0]}`, { method: 'POST', headers: auth });
  if (!defaultRes.ok) return json({ error: 'set default failed', detail: await defaultRes.text() }, 500);

  return json({ message: 'Rich menu ready', choice: ids[0], settings: ids[1] });
});
