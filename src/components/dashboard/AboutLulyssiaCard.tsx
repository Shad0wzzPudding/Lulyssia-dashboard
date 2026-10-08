import lulyssiaPortrait from '@/assets/image/lulyssia_portrait.webp';

// ---- Edit Lulyssia's profile here ----
const NAME = 'Lulyssia Swiftshade';
const ROLE = 'Dashboard assistant';
// Placeholder bio based on what she does in the app; replace with her real story.
const BIO =
  'Hi there. I\'m your guide around this dashboard. I keep an eye on your tasks, events and interests, and sends you a letter on LINE every morning.';
const BIO2 = '*Ahem* But that need to be link with your line first, so please do that in the setting page.🦋';

const TAGS = ['Tasks', 'Events', 'LINE letters'];
// --------------------------------------

// Slanted frame, same shape family as the portrait in the message menu
const PORTRAIT_SHAPE = 'polygon(14% 0%, 100% 3%, 92% 100%, 0% 95%)';

/**
 * "About Lulyssia" profile card: portrait, name, role, short bio and tags.
 * `large` is the bigger version used on the About page.
 */
export const AboutLulyssiaCard = ({ large = false }: { large?: boolean }) => (
  <section
    aria-label={`About ${NAME}`}
    className={`-skew-x-3 border-2 border-foreground/80 bg-card/95 shadow-[4px_4px_0_0_hsl(var(--primary))] backdrop-blur-sm ${
      large ? 'p-5 shadow-[6px_6px_0_0_hsl(var(--primary))]' : 'p-3'
    }`}
  >
    <div className="skew-x-3">
      <span className={`p5-title mb-2 inline-block ${large ? 'text-sm' : 'text-xs'}`}>About</span>

      <div className={`flex ${large ? 'gap-5' : 'gap-3'}`}>
        {/* Portrait: white outline, then the picture, both cut to the slanted frame */}
        <div className={`relative shrink-0 ${large ? 'h-44 w-36' : 'h-24 w-20'}`}>
          <span aria-hidden className="absolute inset-0 bg-foreground" style={{ clipPath: PORTRAIT_SHAPE }} />
          <span className="absolute inset-[3px] overflow-hidden bg-background" style={{ clipPath: PORTRAIT_SHAPE }}>
            <img src={lulyssiaPortrait} alt={NAME} className="h-full w-full object-cover object-top" />
          </span>
        </div>

        <div className="min-w-0">
          <h3 className={`leading-tight text-primary ${large ? 'text-2xl' : 'text-base'}`}>{NAME}</h3>
          <p
            className={`mb-1 font-semibold uppercase tracking-wider text-muted-foreground ${
              large ? 'text-xs' : 'text-[11px]'
            }`}
          >
            {ROLE}
          </p>
          <p className={`leading-snug text-foreground/90 ${large ? 'text-sm' : 'text-xs'}`}>{BIO}<br/><br/>{BIO2}</p>
        </div>
      </div>

      <div className={`flex flex-wrap gap-1.5 ${large ? 'mt-4' : 'mt-2'}`}>
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="-skew-x-12 border border-primary/60 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
          >
            <span className="inline-block skew-x-12">{tag}</span>
          </span>
        ))}
      </div>
    </div>
  </section>
);
