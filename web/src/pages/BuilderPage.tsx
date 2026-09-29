import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PizzaConfig } from '../api/catalog.ts';
import { createFavorite } from '../api/favorites.ts';
import { placeOrder } from '../api/orders.ts';
import { comparePizzerias, type ComparisonResult, type Coordinates } from '../api/pizzerias.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import { PizzaProgress } from '../components/PizzaProgress.tsx';
import { PizzaWizard } from '../components/PizzaWizard.tsx';
import { formatDistance, formatEta, formatPrice } from '../lib/format.ts';

const DEFAULT_CONFIG: PizzaConfig = { size: 'MEDIUM', crust: 'THIN', sauce: 'TOMATO', toppings: [] };

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

  const compareMutation = useMutation({
    mutationFn: (vars: CompareVars) => comparePizzerias(vars.config, vars.location),
  });

  const favoriteMutation = useMutation({
    mutationFn: (vars: CompareVars) => createFavorite(favoriteName, vars.config),
    onSuccess: () => {
      setIsSavingFavorite(false);
      setFavoriteName('');
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
      navigate('/login', { state: { from: routerLocation } });
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
          <PizzaWizard key={wizardKey} initialConfig={config} onComplete={handleWizardComplete} />
        </>
      )}

      {phase === 'results' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-neutral-900">
              {compareMutation.data ? `${compareMutation.data.length} pizzerias nearby, ranked by value` : 'Finding the best deals…'}
            </h1>
            <button type="button" onClick={editPizza} className="text-sm text-neutral-600 underline">
              Edit pizza
            </button>
          </div>

          {compareMutation.isPending && (
            <PizzaProgress active={compareMutation.isPending} label="Comparing prices across nearby pizzerias…" />
          )}
          {compareMutation.isError && <p className="text-sm text-red-600">Couldn't fetch prices — try again.</p>}

          {compareMutation.data && (
            <>
              {user &&
                (isSavingFavorite ? (
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
                    <button type="submit" className="text-sm font-medium text-neutral-900 underline">
                      Save
                    </button>
                  </form>
                ) : (
                  <button type="button" onClick={() => setIsSavingFavorite(true)} className="text-sm text-neutral-600 underline">
                    Save as favorite
                  </button>
                ))}

              {compareMutation.data.map((result) => (
                <article key={result.pizzeriaId} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-neutral-900">{result.pizzeriaName}</h3>
                      <p className="text-sm text-neutral-600">
                        {formatDistance(result.distanceKm)} · {formatEta(result.etaMinutes)}
                      </p>
                      {result.matchQuality === 'approximate' && (
                        <p className="mt-1 text-xs text-amber-600">
                          Closest match{result.missingToppings.length > 0 && ` — missing: ${result.missingToppings.join(', ').toLowerCase()}`}
                          {!result.crustAvailable && ' — crust substituted'}
                          {!result.sauceAvailable && ' — sauce unavailable'}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-lg font-semibold text-neutral-900">{formatPrice(result.priceAgorot)}</span>
                      <button
                        type="button"
                        onClick={() => orderOrRedirect(result)}
                        disabled={orderMutation.isPending}
                        className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
                      >
                        Order
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}
