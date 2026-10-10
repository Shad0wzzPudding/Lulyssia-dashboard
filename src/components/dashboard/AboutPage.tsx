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
          Phones, tablets and narrow windows (under 1280px): in the page, below the card.
          Wide screens (xl, 1280px+, the first width where she clears the card): anchored to the top right of the content area in Index (so she starts
          just below the top bar, over the welcome greeting) and scrolls with the page, floating
          over it, so it takes no space and the page stays only as tall as the card.
          Whatever reaches past the bottom of the page is cut off there (Index clips it), so
          she never makes the page longer. Clicks pass through her. */}
      <img
        src={lulyssiaSitting}
        alt="Lulyssia sitting on a case surrounded by evidence and butterflies"
        className={`mx-auto w-full max-w-[42rem] select-none xl:pointer-events-none xl:absolute xl:right-4 xl:top-8 xl:z-10 xl:mx-0 xl:mt-0 xl:w-[min(42rem,48vw)] ${
          animate ? 'animate-character-float' : ''
        }`}
        draggable={false}
      />
    </div>
  );
};
