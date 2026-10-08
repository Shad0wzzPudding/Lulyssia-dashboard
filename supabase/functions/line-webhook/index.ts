import { createClient } from 'jsr:@supabase/supabase-js@2';

const LINE_API = 'https://api.line.me/v2/bot';

// Provided by the Supabase Edge Runtime: keeps the function alive until the promise settles
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// Reply for anyone who messages the bot before linking their account (used in several places)
const NOT_LINKED_TEXT = "You're not linked yet. Send me the link code shown in the app's Settings page to connect your account.";

interface LineEvent {
  type?: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type?: string; text?: string };
  postback?: { data?: string };
}

const newCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)),
    (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

function base64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function verifySignature(secret: string, body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = base64(mac);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

// Pass a list to send several chat bubbles in one reply (LINE allows up to 5)
async function reply(token: string, replyToken: string, text: string | string[]) {
  const texts = Array.isArray(text) ? text : [text];
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: texts.map((t) => ({ type: 'text', text: t })) }),
  });
  if (!res.ok) console.error('LINE reply failed', res.status, await res.text());
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!channelSecret || !accessToken) {
    console.error('LINE secrets not configured');
    return new Response('Not configured', { status: 500 });
  }

  const raw = await req.text();
  const ok = await verifySignature(channelSecret, raw, req.headers.get('x-line-signature'));
  if (!ok) {
    console.log('Invalid LINE signature');
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  for (const event of payload.events ?? []) {
    try {
      const lineUserId: string | undefined = event?.source?.userId;
      const replyToken: string | undefined = event.replyToken;

      if (event.type === 'follow' && replyToken) {
        await fetch(`${LINE_API}/message/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            replyToken,
            // Greeting and command list arrive as two separate chat bubbles
            messages: [
              {
                type: 'text',
                text: '🦋 Hello there. To connect me with your account, open the app\'s Settings page and tap the "Open LINE to link" button — or type your link code here.',
              },
              {
                type: 'text',
                text: 'The available options for you are:\ntoday / status / stop / start / remind on / remind off / overdue on / overdue off',
              },
              {
                type: 'text',
                text: 'Keep in mind that I\'ll only reply to messages that are in the options above.\nIf you send me anything else, I won\'t reply to that.',
              }
            ],
          }),
        });
        continue;
      }

      const isPostback = event.type === 'postback' && !!event.postback?.data;
      if ((isPostback || (event.type === 'message' && event.message?.type === 'text')) && lineUserId && replyToken) {
        const text = String((isPostback ? event.postback?.data : event.message?.text) ?? '').trim();
        const code = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (/^(TODAY|DIGEST NOW|TODAY'?S LIST)$/i.test(text)) {
          const { data } = await supabase
            .from('line_links')
            .select('user_id')
            .eq('line_user_id', lineUserId)
            .maybeSingle();
          if (!data) {
            await reply(accessToken, replyToken, NOT_LINKED_TEXT);
            continue;
          }
          await reply(accessToken, replyToken, "Alright, I'll relay today's list for you then.\n*swiping sounds...*");
          const cronSecret = Deno.env.get('LINE_CRON_SECRET') ?? Deno.env.get('CRON_SECRET') ?? '';
          // Not awaited so LINE gets its reply quickly, but kept alive until the
          // request is out (otherwise the function can stop before sending it)
          EdgeRuntime.waitUntil(
            fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-line-daily`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-cron-secret': cronSecret },
              body: JSON.stringify({ user_id: data.user_id }),
            }).catch((e) => console.error('digest trigger failed', e))
          );
          continue;
        }


        if (/^(STATUS)$/i.test(text)) {
          const { data } = await supabase
            .from('line_links')
            .select('is_enabled, reminders_enabled, overdue_enabled')
            .eq('line_user_id', lineUserId)
            .maybeSingle();
          await reply(
            accessToken,
            replyToken,
            data
              ? `You're linked now, and here are your settings.\nDaily digest: ${data.is_enabled ? 'ON' : 'OFF'} (08:00 Thai time)\nStart reminders: ${data.reminders_enabled ? 'ON' : 'OFF'} (10-15 min before)\nOverdue nudges: ${data.overdue_enabled ? 'ON' : 'OFF'}`
              : NOT_LINKED_TEXT,
          );
          continue;
        }

        if (/^(OVERDUE|NUDGES?)\s*(ON|OFF|START|STOP)$/i.test(text)) {
          const enable = /(ON|START)$/i.test(text);
          const { data } = await supabase
            .from('line_links')
            .update({ overdue_enabled: enable })
            .eq('line_user_id', lineUserId)
            .select('id')
            .maybeSingle();
          await reply(
            accessToken,
            replyToken,
            data
              ? `*Writing sounds...*\nOverdue nudges turned ${enable ? 'ON' : 'OFF'}\n${enable ? "I'll message you when a deadline is missed." : "I won't send the overdue nudges until you send \"overdue on\"."}`
              : NOT_LINKED_TEXT,
          );
          continue;
        }

        if (/^(REMIND(ER)?S?)\s*(ON|OFF|START|STOP)$/i.test(text)) {
          const enable = /(ON|START)$/i.test(text);
          const { data } = await supabase
            .from('line_links')
            .update({ reminders_enabled: enable })
            .eq('line_user_id', lineUserId)
            .select('id')
            .maybeSingle();
          await reply(
            accessToken,
            replyToken,
            data
              ? `*Writing sounds...*\nStart reminders turned ${enable ? 'ON' : 'OFF'}\n${enable ? "I'll message you 10-15 minutes before your tasks and events start." : "I won't send the reminders until you send \"remind on\"."}`
              : NOT_LINKED_TEXT,
          );
          continue;
        }

        if (/^(STOP|OFF)$/i.test(text) || /^(START|ON)$/i.test(text)) {
          const enable = /^(START|ON)$/i.test(text);
          const { data } = await supabase
            .from('line_links')
            .update({ is_enabled: enable })
            .eq('line_user_id', lineUserId)
            .select('id')
            .maybeSingle();
          await reply(
            accessToken,
            replyToken,
            data
              ? `*Writing sounds...*\nDaily digest turned ${enable ? 'ON' : 'OFF'}\n${enable ? "I'll message you every morning at 08:00 (Thai time) with your tasks and events." : "I won't send the morning digest until you send \"start\"."}`
              : NOT_LINKED_TEXT,
          );
          continue;
        }

          if (code.length >= 6 && code.length <= 12) {
          const { data: link } = await supabase
            .from('line_links')
            .select('id, user_id, line_user_id')
            .eq('link_code', code)
            .maybeSingle();

          if (link && link.line_user_id && link.line_user_id !== lineUserId) {
            await reply(
              accessToken,
              replyToken,
              'That code is already linked to another LINE account. Tap the refresh button next to the code in Settings to generate a new one for me.',
            );
            continue;
          }

          if (link) {
            // Free the code from any other LINE account first
            await supabase
              .from('line_links')
              .update({ link_code: newCode(), line_user_id: null })
              .eq('line_user_id', lineUserId)
              .neq('id', link.id);

            let displayName: string | null = null;
            try {
              const profRes = await fetch(`${LINE_API}/profile/${lineUserId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (profRes.ok) displayName = (await profRes.json())?.displayName ?? null;
            } catch (_) { /* ignore */ }

            await supabase
              .from('line_links')
              .update({
                line_user_id: lineUserId,
                display_name: displayName,
                linked_at: new Date().toISOString(),
                is_enabled: true,
              })
              .eq('id', link.id);

            await reply(
              accessToken,
              replyToken,
              `Linked successfully${displayName ? `, ${displayName}` : ''}.\nI'll message you every morning at 08:00 (Thai time) with your tasks and events.\n\nSend "stop" to pause, "start" to resume, "status" to check.\nI'm looking forward to helping you every day! 🦋`,
            );
            continue;
          }
        }

        // Anything else: the reply depends on whether this LINE account is linked yet
        const commandList =
          'The available options are:\ntoday / status / stop / start / remind on / remind off / overdue on / overdue off';
        const { data: linked } = await supabase
          .from('line_links')
          .select('user_id')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (linked) {
          await reply(accessToken, replyToken, [
            `*Lulyssia looks at the message*\nI'm not replying to that one.\n\nSend me one of the options below instead, and maybe you'll find what you want.`,
            commandList,
          ]);
        } else {
          await reply(accessToken, replyToken, [
            NOT_LINKED_TEXT,
            commandList,
          ]);
        }
      }
    } catch (err) {
      console.error('Error handling LINE event:', err);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
