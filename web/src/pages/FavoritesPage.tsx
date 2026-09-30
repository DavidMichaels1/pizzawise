import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CRUST_OPTIONS, SAUCE_OPTIONS, SIZE_OPTIONS, TOPPING_OPTIONS } from '../api/catalog.ts';
import { deleteFavorite, listFavorites, type Favorite } from '../api/favorites.ts';

const labelFor = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value;

export function FavoritesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: favorites, isLoading } = useQuery({ queryKey: ['favorites'], queryFn: listFavorites });

  const deleteMutation = useMutation({
    mutationFn: deleteFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (isLoading) return <p className="text-neutral-600">Loading…</p>;

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <span aria-hidden>←</span> Back to home
      </Link>
      <h1 className="text-2xl font-semibold text-neutral-900">Your favorites</h1>
      {favorites?.length === 0 && <p className="text-neutral-600">No favorites saved yet — build a pizza and save it.</p>}
      {favorites?.map((favorite: Favorite) => (
        <article key={favorite.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
          <div>
            <h2 className="font-medium text-neutral-900">{favorite.name}</h2>
            <p className="text-sm text-neutral-600">
              {labelFor(SIZE_OPTIONS, favorite.size)} · {labelFor(CRUST_OPTIONS, favorite.crust)} crust ·{' '}
              {labelFor(SAUCE_OPTIONS, favorite.sauce)} sauce
              {favorite.toppings.length > 0 &&
                ` · ${favorite.toppings.map((t) => labelFor(TOPPING_OPTIONS, t)).join(', ')}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => navigate('/', { state: { config: favorite } })}
              className="text-sm font-medium text-neutral-900 underline"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(favorite.id)}
              className="text-sm text-red-600 underline"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
