import { AnimatePresence, motion } from 'framer-motion';
import lulyssiaTrigger from '@/assets/image/lulyssia_trigger.webp';

// How long the cut-in stays on screen (ms). The sound keeps playing after it clears.
export const SKILL_CUT_IN_DURATION = 1600;

const seconds = SKILL_CUT_IN_DURATION / 1000;

// Comic dot pattern laid over the cyan band, matching the halftone in the art
const HALFTONE = 'radial-gradient(hsl(var(--primary-foreground) / 0.35) 28%, transparent 30%)';
// Diagonal white streaks that rush across the screen
const SPEED_LINES =
  'repeating-linear-gradient(-12deg, transparent 0 22px, rgb(255 255 255 / 0.18) 22px 24px, transparent 24px 60px, rgb(255 255 255 / 0.08) 60px 61px, transparent 61px 90px)';

/**
 * Persona-style "skill activation" cut-in: the screen darkens, a halftone cyan
 * slash band tears across the middle with speed lines, Lulyssia's eyes slam in
 * from the right and the skill name card slams in under them, both drift for a
 * beat, then everything zips off.
 */
export const SkillCutIn = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        key="skill-cut-in"
        className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        // Small screen shake on impact
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, -10, 8, -5, 3, 0], y: [0, 6, -5, 3, -1, 0] }}
        transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
      >
        {/* Dark backdrop */}
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.85, 0] }}
          transition={{ duration: seconds, times: [0, 0.08, 0.85, 1] }}
        />

        {/* Cyan slash band behind the portrait, with thin white edge stripes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex w-[160vw] shrink-0 -rotate-12 flex-col gap-3">
            <motion.div
              className="h-2 bg-white"
              style={{ transformOrigin: 'left center' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 1, 1], opacity: [1, 1, 1, 0] }}
              transition={{ duration: seconds, times: [0, 0.16, 0.85, 1], ease: 'easeOut' }}
            />
            <motion.div
              className="h-[46vh] max-h-[420px] bg-primary"
              style={{ transformOrigin: 'left center', backgroundImage: HALFTONE, backgroundSize: '9px 9px' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 1, 1], opacity: [1, 1, 1, 0] }}
              transition={{ duration: seconds, times: [0, 0.12, 0.85, 1], ease: 'easeOut' }}
            />
            <motion.div
              className="h-2 bg-white"
              style={{ transformOrigin: 'right center' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 1, 1], opacity: [1, 1, 1, 0] }}
              transition={{ duration: seconds, times: [0, 0.16, 0.85, 1], ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Speed lines */}
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          style={{ backgroundImage: SPEED_LINES }}
          initial={{ opacity: 0, backgroundPosition: '0px 0px' }}
          animate={{ opacity: [0, 0.9, 0.9, 0], backgroundPosition: ['0px 0px', '-1200px 0px'] }}
          transition={{ duration: seconds, times: [0, 0.1, 0.85, 1], ease: 'linear' }}
        />

        {/* White flash on impact */}
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.25, delay: 0.1 }}
        />

        {/* The portrait: slam in, slow drift, zip out */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img
            src={lulyssiaTrigger}
            alt=""
            draggable={false}
            className="w-[min(163vw,1375px)] max-w-none select-none drop-shadow-[0_0_30px_hsl(var(--primary)/0.6)]"
            initial={{ x: '70vw', opacity: 0, skewX: -12, scale: 1.15 }}
            animate={{
              x: ['70vw', '-2vw', '2vw', '-90vw'],
              opacity: [0, 1, 1, 0],
              skewX: [-12, 0, 0, -12],
              scale: [1.15, 1, 1.03, 1],
            }}
            transition={{ duration: seconds, times: [0, 0.14, 0.82, 1], ease: 'easeOut' }}
          />
        </div>

        {/* Skill name card: slams in from the left just after the portrait lands */}
        <motion.div
          className="absolute bottom-[12%] right-[6%] flex flex-col items-end gap-1"
          initial={{ x: '-60vw', opacity: 0, skewX: -20 }}
          animate={{
            x: ['-60vw', '-60vw', '1vw', '-1vw', '60vw'],
            opacity: [0, 0, 1, 1, 0],
            skewX: [-20, -20, 0, 0, -20],
          }}
          transition={{ duration: seconds, times: [0, 0.2, 0.28, 0.82, 1], ease: 'easeOut' }}
        >
          <span className="p5-title text-4xl italic sm:text-6xl">Skill Activates!</span>
          <span className="-skew-x-12 bg-black px-3 text-xs font-extrabold uppercase italic tracking-[0.12em] text-white sm:text-sm">
            Lulyssia · Return to top
          </span>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
