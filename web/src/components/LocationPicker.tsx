import { useState } from 'react';
import type { Coordinates } from '../api/pizzerias.ts';

// There's no geocoding API in this project, so "manual" location entry is a
// curated list of real Tel Aviv areas rather than free-text address lookup.
const PRESET_LOCATIONS: { label: string; lat: number; lng: number }[] = [
  { label: 'Dizengoff Center', lat: 32.0748, lng: 34.7746 },
  { label: 'Rothschild Blvd', lat: 32.0644, lng: 34.7748 },
  { label: 'Florentin', lat: 32.0567, lng: 34.7679 },
  { label: 'Neve Tzedek', lat: 32.0616, lng: 34.7651 },
  { label: 'Ramat Aviv', lat: 32.1133, lng: 34.8044 },
  { label: 'Jaffa Port', lat: 32.0523, lng: 34.7519 },
];

interface Props {
  value: Coordinates | null;
  onChange: (location: Coordinates) => void;
}

export function LocationPicker({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => onChange({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setError('Could not get your location — pick an area instead.'),
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">Delivery location</label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Use my location
        </button>
        <select
          className="min-w-[180px] rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
          value=""
          onChange={(e) => {
            const preset = PRESET_LOCATIONS.find((p) => p.label === e.target.value);
            if (preset) onChange({ lat: preset.lat, lng: preset.lng });
          }}
        >
          <option value="" disabled>
            Or pick an area
          </option>
          {PRESET_LOCATIONS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {value && (
        <p className="text-xs text-neutral-500">
          Delivering to {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
