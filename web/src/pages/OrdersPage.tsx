import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listOrders } from '../api/orders.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { formatPrice } from '../lib/format.ts';

export function OrdersPage() {
  // Status is derived from elapsed time server-side, so a short poll is
  // enough to show it progressing without any push/websocket infrastructure.
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: listOrders, refetchInterval: 10_000 });

  if (isLoading) return <p className="text-neutral-600">Loading…</p>;

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <span aria-hidden>←</span> Back to home
      </Link>
      <h1 className="text-2xl font-semibold text-neutral-900">Your orders</h1>
      {orders?.length === 0 && <p className="text-neutral-600">No orders yet.</p>}
      {orders?.map((order) => (
        <Link
          key={order.id}
          to={`/orders/${order.id}`}
          className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300"
        >
          <div>
            <h2 className="font-medium text-neutral-900">{order.pizzeriaName}</h2>
            <p className="text-sm text-neutral-600">{new Date(order.placedAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-neutral-900">{formatPrice(order.priceAgorot)}</span>
            <StatusBadge status={order.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
