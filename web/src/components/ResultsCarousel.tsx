import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { ComparisonResult } from '../api/pizzerias.ts';
import { formatDistance, formatEta, formatPrice } from '../lib/format.ts';

interface Props {
  results: ComparisonResult[];
  onOrder: (result: ComparisonResult) => void;
  orderPending: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({ y: direction > 0 ? 28 : -28, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? -28 : 28, opacity: 0 }),
};

// One pizzeria at a time in a fixed-height card, stepped through with the
// arrows — so the ranked list never grows the page, matching the carousel
// the pizza builder itself uses.
export function ResultsCarousel({ results, onOrder, orderPending }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const result = results[index];

  const go = (next: number, dir: number) => {
    if (next < 0 || next >= results.length) return;
    setDirection(dir);
    setIndex(next);
  };

  return (
    <div className="space-y-2">
      <div className="relative min-h-40 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {index > 0 && <CarouselArrow direction="up" onClick={() => go(index - 1, -1)} />}
        {index < results.length - 1 && <CarouselArrow direction="down" onClick={() => go(index + 1, 1)} />}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.article
            key={result.pizzeriaId}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-neutral-900">{result.pizzeriaName}</h3>
                <p className="text-sm text-neutral-600">
                  {formatDistance(result.distanceKm)} · {formatEta(result.etaMinutes)}
                </p>
                {result.matchQuality === 'approximate' && (
                  <p className="mt-1 text-xs text-amber-600">
                    Closest match{result.missingToppings.length > 0 && ` — missing: ${result.missingToppings.join(', ').toLowerCase()}`}
                    {!result.crustAvailable && ' — crust substituted'}
                    {!result.sauceAvailable && ' — sauce unavailable'}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-lg font-semibold text-neutral-900">{formatPrice(result.priceAgorot)}</span>
                <button
                  type="button"
                  onClick={() => onOrder(result)}
                  disabled={orderPending}
                  className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
                >
                  Order
                </button>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-neutral-500">
        {index + 1} of {results.length}
      </p>
    </div>
  );
}

function CarouselArrow({ direction, onClick }: { direction: 'up' | 'down'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'up' ? 'Previous pizzeria' : 'Next pizzeria'}
      className={`absolute left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition hover:text-neutral-600 ${
        direction === 'up' ? 'top-2' : 'bottom-2'
      }`}
    >
      {direction === 'up' ? '↑' : '↓'}
    </button>
  );
}
