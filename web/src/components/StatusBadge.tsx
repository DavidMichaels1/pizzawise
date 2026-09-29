import type { OrderStatus } from '../api/orders.ts';

const STYLES: Record<OrderStatus, string> = {
  PLACED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-amber-100 text-amber-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
};

const LABELS: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>;
}
