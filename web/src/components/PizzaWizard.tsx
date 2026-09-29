import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { CRUST_OPTIONS, SAUCE_OPTIONS, SIZE_OPTIONS, TOPPING_OPTIONS, type PizzaConfig, type Topping } from '../api/catalog.ts';
import type { Coordinates } from '../api/pizzerias.ts';
import { LivePizzaPreview } from './LivePizzaPreview.tsx';
import { LocationPicker } from './LocationPicker.tsx';

const STEPS = ['size', 'crust', 'sauce', 'toppings', 'location'] as const;
type Step = (typeof STEPS)[number];

const STEP_COPY: Record<Step, { title: string; subtitle: string }> = {
  size: { title: 'How big?', subtitle: 'Pick a size to get started.' },
  crust: { title: 'Pick a crust', subtitle: "We'll match it to each pizzeria's closest option." },
  sauce: { title: 'Choose your sauce', subtitle: '' },
  toppings: { title: 'Add toppings', subtitle: 'Pick as many as you like, then continue with the arrow.' },
  location: { title: 'Where to?', subtitle: "We'll find the best value nearby." },
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

interface PizzaWizardProps {
  initialConfig: PizzaConfig;
  // A favorite already has every pick made — only the location is left, so
  // the wizard opens there instead of making the user click through picks
  // that are already set (they're still free to arrow back and change them).
  skipToLocation?: boolean;
  onComplete: (config: PizzaConfig, location: Coordinates) => void;
}

export function PizzaWizard({ initialConfig, skipToLocation = false, onComplete }: PizzaWizardProps) {
  const [stepIndex, setStepIndex] = useState(skipToLocation ? STEPS.length - 1 : 0);
  const [direction, setDirection] = useState(1);
  const [config, setConfig] = useState<PizzaConfig>(initialConfig);
  const [location, setLocation] = useState<Coordinates | null>(null);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const goTo = (index: number, dir: number) => {
    setDirection(dir);
    setStepIndex(index);
  };
  const goNext = () => {
    if (!isLast) goTo(stepIndex + 1, 1);
  };
  const goBack = () => {
    if (!isFirst) goTo(stepIndex - 1, -1);
  };

  // Single-select steps advance automatically a beat after a pick, so the
  // selection highlight is visible before the slide moves on.
  const pickAndAdvance = (updater: (c: PizzaConfig) => PizzaConfig) => {
    setConfig(updater);
    window.setTimeout(goNext, 280);
  };

  const toggleTopping = (topping: Topping) => {
    setConfig((c) => ({
      ...c,
      toppings: c.toppings.includes(topping) ? c.toppings.filter((t) => t !== topping) : [...c.toppings, topping],
    }));
  };

  const handleLocationPicked = (picked: Coordinates) => {
    setLocation(picked);
    window.setTimeout(() => onComplete(config, picked), 350);
  };

  const { title, subtitle } = STEP_COPY[step];

  return (
    <div className="mx-auto max-w-md">
      <ProgressDots current={stepIndex} total={STEPS.length} />

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {!isFirst && <ArrowButton direction="left" onClick={goBack} />}
        {!isLast && <ArrowButton direction="right" onClick={goNext} />}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="px-7"
          >
            <h2 className="text-center text-xl font-semibold text-neutral-900">{title}</h2>
            {subtitle && <p className="mt-1 text-center text-sm text-neutral-500">{subtitle}</p>}

            <div className="mt-6">
              {step === 'size' && (
                <OptionGrid
                  options={SIZE_OPTIONS}
                  isActive={(v) => config.size === v}
                  onSelect={(v) => pickAndAdvance((c) => ({ ...c, size: v }))}
                />
              )}
              {step === 'crust' && (
                <OptionGrid
                  options={CRUST_OPTIONS}
                  isActive={(v) => config.crust === v}
                  onSelect={(v) => pickAndAdvance((c) => ({ ...c, crust: v }))}
                />
              )}
              {step === 'sauce' && (
                <OptionGrid
                  options={SAUCE_OPTIONS}
                  isActive={(v) => config.sauce === v}
                  onSelect={(v) => pickAndAdvance((c) => ({ ...c, sauce: v }))}
                />
              )}
              {step === 'toppings' && (
                <>
                  <OptionGrid options={TOPPING_OPTIONS} isActive={(v) => config.toppings.includes(v)} onSelect={toggleTopping} />
                  <p className="mt-4 text-center text-xs text-neutral-500">
                    {config.toppings.length === 0 ? 'No toppings? That works too.' : `${config.toppings.length} selected`} — use
                    the arrow to continue.
                  </p>
                </>
              )}
              {step === 'location' && <LocationPicker value={location} onChange={handleLocationPicked} />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <LivePizzaPreview config={config} stepIndex={stepIndex} />
    </div>
  );
}

function ArrowButton({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Back' : 'Next'}
      className={`absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition hover:text-neutral-600 ${
        direction === 'left' ? 'left-2' : 'right-2'
      }`}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-neutral-900' : 'w-1.5 bg-neutral-300'}`} />
      ))}
    </div>
  );
}

function OptionGrid<T extends string>({
  options,
  isActive,
  onSelect,
}: {
  options: { value: T; label: string }[];
  isActive: (value: T) => boolean;
  onSelect: (value: T) => void;
}) {
  return (
    // flex-wrap + justify-center (rather than a grid) so a half-empty last
    // row centers its items instead of hugging the left edge with blank
    // space trailing on the right.
    <div className="flex flex-wrap justify-center gap-3">
      {options.map((opt) => {
        const active = isActive(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`w-[calc(50%-0.375rem)] rounded-xl border px-3 py-3 text-sm font-medium transition sm:w-[calc(33.333%-0.5rem)] ${
              active
                ? 'scale-[1.03] border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
