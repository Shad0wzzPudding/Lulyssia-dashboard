import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Check } from 'lucide-react';
import type { Preset, Tag } from '@/lib/types';
import { cn } from '@/lib/utils';
import { presetOffset, textOn } from '@/lib/presets';
import { plainFormat } from '@/lib/presetApply';

export const PRESET_BLUE = '#4fc3f7';
const BUTTERFLY_ID = 'preset-butterfly';

/**
 * The butterfly drawn once on the page (white, black outlines, faint wing lines, curled antennae and
 * a small diamond charm); each card shows it with <use>
 */
export const PresetButterflySymbol = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <symbol id={BUTTERFLY_ID} viewBox="0 0 64 60">
      <g fill="#fff" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M22 40 C32 27 45 18 57 16 C63 15 65 21 61 26 C55 33 41 39 22 40 Z" />
        <path d="M22 40 C17 27 22 9 34 3 C41 0 47 4 45 11 C43 20 36 31 22 40 Z" />
        <path d="M22 40 C30 40 39 44 43 51 C45 56 40 59 35 56 C31 53 30 49 27 47 C24 45 23 43 22 40 Z" />
        <path d="M16 45 C17 41 20 38 24 39 C25 42 22 46 17 47 Z" />
      </g>
      <g fill="none" stroke="#000" strokeWidth=".9" strokeLinecap="round" opacity=".55">
        <path d="M25 37 C24 27 29 13 37 7 M25 37 C28 30 33 22 40 12" />
        <path d="M26 39 C35 32 46 25 57 21 M26 39 C35 35 45 31 55 28" />
        <path d="M25 41 C31 43 36 47 39 53" />
      </g>
      <path d="M21 39 C17 30 11 26 5 27 C3 27 3 30 5 30 M21 39 C18 33 13 32 9 34 C7 35 8 37 10 36" fill="none" stroke="#000" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M21 39 C17 30 11 26 5 27 C3 27 3 30 5 30 M21 39 C18 33 13 32 9 34 C7 35 8 37 10 36" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M44 34 L44 42" stroke="#000" strokeWidth="2.6" />
      <path d="M44 34 L44 42" stroke="#fff" strokeWidth="1.2" />
      <path d="M44 42 L47.5 46.5 L44 52 L40.5 46.5 Z" fill="#fff" stroke="#000" strokeWidth="1.3" strokeLinejoin="round" />
    </symbol>
  </svg>
);

const LABEL_MAX_LETTERS = 16;

/**
 * The label above a card: a slanted tab per tag in its colour ("No tag" in grey). Past 16 letters in
 * all with three or more tags: the first two, then "…" (its title lists every tag). Each tab
 * shortens itself with "…" if the row is still too wide.
 */
export const PresetLabel = ({ tags, className }: { tags: Tag[]; className?: string }) => {
  const tooLong = tags.map((t) => t.name).join('').length > LABEL_MAX_LETTERS && tags.length > 2;
  const shown = tooLong ? tags.slice(0, 2) : tags;
  return (
    <div className={cn('preset-label', className)} aria-hidden="true">
      {tags.length === 0 ? (
        <span style={{ background: '#b3b3b3', color: '#0b1418' }}>No tag</span>
      ) : (<>
        {shown.map((t) => (
          <span key={t.id} style={{ background: t.color, color: textOn(t.color) }} title={t.name}>{t.name}</span>
        ))}
        {tooLong && (
          <span className="is-more" style={{ background: '#ebebeb', color: '#0b1418' }} title={tags.map((t) => t.name).join(', ')}>…</span>
        )}
      </>)}
    </div>
  );
};

type PresetCardProps = ComponentPropsWithoutRef<'button'> & {
  preset: Preset;
  tags: Tag[];
  picked?: boolean;
};

/** The card face: the name slab, the format as plain text, the due offset and the butterfly */
export const PresetCard = forwardRef<HTMLButtonElement, PresetCardProps>(function PresetCard(
  { preset, tags, picked, className, style, children, ...props },
  ref
) {
  const offset = presetOffset(preset);
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={picked}
      className={cn('preset-card', className)}
      style={{ ['--band' as string]: tags[0]?.color ?? PRESET_BLUE, ...style }}
      {...props}
    >
      <span className="preset-card-dots" aria-hidden="true" />
      <span className="preset-card-head">
        <span className="preset-card-name">{preset.name}</span>
      </span>
      <span className="preset-card-format">{plainFormat(preset.description)}</span>
      <span className={cn('preset-card-offset', !offset && 'is-none')}>{offset ?? 'No due date'}</span>
      <svg className="preset-card-butterfly" viewBox="0 0 64 60" aria-hidden="true">
        <use href={`#${BUTTERFLY_ID}`} />
      </svg>
      {picked && (
        <span className="preset-card-check" aria-hidden="true">
          <Check size={34} strokeWidth={4} />
        </span>
      )}
      {children}
    </button>
  );
});
