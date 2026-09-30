import { motion } from 'framer-motion';
import type { OrderStatus } from '../api/orders.ts';

const STAGES: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export function DeliveryStepper({ status }: { status: OrderStatus }) {
  const activeIndex = STAGES.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start">
      {STAGES.map((stage, i) => {
        const reached = i <= activeIndex;
        const current = i === activeIndex;
        return (
          <div key={stage.key} className={`flex items-center ${i < STAGES.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{ scale: current ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                  reached ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-400'
                }`}
              >
                {current ? '🍕' : reached ? '✓' : ''}
              </motion.div>
              <span className={`text-center text-xs ${reached ? 'font-medium text-neutral-900' : 'text-neutral-400'}`}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="mx-1 mb-5 h-0.5 flex-1 bg-neutral-200">
                <motion.div
                  className="h-full bg-green-500"
                  initial={false}
                  animate={{ width: i < activeIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
