import { useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, animate as animateValue, motion, motionValue, useReducedMotion, type MotionValue } from 'framer-motion';
import lulyssiaFloating from '@/assets/image/lulyssia_floating.webp';
import { useMenuAnimations } from '@/hooks/usePageTransitions';

/**
 * Decorative scene shown while the left drawer is open: Lulyssia floating over the
 * drawer edge, soap bubbles, butterflies, halftone dots, a sparkle wave, slanted
 * cyan bands and KEEP OUT tape. Everything except Lulyssia is drawn in code.
 * The whole layer ignores clicks, so the drawer and its backdrop work as usual.
 */

/** Simple butterfly drawn in code (two wing pairs, body, antennae); the wings flap. */
const Butterfly = ({ size, delay = 0, speed = 1.2 }: { size: number; delay?: number; speed?: number }) => {
  const id = useId();
  const animate = useMenuAnimations();
  const foreFill = `bf-fore-${id}`;
  const hindFill = `bf-hind-${id}`;
  // Bright cyan near the body fading to a dark rim, like the butterflies in Lulyssia's art
  const stops = (
    <>
      <stop offset="0%" stopColor="#e6fbff" />
      <stop offset="30%" stopColor="#77d4ec" />
      <stop offset="62%" stopColor="#3aadd0" />
      <stop offset="84%" stopColor="#174f63" />
      <stop offset="100%" stopColor="#0b1c22" />
    </>
  );
  const wings = (
    <>
      {/* Forewing */}
      <path
        d="M50 38 C 55 15, 78 0, 94 5 C 99 8, 98 18, 93 25 C 85 34, 67 39, 52 40 Z"
        fill={`url(#${foreFill})`}
        stroke="#0b1c22"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Hindwing */}
      <path
        d="M51 42 C 66 42, 86 49, 87 60 C 88 67, 82 70, 77 74 C 70 79, 59 70, 51 46 Z"
        fill={`url(#${hindFill})`}
        stroke="#0b1c22"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Veins and white spots near the dark edge */}
      <path d="M52 39 L 86 9 M52 40 L 93 18 M52 40 L 90 27 M52 44 L 80 70 M52 43 L 85 58" stroke="#0b1c22" strokeWidth="0.7" opacity="0.4" />
      <circle cx="90" cy="9" r="1.8" fill="white" opacity="0.9" />
      <circle cx="94" cy="15" r="1.3" fill="white" opacity="0.85" />
      <circle cx="82" cy="69" r="1.4" fill="white" opacity="0.8" />
    </>
  );
  return (
    <svg viewBox="0 0 100 80" width={size} height={size * 0.8} className="overflow-visible drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
      <defs>
        <radialGradient id={foreFill} cx="0.05" cy="0.95" r="1.15">{stops}</radialGradient>
        <radialGradient id={hindFill} cx="0.05" cy="0.05" r="1.15">{stops}</radialGradient>
      </defs>
      {/* Both wing pairs flap together around the body */}
      <g
        className={animate ? 'animate-butterfly-flap' : undefined}
        style={{ transformOrigin: '50px 40px', transformBox: 'view-box', animationDelay: `${delay}s`, animationDuration: `${speed}s` }}
      >
        {wings}
        <g transform="translate(100 0) scale(-1 1)">{wings}</g>
      </g>
      {/* Body and antennae: dark with a light outline so they show on the dark page */}
      <ellipse cx="50" cy="44" rx="2.6" ry="12" fill="#0b1c22" stroke="#77d4ec" strokeWidth="0.7" />
      <circle cx="50" cy="31" r="3" fill="#0b1c22" stroke="#77d4ec" strokeWidth="0.7" />
      <path d="M49 29 C 46 22, 42 19, 38 17 M51 29 C 54 22, 58 19, 62 17" stroke="#bdeefa" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="17" r="1.5" fill="#bdeefa" />
      <circle cx="62" cy="17" r="1.5" fill="#bdeefa" />
    </svg>
  );
};

