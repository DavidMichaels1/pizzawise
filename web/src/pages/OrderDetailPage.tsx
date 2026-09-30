import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { CRUST_OPTIONS, SAUCE_OPTIONS, SIZE_OPTIONS, TOPPING_OPTIONS } from '../api/catalog.ts';
import { cancelOrder, fetchOrder, type Order, type OrderStatus } from '../api/orders.ts';
import { DeliveryStepper } from '../components/DeliveryStepper.tsx';
import { OrderMap } from '../components/OrderMap.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { formatDistance, formatEta, formatPrice } from '../lib/format.ts';

const labelFor = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value;

// A continuous 0–1 fraction of how far along the (straight-line, unrouted)
// trip the order is — driven by elapsed time against the pizzeria's ETA, the
// same signal the backend's status derivation uses, just not bucketed into
// discrete stages. Used only to position the map's moving marker.
function deliveryProgress(order: Order): number {
  if (order.status === 'DELIVERED') return 1;
  if (order.status === 'CANCELLED') return 0;
  if (order.etaMinutes == null) {
    const fallback: Partial<Record<OrderStatus, number>> = { PLACED: 0, PREPARING: 0.3, OUT_FOR_DELIVERY: 0.7 };
    return fallback[order.status] ?? 0;
  }
  const elapsedMinutes = (Date.now() - new Date(order.placedAt).getTime()) / 60_000;
  return Math.min(Math.max(elapsedMinutes / order.etaMinutes, 0), 1);
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id!),
    refetchInterval: 10_000,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  if (isLoading) return <p className="text-neutral-600">Loading…</p>;
  if (!order) return <p className="text-neutral-600">Order not found.</p>;

  const isCancellable = order.status === 'PLACED' || order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY';

  return (
    <div className="space-y-6">
      <Link
        to="/orders"
        className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <span aria-hidden>←</span> Back to orders
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        {order.status === 'PLACED' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
            >
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Order placed!</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {order.pizzeriaName} · {new Date(order.placedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">{order.pizzeriaName}</h1>
              <p className="text-sm text-neutral-600">{new Date(order.placedAt).toLocaleString()}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        )}

        {order.status !== 'CANCELLED' && (
          <div className="mt-6 space-y-4">
            <DeliveryStepper status={order.status} />
            <OrderMap
              pizzeria={{ lat: order.pizzeriaLat, lng: order.pizzeriaLng }}
              delivery={{ lat: order.deliveryLat, lng: order.deliveryLng }}
              progress={deliveryProgress(order)}
            />
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-neutral-500">Pizza</dt>
            <dd className="text-neutral-900">
              {labelFor(SIZE_OPTIONS, order.size)}, {labelFor(CRUST_OPTIONS, order.crust)} crust,{' '}
              {labelFor(SAUCE_OPTIONS, order.sauce)} sauce
              {order.toppings.length > 0 && `, ${order.toppings.map((t) => labelFor(TOPPING_OPTIONS, t)).join(', ')}`}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Price</dt>
            <dd className="text-neutral-900">{formatPrice(order.priceAgorot)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Distance</dt>
            <dd className="text-neutral-900">{formatDistance(order.distanceKm)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">ETA</dt>
            <dd className="text-neutral-900">{formatEta(order.etaMinutes)}</dd>
          </div>
        </dl>

        {isCancellable && (
          <button
            type="button"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="mt-6 rounded-full border border-red-300 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
      </div>
    </div>
  );
}
