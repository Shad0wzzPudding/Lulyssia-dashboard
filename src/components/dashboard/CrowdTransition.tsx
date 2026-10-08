import { useEffect, useMemo, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface CrowdTransitionProps {
  /** Called once the crowd fully covers the screen (switch the page here). */
  onCovered: () => void;
  /** Called after the crowd has slid off the other side. */
  onDone: () => void;
}

// Small seeded random generator so the crowd looks the same every time
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

interface Figure {
  x: number;
  shoulderY: number;
  scale: number;
  armUp: boolean;
  armSide: 1 | -1;
}

// Short pause first (so the menu's tap sound is heard on its own), then
// slide in 0.8s + hold 0.4s + slide out 0.8s. The train sound uses these timings too.
export const CROWD_TRANSITION_DELAY_MS = 250;
const SLIDE_IN_S = 0.8;
const HOLD_MS = 400;
const SLIDE_OUT_S = 0.8;
const FADE_S = 0.25;
export const CROWD_TRANSITION_MS = SLIDE_IN_S * 1000 + HOLD_MS + SLIDE_OUT_S * 1000;

const VIEW_W = 2800;
const VIEW_H = 1000;

// One row of commuters standing shoulder to shoulder, some holding the hanging straps
const makeRow = (seed: number, count: number, shoulderY: number, scale: number): Figure[] => {
  const rand = seeded(seed);
  const gap = VIEW_W / count;
  return Array.from({ length: count + 1 }, (_, i) => ({
    x: i * gap + (rand() - 0.5) * gap * 0.5,
    shoulderY: shoulderY + (rand() - 0.5) * 70,
    scale: scale * (0.9 + rand() * 0.2),
    armUp: rand() < 0.6,
    armSide: rand() < 0.5 ? 1 : -1,
  }));
};

const LAYERS = [
  { figures: makeRow(11, 11, 430, 0.85), fill: '#0d2029', rim: '#1a3e4c', drift: 'animate-crowd-drift-slow' },
  { figures: makeRow(29, 9, 520, 1.0), fill: '#173a48', rim: '#2a6378', drift: '' },
  { figures: makeRow(47, 7, 600, 1.2), fill: '#22566a', rim: '#3aadd0', drift: 'animate-crowd-drift-fast' },
];

const CommuterSvg = ({ f, fill, rim }: { f: Figure; fill: string; rim: string }) => {
  const s = f.scale;
  const { x, shoulderY: y } = f;
  // Raised hand sits a forearm's reach above the head; the arm bends out at the elbow
  const handX = x + f.armSide * 85 * s;
  const handY = y - 290 * s;
  const shoulderX = x + f.armSide * 70 * s;
  const elbowX = x + f.armSide * 150 * s;
  const elbowY = y - 120 * s;
  const arm = `M ${shoulderX} ${y + 25 * s} Q ${elbowX} ${elbowY} ${handX} ${handY}`;
  return (
    <g>
      {f.armUp && (
        <>
          {/* Hanging strap with a triangular handle, and the bent arm holding it */}
          <line x1={handX} y1={0} x2={handX} y2={handY - 50 * s} stroke="#2a6378" strokeWidth={9 * s} />
          <path
            d={`M ${handX - 26 * s} ${handY - 50 * s} L ${handX + 26 * s} ${handY - 50 * s} L ${handX} ${handY + 6 * s} Z`}
            fill="none"
            stroke="#3aadd0"
            strokeOpacity={0.7}
            strokeWidth={8 * s}
            strokeLinejoin="round"
          />
          <path d={arm} fill="none" stroke={rim} strokeWidth={46 * s} strokeLinecap="round" />
          <path d={arm} fill="none" stroke={fill} strokeWidth={38 * s} strokeLinecap="round" />
        </>
      )}
      {/* Head */}
      <ellipse cx={x} cy={y - 78 * s} rx={46 * s} ry={56 * s} fill={fill} stroke={rim} strokeWidth={4} />
      {/* Shoulders and body */}
      <path
        d={`M ${x - 105 * s} ${VIEW_H} L ${x - 112 * s} ${y + 70 * s} Q ${x - 110 * s} ${y} ${x - 45 * s} ${y - 12 * s}
            L ${x + 45 * s} ${y - 12 * s} Q ${x + 110 * s} ${y} ${x + 112 * s} ${y + 70 * s} L ${x + 105 * s} ${VIEW_H} Z`}
        fill={fill}
        stroke={rim}
        strokeWidth={4}
      />
    </g>
  );
};

/**
 * Persona-style page transition: a crowded train carriage slides in from the right,
 * covers the screen while the page changes, then slides off to the left.
 * The crowd is drawn here in SVG (original artwork in the site's cyan palette).
 */
export const CrowdTransition = ({ onCovered, onDone }: CrowdTransitionProps) => {
  const controls = useAnimationControls();
  // Keep the latest callbacks without restarting the animation
  const callbacks = useRef({ onCovered, onDone });
  callbacks.current = { onCovered, onDone };

  const layers = useMemo(() => LAYERS, []);

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    (async () => {
      // Panel is 140vw wide with slanted edges; -18vw is the position where it covers the whole screen
      await new Promise((r) => setTimeout(r, CROWD_TRANSITION_DELAY_MS));
      if (cancelled) return;
      // Slide in while fading in, hold while the page switches, then slide out while fading out
      await controls.start({
        x: '-18vw',
        opacity: 1,
        transition: { x: { duration: SLIDE_IN_S, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: FADE_S } },
      });
      if (cancelled) return;
      callbacks.current.onCovered();
      await new Promise((r) => setTimeout(r, HOLD_MS));
      if (cancelled) return;
      await controls.start({
        x: '-140vw',
        opacity: 0,
        transition: {
          x: { duration: SLIDE_OUT_S, ease: [0.65, 0, 0.35, 1] },
          opacity: { duration: FADE_S, delay: SLIDE_OUT_S - FADE_S },
        },
      });
      if (!cancelled) {
        finished = true;
        callbacks.current.onDone();
      }
    })();
    return () => {
      cancelled = true;
      // Removed before it finished (e.g. the dashboard briefly showed its error screen):
      // still report done, so the page-change lock is released. Otherwise every later
      // menu pick was silently ignored until a reload.
      if (!finished) callbacks.current.onDone();
    };
  }, [controls]);

  return (
    <div aria-hidden className="pointer-events-auto fixed inset-0 z-[70] overflow-hidden">
      <motion.div
        initial={{ x: '100vw', opacity: 0 }}
        animate={controls}
        className="absolute inset-y-0 left-0 w-[140vw]"
        style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMax slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="crowd-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#050809" />
              <stop offset="100%" stopColor="#0b2530" />
            </linearGradient>
            <linearGradient id="crowd-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="55%" stopColor="#050809" stopOpacity="0" />
              <stop offset="100%" stopColor="#050809" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#crowd-bg)" />
          {/* Overhead rail the straps hang from */}
          <rect x={0} y={0} width={VIEW_W} height={14} fill="#0a1418" />
          {layers.map((layer, i) => (
            <g key={i} className={layer.drift}>
              {layer.figures.map((f, j) => (
                <CommuterSvg key={j} f={f} fill={layer.fill} rim={layer.rim} />
              ))}
            </g>
          ))}
          <rect width={VIEW_W} height={VIEW_H} fill="url(#crowd-floor)" />
          {/* Speed lines */}
          {[180, 340, 760, 880].map((y, i) => (
            <rect key={y} x={i * 400} y={y} width={900 + i * 120} height={6} fill="#3aadd0" opacity={0.35} />
          ))}
        </svg>
        {/* Cyan leading and trailing edges, following the slanted cut */}
        <div
          className="absolute inset-0 bg-primary"
          style={{ clipPath: 'polygon(12% 0%, 12.6% 0%, 0.6% 100%, 0% 100%, 0% 100%)' }}
        />
        <div
          className="absolute inset-0 bg-primary"
          style={{ clipPath: 'polygon(99.4% 0%, 100% 0%, 88% 100%, 87.4% 100%)' }}
        />
      </motion.div>
    </div>
  );
};