/** Glossy soap bubble: thin cyan rim, soft inner tint and a white shine. */
const Bubble = ({ size, delay = 0 }: { size: number; delay?: number }) => {
  const animate = useMenuAnimations();
  return (
  <div
    className={`relative rounded-full border border-p5-300/70 ${animate ? 'animate-bubble-float' : ''}`}
    style={{
      width: size,
      height: size,
      animationDelay: `${delay}s`,
      background:
        'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.28), rgba(58,173,208,0.10) 45%, rgba(58,173,208,0.04) 70%, rgba(255,255,255,0.10) 100%)',
      boxShadow: 'inset 0 0 18px rgba(119,207,230,0.35), 0 0 12px rgba(58,173,208,0.25)',
    }}
  >
    <span
      className="absolute rounded-full bg-white/85"
      style={{ width: size * 0.22, height: size * 0.12, top: size * 0.16, left: size * 0.2, transform: 'rotate(-30deg)' }}
    />
    <span className="absolute rounded-full bg-white/60" style={{ width: size * 0.07, height: size * 0.07, top: size * 0.32, left: size * 0.16 }} />
    <span
      className="absolute rounded-full bg-white/50"
      style={{ width: size * 0.3, height: size * 0.06, bottom: size * 0.1, right: size * 0.2, transform: 'rotate(-20deg)' }}
    />
  </div>
  );
};

/**
 * Yellow caution tape with KEEP OUT text that scrolls along it endlessly.
 * The text row is written twice back to back and slides by exactly one copy,
 * so the loop has no visible jump. `reverse` scrolls the other way.
 */
