import { useEffect, useState } from 'react';

/**
 * comparePizzerias is a single fetch — there's no real progress to report.
 * This eases toward 90% while the request is in flight and relies on the
 * parent swapping it out for real results the moment they arrive, rather
 * than faking a completion to 100%.
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
      setProgress(90 * (1 - Math.exp(-(now - start) / 1800)));
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

export function PizzaProgress({ active, label }: { active: boolean; label: string }) {
  const progress = useFakeProgress(active);
  const fillTop = 96 - (progress / 100) * 94;

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <svg viewBox="0 0 100 100" className="h-40 w-40" aria-hidden>
        <defs>
          <clipPath id="pizza-progress-clip">
            <rect x="0" y={fillTop} width="100" height={100 - fillTop} />
          </clipPath>
        </defs>
        <path d={SLICE_PATH} fill="#e5e5e5" />
        <g clipPath="url(#pizza-progress-clip)">
          <path d={SLICE_PATH} fill="#f97316" />
        </g>
        <path d={SLICE_PATH} fill="none" stroke="#d4d4d4" strokeWidth="1.5" />
        {PEPPERONI.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#7c2d12" opacity={0.55} />
        ))}
      </svg>
      <p className="text-neutral-600">{label}</p>
    </div>
  );
}
