import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { TOPPING_OPTIONS, type Topping } from '../api/catalog.ts';
import type { ComparisonResult } from '../api/pizzerias.ts';
import { formatDistance, formatEta, formatPrice } from '../lib/format.ts';

const toppingLabel = (topping: Topping) => TOPPING_OPTIONS.find((o) => o.value === topping)?.label ?? topping;

interface Props {
  results: ComparisonResult[];
  onOrder: (result: ComparisonResult) => void;
  orderPending: boolean;
}

const PAGE_SIZE = 5;

const slideVariants = {
  enter: (direction: number) => ({ y: direction > 0 ? 24 : -24, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? -24 : 24, opacity: 0 }),
};

// Five pizzerias at a time, paged with the arrows — so the ranked list
// never grows the page regardless of how many results come back.
export function ResultsCarousel({ results, onOrder, orderPending }: Props) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const pageCount = Math.ceil(results.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visible = results.slice(start, start + PAGE_SIZE);

  const go = (next: number, dir: number) => {
    if (next < 0 || next >= pageCount) return;
    setDirection(dir);
    setPage(next);
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {page > 0 && <CarouselArrow direction="up" onClick={() => go(page - 1, -1)} />}
        {page < pageCount - 1 && <CarouselArrow direction="down" onClick={() => go(page + 1, 1)} />}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="divide-y divide-neutral-100 py-7"
          >
            {visible.map((result) => (
              <article key={result.pizzeriaId} className="px-4 py-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-neutral-900">{result.pizzeriaName}</h3>
                    <p className="text-sm text-neutral-600">
                      {formatDistance(result.distanceKm)} · {formatEta(result.etaMinutes)}
                    </p>
                    {result.matchQuality === 'approximate' && (
                      <p className="mt-1 text-xs text-amber-600">
                        Closest match
                        {result.missingToppings.length > 0 && ` — missing: ${result.missingToppings.map(toppingLabel).join(', ')}`}
                        {!result.crustAvailable && ' — crust substituted'}
                        {!result.sauceAvailable && ' — sauce unavailable'}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-base font-semibold text-neutral-900">{formatPrice(result.priceAgorot)}</span>
                    <button
                      type="button"
                      onClick={() => onOrder(result)}
                      disabled={orderPending}
                      className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-white hover:bg-neutral-700 disabled:opacity-50"
                    >
                      Order
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-neutral-500">
        {start + 1}–{start + visible.length} of {results.length}
      </p>
    </div>
  );
}

function CarouselArrow({ direction, onClick }: { direction: 'up' | 'down'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'up' ? 'Previous page' : 'Next page'}
      className={`absolute left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition hover:text-neutral-600 ${
        direction === 'up' ? 'top-2' : 'bottom-2'
      }`}
    >
      {direction === 'up' ? '↑' : '↓'}
    </button>
  );
}
