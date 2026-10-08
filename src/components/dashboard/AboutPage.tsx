import { Info } from 'lucide-react';
import { PageIcon } from './PageIcon';
import { AboutLulyssiaCard } from './AboutLulyssiaCard';
import { useMenuAnimations } from '@/hooks/usePageTransitions';
import lulyssiaSitting from '@/assets/image/lulyssia_sitting.webp';

/** About page: Lulyssia's profile card with her sitting art beside it. */
export const AboutPage = () => {
  // Same "Side menu effects" switch as the drawer: when off, the art holds still
  const animate = useMenuAnimations();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PageIcon icon={Info} />
        <h1 className="p5-title w-fit text-2xl">About</h1>
      </div>

      <div className="max-w-xl">
        <AboutLulyssiaCard large />
      </div>

      {/* Lulyssia's art (max 42rem wide, no height limit).
          Phones: in the page, below the card.
          Wider screens: pinned to the right of the window, floating over the page, so it
          takes no space and the page stays only as tall as the card. Her top sits just
          below the header; whatever is taller than the window is cut off at its bottom edge.
          Clicks pass through her. */}
      <img
        src={lulyssiaSitting}
        alt="Lulyssia sitting on a case surrounded by evidence and butterflies"
        className={`mx-auto w-full max-w-[42rem] select-none md:pointer-events-none md:fixed md:right-[4vw] md:top-24 md:z-10 md:mx-0 md:w-[min(42rem,48vw)] ${
          animate ? 'animate-character-float' : ''
        }`}
        draggable={false}
      />
    </div>
  );
};
