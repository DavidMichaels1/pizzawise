import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { CRUST_OPTIONS, SAUCE_OPTIONS, SIZE_OPTIONS, TOPPING_OPTIONS } from '../api/catalog.ts';
import { cancelOrder, fetchOrder } from '../api/orders.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { formatDistance, formatEta, formatPrice } from '../lib/format.ts';

const labelFor = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value;

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
      <Link to="/orders" className="text-sm text-neutral-600 underline">
        ← Back to orders
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">{order.pizzeriaName}</h1>
            <p className="text-sm text-neutral-600">{new Date(order.placedAt).toLocaleString()}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

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
