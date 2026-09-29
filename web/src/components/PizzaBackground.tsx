import { useEffect, useState } from 'react';

// Density is tied to a fixed pixel tile size, not viewport percentage, so
// the scattered look stays consistent whether the window is tiny or huge —
// a bigger viewport gets proportionally more pizzas instead of the same
// handful stretched thin.
const TILE_SIZE = 180;
const SKIP_PROBABILITY = 0.4;

interface PizzaSpec {
  key: string;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildPizzas(width: number, height: number): PizzaSpec[] {
  const cols = Math.ceil(width / TILE_SIZE);
  const rows = Math.ceil(height / TILE_SIZE);
  const pizzas: PizzaSpec[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const seed = row * 1000 + col;
      if (seededRandom(seed) < SKIP_PROBABILITY) continue;

      pizzas.push({
        key: `${row}-${col}`,
        left: col * TILE_SIZE + seededRandom(seed + 0.1) * TILE_SIZE,
        top: row * TILE_SIZE + seededRandom(seed + 0.2) * TILE_SIZE,
        size: 24 + seededRandom(seed + 0.3) * 34,
        duration: 10 + seededRandom(seed + 0.4) * 10,
        delay: seededRandom(seed + 0.5) * 3,
        rotate: seededRandom(seed + 0.6) * 40 - 20,
      });
    }
  }
  return pizzas;
}

export function PizzaBackground() {
  const [pizzas, setPizzas] = useState<PizzaSpec[]>([]);

  useEffect(() => {
    const recompute = () => setPizzas(buildPizzas(window.innerWidth, window.innerHeight));
    recompute();

    let resizeTimeout: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(recompute, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {pizzas.map((p) => (
        <span
          key={p.key}
          className="absolute select-none opacity-[0.09] grayscale"
          style={{
            top: p.top,
            left: p.left,
            fontSize: p.size,
            animation: `float-pizza ${p.duration}s ease-in-out ${p.delay}s infinite`,
            ['--rot' as string]: `${p.rotate}deg`,
          }}
        >
          🍕
        </span>
      ))}
    </div>
  );
}
