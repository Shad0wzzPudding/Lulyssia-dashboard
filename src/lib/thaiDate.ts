/** Today's date in Thai time (Asia/Bangkok), as YYYY-MM-DD: the day the LINE limits and Home's
 * "Don't ask again today" go by, whatever the device's own time zone. */
export const thaiToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
