/**
 * The delete question's note about picked items that aren't on view ("All" picks them too): those
 * still behind a "Show more", and those folded under a "+N more" cover (`coverLabel`, e.g. "+6 more").
 * Empty when every picked item is on view.
 */
export const notShownYetNote = (behindShowMore: number, folded: number, coverLabel: string) => {
  const total = behindShowMore + folded;
  if (total === 0) return '';
  const where = [behindShowMore > 0 ? '"Show more"' : null, folded > 0 ? `"${coverLabel}"` : null]
    .filter(Boolean)
    .join(' and ');
  return `, including ${total} not shown yet (behind ${where})`;
};
