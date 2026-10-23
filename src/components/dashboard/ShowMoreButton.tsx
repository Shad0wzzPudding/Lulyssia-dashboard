import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** How many items a long section shows at first, and how many more each "Show more" adds */
export const SECTION_PAGE_SIZE = 25;

/** The bar under a long section (Tasks, Events): cyan, like the page's other actions, so it isn't missed */
export const ShowMoreButton = ({ left, onClick }: { left: number; onClick: () => void }) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="mt-3 w-full border-2 border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
  >
    <ChevronDown size={16} className="mr-1" />
    Show more ({left} left)
  </Button>
);
