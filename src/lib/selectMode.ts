/**
 * Added to a card's own classes in select mode: the card border itself turns dotted cyan
 * (dark: variant too, so it also overrides cards whose border color is set for dark mode).
 */
export const SELECTING_CARD_BORDER = 'border-2 border-dotted border-primary/80 dark:border-primary/80';

/**
 * Card look for Interests, Tasks and Events:
 * - normally: solid light blue-gray (#d5e1e8) with black text (the light panel theme)
 * - in select mode: the dark see-through look with a dotted cyan border
 * - chosen in select mode: a faint blue tint instead of the dark background
 * The dark: variants are repeated so they override each page's own dark-mode colors.
 */
export const cardSurface = (isSelecting: boolean, selected: boolean) => {
  if (!isSelecting) return 'theme-light bg-[#d5e1e8] dark:bg-[#d5e1e8]';
  const selecting = `cursor-pointer ${SELECTING_CARD_BORDER}`;
  return selected ? `${selecting} bg-primary/20 dark:bg-primary/20` : selecting;
};
