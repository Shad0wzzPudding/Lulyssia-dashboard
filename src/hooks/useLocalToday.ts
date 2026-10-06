import { useEffect, useState } from 'react';

/** Date as YYYY-MM-DD in the device's local time zone (not UTC). */
export const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Today's local date. Updates at local midnight, and when the app becomes visible
 * or regains focus (timers can be delayed while a phone sleeps).
 */
export const useLocalToday = () => {
  const [today, setToday] = useState(() => getLocalDateString());

  useEffect(() => {
    const refresh = () => setToday(getLocalDateString());

    const scheduleMidnight = (): number => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      return window.setTimeout(() => {
        refresh();
        timer = scheduleMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };
    let timer = scheduleMidnight();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
};
