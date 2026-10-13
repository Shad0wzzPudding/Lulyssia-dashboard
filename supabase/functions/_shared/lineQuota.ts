// The bot's monthly LINE message allowance and how much of it is used this month. Push messages
// (letters, reminders, nudges, on-request lists) count, shared by everyone the bot messages;
// replies to a user's own message are free.

const LINE_API = 'https://api.line.me/v2/bot';

/** How many requests for today's list (LINE "today" + the Settings button) one person gets per day */
export const TODAY_REQUESTS_PER_DAY = 3;

export interface LineQuota {
  /** The plan's monthly limit, or null when the plan has none */
  limit: number | null;
  used: number;
}

/** Asks LINE for the bot's monthly limit and usage; null if LINE can't be reached. */
export async function getLineQuota(token: string): Promise<LineQuota | null> {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [quotaRes, usageRes] = await Promise.all([
      fetch(`${LINE_API}/message/quota`, { headers }),
      fetch(`${LINE_API}/message/quota/consumption`, { headers }),
    ]);
    if (!quotaRes.ok || !usageRes.ok) return null;
    const quota = await quotaRes.json();
    const usage = await usageRes.json();
    return {
      limit: quota?.type === 'limited' && typeof quota.value === 'number' ? quota.value : null,
      used: typeof usage?.totalUsage === 'number' ? usage.totalUsage : 0,
    };
  } catch {
    return null;
  }
}

/** True when the month's messages are used up (so an on-request list can't go out). */
export const quotaUsedUp = (q: LineQuota | null) => !!q && q.limit !== null && q.used >= q.limit;

/** Lulyssia's line when the month's messages have run out (as a free reply, or in the app). */
export const QUOTA_USED_UP_TEXT =
  "Hmph. My messages for this month have run out, so I can't send the list. Wait for the next month, okay? The morning letters will be back on the 1st.";
