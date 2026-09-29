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

export function PizzaProgress({ status, label }: { status: ProgressStatus; label: string }) {
  const loadingProgress = useFakeProgress(status === 'loading');
  const done = status === 'success';
  const progress = done ? 100 : loadingProgress;
  const fillTop = 96 - (progress / 100) * 94;

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="relative flex h-56 w-56 items-center justify-center">
        {done && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="absolute text-xl"
                style={{ '--angle': `${c.angle}deg`, animation: 'confetti-burst 0.7s ease-out forwards' } as CSSProperties}
              >
                {c.emoji}
              </span>
            ))}
          </div>
        )}
        {done ? (
          <span
            role="img"
            aria-label="Pizza ready"
            className="text-8xl"
            style={{ animation: 'pizza-pop 0.4s ease-out' }}
          >
            🍕
          </span>
        ) : (
          <svg viewBox="0 0 100 100" className="h-56 w-56" aria-hidden>
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
        )}
      </div>
      <p className="text-neutral-600">{done ? 'Found the best deals!' : label}</p>
    </div>
  );
}