const KeepOutTape = ({ className, style, reverse = false }: { className?: string; style?: React.CSSProperties; reverse?: boolean }) => {
  const animate = useMenuAnimations();
  const row = (copy: number) => (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy > 0}>
      {Array.from({ length: 10 }, (_, k) => (
        <span key={k} className="font-display text-xl font-extrabold uppercase italic tracking-wider text-black">
          Keep out
        </span>
      ))}
    </div>
  );
  return (
    <div
      className={`absolute flex h-10 items-center overflow-hidden whitespace-nowrap border-y-[3px] border-black bg-[#facc15] shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${className ?? ''}`}
      style={style}
    >
      <div
        className={`flex w-max ${animate ? 'animate-tape-scroll' : ''}`}
        style={{ animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
};

// The neon sparkle wave: the original curve (0-600) continued with more curves to 1600
const WAVE_PATH =
  'M0 185 C 110 120, 230 215, 360 165 S 530 120, 600 150 S 820 205, 980 160 S 1230 105, 1390 145 S 1560 190, 1600 172';

// How far down the right screen edge the top-right gray wedge reaches (% of screen height).
// Bigger = covers more of the cyan triangle under it. Used by both the wedge and its edge line.
const WEDGE_RIGHT_Y = 18;

// Water texture (rising bubble dots): three bubble layers + a sheen, in the given colors.
// The 'water-rise' animation in tailwind.config.ts moves these exact layers, so keep the
// sizes (18, 11, 31 px) and starting positions in sync with it.
const waterTexture = (medium: string, small: string, large: string, sheen: string): React.CSSProperties => ({
  backgroundImage: [
    `radial-gradient(circle, ${medium} 28%, transparent 33%)`,
    `radial-gradient(circle, ${small} 20%, transparent 25%)`,
    `radial-gradient(circle, ${large} 34%, transparent 40%)`,
    `linear-gradient(to top, transparent 40%, ${sheen})`,
  ].join(', '),
  backgroundSize: '18px 18px, 11px 11px, 31px 31px, 100% 100%',
  backgroundPosition: '0 0, 5px 7px, 12px 3px, 0 0',
});

// White bubbles: the bottom-left cyan band
const WATER_TEXTURE = waterTexture(
  'rgba(255,255,255,0.55)',
  'rgba(255,255,255,0.35)',
  'rgba(200,243,252,0.45)',
  'rgba(255,255,255,0.18)',
);

// Neon cyan bubbles (electric cyan, near-white cyan, vivid aqua): the top-right cyan triangle.
// Its layer also gets a cyan glow (NEON_GLOW) so the bubbles read as neon on the cyan shape.
const WATER_TEXTURE_NEON = waterTexture(
  'rgba(0,240,255,0.85)',
  'rgba(190,252,255,0.8)',
  'rgba(0,214,240,0.6)',
  'rgba(120,245,255,0.25)',
);
const NEON_GLOW = 'drop-shadow(0 0 4px rgba(0,240,255,0.9)) drop-shadow(0 0 10px rgba(0,240,255,0.45))';

// Outline of the dotted wedge that sits on top of the gray wedge's upper part
// (% of the screen): top-left point, top-right corner, right-edge point, bend point.
// The abstract (crossed) outline 'polygon(90% 50%, 100% 20%, 70% 0%, 90% 8%)', squashed
// vertically (every height x0.6) so it ends higher while staying fully on screen.
// To change how far down it reaches, scale all the second numbers by the same factor.
const DOT_WEDGE_CLIP = 'polygon(80% 34%, 100% 12%, 70% 0%, 90% 2.8%)';

// Positions as % of the screen. "phone: false" items are hidden on narrow screens to keep it light.
const BUBBLES = [
  { top: '5%', left: '26%', size: 150, delay: 0, phone: false },
  { top: '15%', left: '25.5%', size: 30, delay: 1.2, phone: false },
  { top: '-2%', left: '44%', size: 72, delay: 0.6, phone: true },
  { top: '12%', left: '48%', size: 32, delay: 2, phone: true },
  { top: '43%', left: '66%', size: 48, delay: 1.5, phone: true },
  { top: '53%', left: '56%', size: 135, delay: 0.3, phone: false },
  { top: '54%', left: '80%', size: 180, delay: 0.9, phone: true },
  { top: '76%', left: '95%', size: 52, delay: 2.4, phone: false },
];

const BUTTERFLIES = [
  { top: '-1%', left: '63%', size: 150, rotate: -12, delay: 0, speed: 1.6, phone: true },
  { top: '4%', left: '85%', size: 38, rotate: 15, delay: 0.2, speed: 1.0, phone: true },
  { top: '16%', left: '86%', size: 44, rotate: -20, delay: 0.35, speed: 1.1, phone: false },
  { top: '30%', left: '92%', size: 50, rotate: 10, delay: 0.1, speed: 1.2, phone: true },
  { top: '18%', left: '96%', size: 40, rotate: -30, delay: 0.5, speed: 1.0, phone: false },
];

// Opening slash: a double slash sweeps left to right across the screen and the scene is cut
// open behind it. A bright front line and a thin back line travel together with a strip of
// liquid glass between them. `p` is where the front line meets the top edge (% of the width);
// every edge meets the bottom edge SLASH_SLANT% further left. p = 0 is before the left edge,
// and SLASH_END is far enough that the back line has cleared the right edge too.
const SLASH_SLANT = 30;
const SLASH_WIDTH = 2.2; // front line
const SLASH_TAIL_WIDTH = 0.9; // back line
const GLASS_GAP = 16; // glass between the two lines
const SLASH_END = 130 + SLASH_WIDTH + GLASS_GAP + SLASH_TAIL_WIDTH;
/** How long the slash takes to cross; the drawer rows (Navigation) time their snap from it. */
export const SLASH_DURATION = 1;
const SLASH_EASE = [0.6, 0, 0.3, 1] as const;
/** Everything left of the front line. */
const revealedBy = (p: number) => `polygon(0% 0%, ${p}% 0%, ${p - SLASH_SLANT}% 100%, 0% 100%)`;
/**
 * The slash parts keep a fixed shape and only slide (a transform the graphics card handles),
 * instead of being reshaped on every frame. Each part sits in its own box, placed for p = 0 and
 * moved right by p% of the screen width. Box and strip positions are in % of the screen width.
 */
const slashBox = (left: number, width: number) => ({ left: `${left}vw`, width: `${width}vw` });
/** Clip shape (in % of its box) of a slanted strip whose right edge meets the top at `right`. */
const stripIn = (boxLeft: number, boxWidth: number, right: number, width: number) => {
  const x = (v: number) => `${((v - boxLeft) / boxWidth) * 100}%`;
  return `polygon(${x(right - width)} 0%, ${x(right)} 0%, ${x(right - SLASH_SLANT)} 100%, ${x(right - SLASH_SLANT - width)} 100%)`;
};
// Both lines share one box (front line at p, back line behind the glass), so one glow covers them
const LINES_RIGHT = 0;
const BACK_RIGHT = LINES_RIGHT - SLASH_WIDTH - GLASS_GAP;
const LINES_LEFT = BACK_RIGHT - SLASH_TAIL_WIDTH - SLASH_SLANT;
const LINES_BOX = slashBox(LINES_LEFT, LINES_RIGHT - LINES_LEFT);
const FRONT_SHAPE = stripIn(LINES_LEFT, LINES_RIGHT - LINES_LEFT, LINES_RIGHT, SLASH_WIDTH);
const BACK_SHAPE = stripIn(LINES_LEFT, LINES_RIGHT - LINES_LEFT, BACK_RIGHT, SLASH_TAIL_WIDTH);
// The glass fills the gap between the lines
const GLASS_RIGHT = LINES_RIGHT - SLASH_WIDTH;
const GLASS_LEFT = GLASS_RIGHT - GLASS_GAP - SLASH_SLANT;
const GLASS_BOX = slashBox(GLASS_LEFT, GLASS_RIGHT - GLASS_LEFT);
const GLASS_SHAPE = stripIn(GLASS_LEFT, GLASS_RIGHT - GLASS_LEFT, GLASS_RIGHT, GLASS_GAP);
// Shine inside the glass, just behind the front line, like light catching the edge of a pane:
// a soft wide sheen with a thin bright streak in it
const GLASS_SHEEN = stripIn(GLASS_LEFT, GLASS_RIGHT - GLASS_LEFT, GLASS_RIGHT - 0.8, 3);
const GLASS_STREAK = stripIn(GLASS_LEFT, GLASS_RIGHT - GLASS_LEFT, GLASS_RIGHT - 1.6, 0.5);

/** A value that follows another one through `fn`. */
const follow = <T,>(source: MotionValue<number>, fn: (v: number) => T) => {
  const value = motionValue(fn(source.get()));
  source.on('change', (v) => value.set(fn(v)));
  return value;
};

/**
 * One opening's slash: a single position `p` (and fade) that every part reads from, so the lines,
 * the glass and the scene cut always move in step. Values are set as plain styles on every frame;
 * handing clip-path animations to the browser made Chrome drop the cut for a frame or two at the
 * start (the whole scene flashed in uncut).
 */
const createSlash = () => {
  const p = motionValue(0);
  return {
    p,
    fade: motionValue(1),
    reveal: follow(p, revealedBy),
    shift: follow(p, (v) => `${v}vw`),
  };
};

export const DrawerScene = ({ open }: { open: boolean }) => {
  // "Animating menu" setting (Settings > Display): when off, everything here holds still
  const animate = useMenuAnimations();
  // Reduced motion: the scene just fades in, with no slash
  const reduceMotion = useReducedMotion();
  // Each opening gets its own keys, so reopening while the close fade is still running starts a
  // fresh slash and reveal (with the same keys the closing copies would come back already finished)
  const [openCount, setOpenCount] = useState(open ? 1 : 0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOpenCount((n) => n + 1);
  }
  // Decode Lulyssia's art ahead of time, so the first opening doesn't stall on it
  useEffect(() => {
    const img = new Image();
    img.src = lulyssiaFloating;
    img.decode?.().catch(() => {});
  }, []);
  // A fresh slash for each opening, starting at p = 0 (a closing copy keeps its own)
  const slash = useMemo(createSlash, [openCount]);
  useEffect(() => {
    if (!open || reduceMotion) return;
    const move = animateValue(slash.p, SLASH_END, { duration: SLASH_DURATION, ease: SLASH_EASE });
    const fade = animateValue(slash.fade, [1, 1, 0], { duration: SLASH_DURATION + 0.1, times: [0, 0.75, 1] });
    return () => {
      move.stop();
      fade.stop();
    };
    // Runs once per opening (a new slash); closing leaves the running slash alone
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slash, reduceMotion]);
  return (
  <AnimatePresence>
    {/* Opening slash, above everything, gone once it has crossed: the liquid glass strip, then
        the two white lines with a cyan glow. The glass sits outside the glowing layer, because a
        filter on a parent would stop the glass from seeing the page behind it. */}
    {open && !reduceMotion && (
      <motion.div
        key={`drawer-slash-${openCount}`}
        aria-hidden
        exit={{ opacity: 0, transition: { duration: 0 } }}
        className="pointer-events-none fixed inset-0 z-[62]"
      >
        <motion.div
          className="drawer-liquid-glass absolute inset-y-0 will-change-transform"
          style={{ ...GLASS_BOX, x: slash.shift, opacity: slash.fade, clipPath: GLASS_SHAPE }}
        >
          <div className="absolute inset-0 bg-white/15" style={{ clipPath: GLASS_SHEEN }} />
          <div className="absolute inset-0 bg-white/60" style={{ clipPath: GLASS_STREAK }} />
        </motion.div>
        {/* The glow is drawn once on the still lines and then only slides with them */}
        <motion.div
          className="absolute inset-y-0 will-change-transform [filter:drop-shadow(0_0_6px_#5ee3f0)_drop-shadow(0_0_18px_#3aadd0)]"
          style={{ ...LINES_BOX, x: slash.shift, opacity: slash.fade }}
        >
          <div className="absolute inset-0 bg-white" style={{ clipPath: FRONT_SHAPE }} />
          <div className="absolute inset-0 bg-white opacity-75" style={{ clipPath: BACK_SHAPE }} />
        </motion.div>
      </motion.div>
    )}
    {open && (
      <motion.div
        key={`drawer-scene-${openCount}`}
        aria-hidden
        // Cut open behind the front line (reads the same slash position); fades out on close
        initial={{ opacity: reduceMotion ? 0 : 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={reduceMotion ? undefined : { clipPath: slash.reveal }}
        // Blurs the page behind the drawer; everything drawn in this scene stays sharp
        className="pointer-events-none fixed inset-0 z-[55] overflow-hidden backdrop-blur-[6px]"
      >
        {/* The drawer's dark panel, drawn here at the very back so Lulyssia can float in front
            of it, while the drawer's items (a transparent layer above this scene) stay on top.
            Revealed by the slash with the rest of the scene; slides out with the drawer (0.3s). */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          exit={{ x: '-100%', transition: { duration: 0.3, ease: 'easeIn' } }}
          className="absolute inset-y-0 left-0 w-72 border-r-2 border-foreground/80 bg-card shadow-lg"
        />

        {/* Slanted bands, starting exactly at the drawer's right edge (the drawer is 18rem wide),
            so they touch it on every screen size. x = 0 here is the drawer edge. */}
        <svg
          className="absolute inset-y-0 left-72 h-full w-[calc(100%-18rem)]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points="0,34 3.4,34 44.6,100 35.1,100" fill="#0a0f12" />
          <polygon points="0,35 0.4,35 37.8,100 37,100" fill="white" opacity="0.6" />
          <polygon points="0,50 0,100 28.4,100" fill="#3aadd0" />
          <polygon points="0,62 0,100 18.9,100" fill="#24718c" opacity="0.7" />
        </svg>

        {/* Water texture on the cyan band: three layers of bubble dots in different sizes that
            drift upward at different speeds, densest near the bottom, with a light sheen.
            Cut to the cyan band's outline (same layer position as the bands above). */}
        <div
          className={`absolute inset-y-0 left-72 w-[calc(100%-18rem)] ${animate ? 'animate-water-rise' : ''}`}
          style={{
            ...WATER_TEXTURE,
            clipPath: 'polygon(0% 50%, 0% 100%, 28.4% 100%)',
            maskImage: 'linear-gradient(to top, black 25%, rgba(0,0,0,0.5) 55%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to top, black 25%, rgba(0,0,0,0.5) 55%, transparent 85%)',
          }}
        />

        {/* Triangles and wedges (stretched to the screen) */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="52,0 68,0 60,14" fill="#3aadd0" />
          <polygon points="54.5,0 65.5,0 60,9.5" fill="white" />
          {/* Cyan triangle first, then the gray wedge laps over its top part.
              The wedge and its edge line share WEDGE_RIGHT_Y, so they always line up. */}
          <polygon points="88,16 100,10 100,34" fill="#3aadd0" opacity="0.9" />
          <polygon points={`64,0 100,0 100,${WEDGE_RIGHT_Y} 88,16`} fill="#0e1a23" />
          <polyline
            points={`64,0 88,16 100,${WEDGE_RIGHT_Y}`}
            fill="none"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Same water texture on the top-right cyan triangle, only on its visible part
            (below the gray wedge's edge, which uses WEDGE_RIGHT_Y). Densest toward the right
            edge where the triangle is widest, fading toward its point. */}
        <div
          className={`absolute inset-0 ${animate ? 'animate-water-rise' : ''}`}
          style={{
            ...WATER_TEXTURE_NEON,
            filter: NEON_GLOW,
            clipPath: `polygon(88% 16%, 100% ${WEDGE_RIGHT_Y}%, 100% 34%)`,
            maskImage: 'linear-gradient(to left, black 0%, rgba(0,0,0,0.6) 6%, transparent 12%)',
            WebkitMaskImage: 'linear-gradient(to left, black 0%, rgba(0,0,0,0.6) 6%, transparent 12%)',
          }}
        />

        {/* Dotted wedge on top of the upper part of the gray wedge (same slant), in the
            halftone style. Fades out toward its left point. A separate layer keeps dots round. */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: DOT_WEDGE_CLIP,
            backgroundImage: 'radial-gradient(circle, #5ee3f0 75%, transparent 42%)',
            backgroundSize: '15px 15px',
            maskImage: 'linear-gradient(to left, black 45%, transparent 82%)',
            WebkitMaskImage: 'linear-gradient(to left, black 45%, transparent 82%)',
            filter: 'drop-shadow(0 0 10px rgba(94,227,240,0.6))',
          }}
        />

        {/* Halftone dot sphere in the drawer's lower corner */}
        <div
          className="absolute -bottom-16 -left-24 h-[24rem] w-[24rem] rounded-full"
          style={{
            backgroundImage: 'radial-gradient(circle, #5ee3f0 38%, transparent 42%)',
            backgroundSize: '15px 15px',
            maskImage: 'radial-gradient(circle at 58% 42%, black 25%, transparent 68%)',
            WebkitMaskImage: 'radial-gradient(circle at 58% 42%, black 25%, transparent 68%)',
            filter: 'drop-shadow(0 0 10px rgba(94,227,240,0.6))',
          }}
        />

        {/* Glowing sparkle wave across the full screen width. The drawing is 1600 wide and
            anchored bottom-left ("slice"): on wide screens it fits edge to edge, on narrower
            ones the rest runs off the right edge, so the line always reaches the end. */}
        <svg
          className="absolute bottom-0 left-0 h-56 w-full"
          viewBox="0 0 1600 220"
          preserveAspectRatio="xMinYMax slice"
          fill="none"
        >
          <defs>
            <filter id="drawer-wave-glow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={WAVE_PATH} stroke="#5ee3f0" strokeWidth="6" opacity="0.5" filter="url(#drawer-wave-glow)" />
          <path d={WAVE_PATH} stroke="white" strokeWidth="2" filter="url(#drawer-wave-glow)" />
          {/* Pulse of light travelling along the wave, off the right edge and round again.
              pathLength=100 makes the dash pattern (5 bright + 95 gap) exactly one wave long. */}
          <path
            d={WAVE_PATH}
            pathLength={100}
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="5 95"
            filter="url(#drawer-wave-glow)"
            className={animate ? 'animate-wave-flow' : undefined}
            opacity={animate ? 1 : 0}
          />
          {Array.from({ length: 100 }, (_, k) => {
            const x = (k * 151) % 1600;
            const y = 120 + ((k * 89) % 90);
            return (
              <circle
                key={k}
                cx={x}
                cy={y}
                r={1 + (k % 3)}
                fill={k % 2 ? 'white' : '#5ee3f0'}
                className={animate ? 'animate-sparkle-twinkle' : undefined}
                style={{ animationDelay: `${(k % 7) * 0.3}s` }}
              />
            );
          })}
        </svg>

        {/* Soap bubbles */}
        {BUBBLES.map((b, k) => (
          <div key={`bubble-${k}`} className={`absolute ${b.phone ? '' : 'hidden sm:block'}`} style={{ top: b.top, left: b.left }}>
            <Bubble size={b.size} delay={b.delay} />
          </div>
        ))}

        {/* Butterflies */}
        {BUTTERFLIES.map((b, k) => (
          <div
            key={`butterfly-${k}`}
            className={`absolute ${b.phone ? '' : 'hidden sm:block'}`}
            style={{ top: b.top, left: b.left, transform: `rotate(${b.rotate}deg)` }}
          >
            <Butterfly size={b.size} delay={b.delay} speed={b.speed} />
          </div>
        ))}

        {/* KEEP OUT tape, crossing in the bottom-right (wider screens only) */}
        <div className="hidden sm:block">
          <KeepOutTape className="-right-[12vw] bottom-[18vh] w-[70vw]" style={{ transform: 'rotate(-32deg)' }} />
          <KeepOutTape className="-right-[22vw] bottom-[30vh] w-[60vw]" style={{ transform: 'rotate(-62deg)' }} reverse />
        </div>
      </motion.div>
    )}
    {/* Lulyssia on her own layer above everything, even the drawer buttons (z-[61] > z-[60]).
        Clicks pass through her, so the buttons under her still work. */}
    {open && (
      <motion.div
        key={`drawer-character-${openCount}`}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none fixed inset-0 z-[61] overflow-hidden"
      >
          {/* Lulyssia, floating across the drawer edge. The drift-in and the float loop are on
              separate layers: on one element the float's CSS animation overrode the drift's
              transform, so she only faded in. */}
          <motion.div
            initial={{ x: -120, opacity: 0, rotate: -4 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, delay: reduceMotion ? 0.1 : SLASH_DURATION * 0.67 }}
            // Sized by both width and height (vh cap) so she stays below MENU/Settings on
            // shorter screens like laptops and iPads; anchored partly below the bottom edge.
            // Left edge: -4vw, shifted right by 15% of her own width (same width formula as w-[...]).
            className="absolute -bottom-[10vh] left-[calc(-4vw_+_min(95vw,520px,70vh)*0.15)] w-[min(95vw,520px,70vh)] sm:left-[calc(-4vw_+_min(62vw,760px,80vh)*0.15)] sm:w-[min(62vw,760px,80vh)]"
          >
            <img
              src={lulyssiaFloating}
              alt=""
              className={`block w-full select-none ${animate ? 'animate-character-float' : ''}`}
              draggable={false}
            />
          </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};
