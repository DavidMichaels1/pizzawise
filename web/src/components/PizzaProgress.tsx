import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type CSSProperties } from 'react';

type ProgressStatus = 'loading' | 'success';

/**
 * comparePizzerias is a single fetch — there's no real progress to report.
 * This eases toward 90% while the request is in flight; the parent flips
 * `status` to 'success' the moment results arrive, which snaps the fill
 * the rest of the way for the celebration below.
 */
function useFakeProgress(active: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      setProgress(90 * (1 - Math.exp(-(now - start) / 1300)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return progress;
}

// A wide wedge with a rounded crust — apex at the bottom so the fill below
// can rise upward like a gauge.
const SLICE_PATH = 'M50,96 L16,18 Q50,2 84,18 Z';
// Positions checked against the slice's actual slanted edges (see
// LivePizzaPreview for the same containment math) so none of these clip
// outside the triangle — the old set had two spilling past the edges.
const PEPPERONI = [
  { cx: 50, cy: 36, r: 6 },
  { cx: 38, cy: 46, r: 5 },
  { cx: 62, cy: 46, r: 5 },
  { cx: 50, cy: 68, r: 4.5 },
];

const DOUGH_COLOR = [253, 230, 138] as const; // pale, "unbaked"
const BAKED_COLOR = [234, 88, 12] as const; // deep orange, "fresh out the oven"

function fillColor(progress: number): string {
  const t = Math.min(Math.max(progress / 100, 0), 1);
  const [r, g, b] = DOUGH_COLOR.map((c, i) => Math.round(c + (BAKED_COLOR[i] - c) * t));
  return `rgb(${r},${g},${b})`;
}

const CONFETTI = ['🎉', '✨', '🧀', '🎉', '✨', '🧀', '🎉', '✨'].map((emoji, i, arr) => ({
  emoji,
  angle: (360 / arr.length) * i,
}));

// Wisps of steam drifting up off the crust while it "cooks" — based just
// above the slice (not over it) so they read as rising, not as smudges on
// the pizza — with staggered positions, drift and timing to avoid lockstep.
const SMOKE_PUFFS = [
  { left: '30%', bottom: '66%', drift: '-12px', duration: 2.6, delay: 0 },
  { left: '50%', bottom: '72%', drift: '6px', duration: 2.2, delay: 0.6 },
  { left: '68%', bottom: '68%', drift: '14px', duration: 2.8, delay: 1.1 },
  { left: '44%', bottom: '75%', drift: '-8px', duration: 2.4, delay: 1.6 },
];

// The oven's viewing window, as inset percentages of the 288px stage —
// shared by the window frame, its glass sheen and the steam clipped inside it.
const WINDOW_INSET: CSSProperties = { top: '14%', bottom: '18%', left: '13%', right: '13%' };
const OVEN_COLOR = '#292524'; // stone-800

export function PizzaProgress({ status, label }: { status: ProgressStatus; label: string }) {
  const loadingProgress = useFakeProgress(status === 'loading');
  const done = status === 'success';
  const progress = done ? 100 : loadingProgress;
  const fillTop = 96 - (progress / 100) * 94;

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="relative h-72 w-72" style={{ perspective: 1000 }}>
        {done && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                {CONFETTI.map((c, i) => (
                  <span
                    key={i}
                    className="absolute text-2xl"
                    style={{ '--angle': `${c.angle}deg`, animation: 'confetti-burst 0.7s ease-out forwards' } as CSSProperties}
                  >
                    {c.emoji}
                  </span>
                ))}
              </div>
              <span role="img" aria-label="Pizza ready" className="text-[10rem] leading-none" style={{ animation: 'pizza-pop 0.4s ease-out' }}>
                🍕
              </span>
            </div>
          </div>
        )}

        {/* Baking inside the oven — bottom-aligned in the window, leaving headroom above the
            crust for steam to rise through before the frame clips it. */}
        {!done && (
          <div className="absolute flex items-end justify-center pb-3" style={WINDOW_INSET}>
            <svg viewBox="0 0 100 100" className="h-32 w-32" aria-hidden>
              <defs>
                <clipPath id="pizza-progress-clip">
                  <rect x="0" y={fillTop} width="100" height={100 - fillTop} />
                </clipPath>
              </defs>
              <path d={SLICE_PATH} fill="#e5e5e5" />
              <g clipPath="url(#pizza-progress-clip)">
                <path d={SLICE_PATH} fill={fillColor(progress)} />
              </g>
              <path d={SLICE_PATH} fill="none" stroke="#d4d4d4" strokeWidth="1.5" />
              {PEPPERONI.map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#7c2d12" opacity={0.55} />
              ))}
            </svg>
          </div>
        )}

        {/* The oven door — drops open on success to reveal the finished pizza behind it. */}
        <AnimatePresence>
          {!done && (
            <motion.div
              key="oven-door"
              className="absolute inset-0 overflow-hidden rounded-[2rem]"
              style={{ transformOrigin: 'bottom center' }}
              exit={{ rotateX: -110, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
            >
              {/* Steam sits behind the window frame so the frame's shadow (below) naturally
                  clips any puff that drifts past the glass. */}
              <div className="pointer-events-none absolute" style={WINDOW_INSET} aria-hidden>
                {SMOKE_PUFFS.map((p, i) => (
                  <span
                    key={i}
                    className="absolute h-4 w-4 rounded-full bg-neutral-500/70 blur-[2px]"
                    style={
                      { left: p.left, bottom: p.bottom, '--drift': p.drift, animation: `smoke-rise ${p.duration}s ease-out ${p.delay}s infinite` } as CSSProperties
                    }
                  />
                ))}
              </div>

              {/* The window's own box stays transparent; its oversized shadow paints the rest of the oven face. */}
              <div className="absolute rounded-2xl border-4 border-stone-600" style={{ ...WINDOW_INSET, boxShadow: `0 0 0 9999px ${OVEN_COLOR}` }} />

              {/* Glass sheen, over the frame so it still reads as a window rather than a hole. */}
              <div
                className="pointer-events-none absolute rounded-2xl"
                style={{ ...WINDOW_INSET, background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 55%)' }}
                aria-hidden
              />

              <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2" style={{ height: '14%' }} aria-hidden>
                <span className="h-2 w-2 rounded-full bg-stone-500" />
                <span className="h-2 w-2 rounded-full bg-stone-500" />
                <span className="h-2 w-2 rounded-full bg-stone-500" />
              </div>
              <div className="absolute inset-x-12 rounded-full bg-stone-500" style={{ bottom: '8%', height: '6px' }} aria-hidden />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-neutral-600">{done ? 'Found the best deals!' : label}</p>
    </div>
  );
}
