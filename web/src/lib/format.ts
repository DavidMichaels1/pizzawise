export const formatPrice = (agorot: number): string => `₪${(agorot / 100).toFixed(2)}`;

export const formatDistance = (km: number): string => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

export const formatEta = (minutes: number | null): string => (minutes === null ? 'Unknown ETA' : `~${minutes} min`);
