import { AnimatePresence, motion } from 'framer-motion';
import type { Crust, PizzaConfig, Sauce, Size, Topping } from '../api/catalog.ts';

const SIZE_RADIUS: Record<Size, number> = { SMALL: 62, MEDIUM: 76, LARGE: 90 };

const CRUST_STYLE: Record<Crust, { width: number; color: string }> = {
  THIN: { width: 9, color: '#d9a05b' },
  STUFFED: { width: 20, color: '#e0ae64' },
  GLUTEN_FREE: { width: 9, color: '#e8c07d' },
  SOURDOUGH: { width: 13, color: '#b9793f' },
  PAN: { width: 22, color: '#c98a4a' },
  NEAPOLITAN: { width: 11, color: '#d9a05b' },
};

const SAUCE_COLOR: Record<Sauce, string> = {
  TOMATO: '#c0392b',
  WHITE: '#f3e9d2',
  PESTO: '#5b7f37',
  BBQ: '#5a3320',
  SAN_MARZANO: '#8e2a1f',
};

// Most toppings render as their emoji; PEPPERONI and BUFFALO_MOZZARELLA get
// a drawn circle instead (no emoji reads as a pizza-appropriate slice of
// either), and EXTRA_CHEESE is a modifier on the cheese layer, not an icon.
const TOPPING_EMOJI: Partial<Record<Topping, string>> = {
  MUSHROOM: '🍄',
  ONION: '🧅',
  OLIVES: '🫒',
  PINEAPPLE: '🍍',
  ANCHOVY: '🐟',
  ARTICHOKE: '🌿',
  TRUFFLE_OIL: '✨',
  PROSCIUTTO: '🥓',
  CORN: '🌽',
  JALAPENO: '🌶️',
};

const DOUGH_COLOR = '#f3e5c8';
const SPRING = { type: 'spring', stiffness: 260, damping: 20 } as const;

// Every icon-eligible topping gets a permanently assigned slot (its index
// here) in a sunflower/phyllotaxis layout — points generated this way are
// evenly spread with guaranteed minimum spacing, unlike independent random
// placement per topping, which had no way to know about the others and let
// icons land on top of each other. Because each topping's slot is fixed by
// its own identity rather than by which others are selected, toggling one
// topping never reshuffles the rest.
const ICON_TOPPING_ORDER: Topping[] = [
  'MUSHROOM',
  'ONION',
  'OLIVES',
  'PEPPERONI',
  'PINEAPPLE',
  'ANCHOVY',
  'BUFFALO_MOZZARELLA',
  'ARTICHOKE',
  'TRUFFLE_OIL',
  'PROSCIUTTO',
  'CORN',
  'JALAPENO',
];
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function slotPosition(topping: Topping, maxRadius: number) {
  const index = ICON_TOPPING_ORDER.indexOf(topping);
  const angle = index * GOLDEN_ANGLE;
  const radius = maxRadius * Math.sqrt((index + 0.5) / ICON_TOPPING_ORDER.length);
  return { x: 100 + radius * Math.cos(angle), y: 100 + radius * Math.sin(angle) };
}

interface Props {
  config: PizzaConfig;
  /** Gates which layers are visible, so the pizza visibly builds step by step alongside the wizard. */
  stepIndex: number;
}

export function LivePizzaPreview({ config, stepIndex }: Props) {
  const pizzaRadius = SIZE_RADIUS[config.size];
  const crustStyle = stepIndex >= 1 ? CRUST_STYLE[config.crust] : { width: 0, color: DOUGH_COLOR };
  const sauceRadius = pizzaRadius - crustStyle.width;
  const sauceColor = stepIndex >= 2 ? SAUCE_COLOR[config.sauce] : DOUGH_COLOR;
  const hasExtraCheese = config.toppings.includes('EXTRA_CHEESE');
  const iconToppings = stepIndex >= 3 ? config.toppings.filter((t) => t !== 'EXTRA_CHEESE') : [];
  const iconMaxRadius = sauceRadius - 16;

  return (
    <div className="flex justify-center py-6">
      <svg viewBox="0 0 200 200" className="h-64 w-64" aria-hidden>
        <motion.circle
          cx={100}
          cy={100}
          initial={{ r: pizzaRadius, fill: crustStyle.color }}
          animate={{ r: pizzaRadius, fill: crustStyle.color }}
          transition={SPRING}
        />
        <motion.circle
          cx={100}
          cy={100}
          initial={{ r: sauceRadius, fill: sauceColor }}
          animate={{ r: sauceRadius, fill: sauceColor }}
          transition={SPRING}
        />
        {stepIndex >= 2 && (
          <motion.circle
            cx={100}
            cy={100}
            r={sauceRadius - 4}
            fill="#fbe9a8"
            initial={{ opacity: 0 }}
            animate={{ opacity: hasExtraCheese ? 0.55 : 0.32 }}
            transition={{ duration: 0.4 }}
          />
        )}
        <AnimatePresence>
          {iconToppings.map((topping) => {
            const { x, y } = slotPosition(topping, iconMaxRadius);
            if (topping === 'PEPPERONI') {
              return (
                <motion.circle
                  key={topping}
                  cx={x}
                  cy={y}
                  r={9}
                  fill="#7c2d12"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.85 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={SPRING}
                />
              );
            }
            if (topping === 'BUFFALO_MOZZARELLA') {
              return (
                <motion.circle
                  key={topping}
                  cx={x}
                  cy={y}
                  r={10}
                  fill="#fffaf0"
                  stroke="#e9dcc0"
                  strokeWidth={1}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.95 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={SPRING}
                />
              );
            }
            return (
              <motion.text
                key={topping}
                x={x}
                y={y}
                fontSize={20}
                textAnchor="middle"
                dominantBaseline="middle"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={SPRING}
              >
                {TOPPING_EMOJI[topping]}
              </motion.text>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
}
