// Mirrors web/src/lib/format.ts so prices/distances/ETAs read identically
// whether you're looking at the web app or the CLI.
export const formatPrice = (agorot: number): string => `₪${(agorot / 100).toFixed(2)}`;

export const formatDistance = (km: number): string => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

export const formatEta = (minutes: number | null): string => (minutes === null ? 'unknown ETA' : `~${minutes} min`);
