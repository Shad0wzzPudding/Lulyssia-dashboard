import { thaiToday } from './thaiDate';

/**
 * "Don't ask again today" for deletes from Home's date panel: this device only, until midnight Thai
 * time. Storage that fails or holds anything but today's date means: ask.
 */
const KEY = 'homeDeleteNoAskDate';

export const skipDeleteQuestion = (): boolean => {
  try {
    return localStorage.getItem(KEY) === thaiToday();
  } catch {
    return false;
  }
};

export const stopDeleteQuestionToday = () => {
  try {
    localStorage.setItem(KEY, thaiToday());
  } catch {
    /* storage unavailable: the window keeps asking */
  }
};
