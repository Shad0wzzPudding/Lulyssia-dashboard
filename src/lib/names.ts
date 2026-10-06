/** The name the user set in Settings (null = not set). */
export interface UserNames {
  nickname: string | null;
}

export const NAME_MAX_LENGTH = 40;

/** What Lulyssia calls the user when no nickname is set. */
const DEFAULT_NICKNAME = 'friend';

export const resolveNickname = ({ nickname }: UserNames) => nickname || DEFAULT_NICKNAME;

/** Fill {nickname} placeholders in one of Lulyssia's lines. */
export const fillNames = (text: string, names: UserNames) =>
  text.replace(/\{nickname\}/g, resolveNickname(names));

/** Trim input; an empty field means "not set". */
export const cleanName = (value: string) => {
  const trimmed = value.trim().slice(0, NAME_MAX_LENGTH);
  return trimmed || null;
};
