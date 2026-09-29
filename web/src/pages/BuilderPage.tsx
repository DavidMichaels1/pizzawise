import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PizzaConfig } from '../api/catalog.ts';
import { createFavorite, listFavorites } from '../api/favorites.ts';
import { placeOrder } from '../api/orders.ts';
import { comparePizzerias, type ComparisonResult, type Coordinates } from '../api/pizzerias.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import { LivePizzaPreview } from '../components/LivePizzaPreview.tsx';
import { PizzaProgress } from '../components/PizzaProgress.tsx';
import { PizzaWizard } from '../components/PizzaWizard.tsx';
import { ResultsCarousel } from '../components/ResultsCarousel.tsx';

const DEFAULT_CONFIG: PizzaConfig = { size: 'MEDIUM', crust: 'THIN', sauce: 'TOMATO', toppings: [] };

// Toppings are compared as a set — the order they were picked in shouldn't
// make an otherwise-identical pizza count as a different favorite.
function sameConfig(a: PizzaConfig, b: PizzaConfig): boolean {
  if (a.size !== b.size || a.crust !== b.crust || a.sauce !== b.sauce) return false;
  const [sortedA, sortedB] = [[...a.toppings].sort(), [...b.toppings].sort()];
  return sortedA.length === sortedB.length && sortedA.every((t, i) => t === sortedB[i]);
}

interface CompareVars {
  config: PizzaConfig;
  location: Coordinates;
}

export function BuilderPage() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const favoriteConfig = (routerLocation.state as { config?: PizzaConfig } | null)?.config;
  const [phase, setPhase] = useState<'building' | 'results'>('building');
  const [wizardKey, setWizardKey] = useState(0);
  // Kept separately from the mutation's variables so "Edit pizza" can resume
  // from the last completed config instead of resetting to plain defaults.
  const [config, setConfig] = useState<PizzaConfig>(favoriteConfig ?? DEFAULT_CONFIG);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [justSavedName, setJustSavedName] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const favoritesQuery = useQuery({ queryKey: ['favorites'], queryFn: listFavorites, enabled: Boolean(user) });
  const matchingFavorite = favoritesQuery.data?.find((f) => sameConfig(f, config));

  const compareMutation = useMutation({
    mutationFn: (vars: CompareVars) => comparePizzerias(vars.config, vars.location),
  });

  // Holds the results screen on the success animation for a beat before
  // revealing the list, instead of swapping straight from spinner to data.
  const [revealResults, setRevealResults] = useState(false);
  useEffect(() => {
    if (compareMutation.isPending) {
      setRevealResults(false);
      return;
    }
    if (compareMutation.isSuccess) {
      const timer = setTimeout(() => setRevealResults(true), 900);
      return () => clearTimeout(timer);
    }
  }, [compareMutation.isPending, compareMutation.isSuccess]);

  const favoriteMutation = useMutation({
    mutationFn: (vars: CompareVars) => createFavorite(favoriteName, vars.config),
    onSuccess: () => {
      setIsSavingFavorite(false);
      setJustSavedName(favoriteName);
      setFavoriteName('');
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const orderMutation = useMutation({
    mutationFn: ({ pizzeriaId, vars }: { pizzeriaId: string; vars: CompareVars }) =>
      placeOrder(pizzeriaId, vars.config, vars.location),
    onSuccess: (order) => navigate(`/orders/${order.id}`),
  });

  const handleWizardComplete = (finishedConfig: PizzaConfig, location: Coordinates) => {
    setConfig(finishedConfig);
    setPhase('results');
    setJustSavedName(null);
    setIsSavingFavorite(false);
    setFavoriteName('');
    compareMutation.mutate({ config: finishedConfig, location });
  };

  const editPizza = () => {
    compareMutation.reset();
    setWizardKey((k) => k + 1);
    setPhase('building');
  };

  const orderOrRedirect = (result: ComparisonResult) => {
    if (!compareMutation.variables) return;
    if (!user) {
      // Carries the in-progress build along so login/register can hand it back
      // via the same `config` state the favorites "Use this" flow already
      // reads — otherwise a logged-out order attempt would silently discard
      // everything the user just built.
      navigate('/login', { state: { from: routerLocation, config: compareMutation.variables.config } });
      return;
    }
    orderMutation.mutate({ pizzeriaId: result.pizzeriaId, vars: compareMutation.variables });
  };

  return (
    <div className="space-y-8">
      {phase === 'building' && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-neutral-900">Build your pizza</h1>
            <p className="mt-1 text-sm text-neutral-600">A few quick picks and we'll find the best deal nearby.</p>
          </div>
          <PizzaWizard
            key={wizardKey}
            initialConfig={config}
            skipToLocation={wizardKey === 0 && Boolean(favoriteConfig)}
            onComplete={handleWizardComplete}
          />
        </>
      )}

      {phase === 'results' && (
        <section className="space-y-4">
          {(compareMutation.isPending || (compareMutation.isSuccess && !revealResults)) && (
            <>
              <h1 className="text-center text-4xl font-semibold text-neutral-900">Cooking the Best Deals</h1>
              <PizzaProgress
                status={compareMutation.isSuccess ? 'success' : 'loading'}
                label="Comparing prices across nearby pizzerias…"
              />
            </>
          )}

          {compareMutation.isError && <p className="text-sm text-red-600">Couldn't fetch prices — try again.</p>}

          {compareMutation.data && revealResults && (
            <div className="space-y-4">
              <h1 className="text-center text-2xl font-bold uppercase tracking-wide text-neutral-900">
                {compareMutation.data.length} pizzas nearby
              </h1>

              <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
                <ResultsCarousel results={compareMutation.data} onOrder={orderOrRedirect} orderPending={orderMutation.isPending} />

                <aside>
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6">
                    <LivePizzaPreview config={config} stepIndex={4} />

                    <div className="mt-2 flex flex-col items-center gap-3">
                      {user &&
                        (justSavedName ? (
                          <p className="text-sm font-medium text-green-600">"{justSavedName}" saved to favorites</p>
                        ) : matchingFavorite ? (
                          <p className="text-sm text-neutral-500">Already in favorites</p>
                        ) : isSavingFavorite ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <form
                              className="flex items-center gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (compareMutation.variables) favoriteMutation.mutate(compareMutation.variables);
                              }}
                            >
                              <input
                                autoFocus
                                required
                                placeholder="Favorite name"
                                value={favoriteName}
                                onChange={(e) => setFavoriteName(e.target.value)}
                                className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm"
                              />
                              <button
                                type="submit"
                                disabled={favoriteMutation.isPending}
                                className="text-sm font-medium text-neutral-900 underline disabled:opacity-50"
                              >
                                {favoriteMutation.isPending ? 'Saving…' : 'Save'}
                              </button>
                            </form>
                            {favoriteMutation.isError && <p className="text-xs text-red-600">Couldn't save — try again.</p>}
                          </div>
                        ) : (
                          <button type="button" onClick={() => setIsSavingFavorite(true)} className="text-sm text-neutral-600 underline">
                            Save as favorite
                          </button>
                        ))}

                      <button type="button" onClick={editPizza} className="text-sm text-neutral-600 underline">
                        Edit pizza
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
