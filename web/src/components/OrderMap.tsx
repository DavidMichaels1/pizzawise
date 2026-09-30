import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';

interface Point {
  lat: number;
  lng: number;
}

interface Props {
  pizzeria: Point;
  delivery: Point;
  /** 0 = still at the pizzeria, 1 = arrived — there's no routing API in scope, so this interpolates a straight line rather than faking a real route. */
  progress: number;
}

// Leaflet's default marker images don't resolve through Vite's bundler without
// extra config — a plain colored div sidesteps that entirely.
function pin(emoji: string, background: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${background};font-size:16px;box-shadow:0 1px 4px rgba(0,0,0,0.35)">${emoji}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const pizzeriaIcon = pin('🍕', '#fff7ed');
const homeIcon = pin('🏠', '#eff6ff');
const scooterIcon = pin('🛵', '#ffffff');

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Fits the map to both markers once, rather than requiring a hardcoded zoom that may not suit every pair of coordinates. */
function FitBounds({ pizzeria, delivery }: { pizzeria: Point; delivery: Point }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [pizzeria.lat, pizzeria.lng],
        [delivery.lat, delivery.lng],
      ],
      { padding: [32, 32] },
    );
  }, [map, pizzeria.lat, pizzeria.lng, delivery.lat, delivery.lng]);
  return null;
}

export function OrderMap({ pizzeria, delivery, progress }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const scooterPosition: [number, number] = [lerp(pizzeria.lat, delivery.lat, clamped), lerp(pizzeria.lng, delivery.lng, clamped)];

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-neutral-200">
      <MapContainer
        center={[pizzeria.lat, pizzeria.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pizzeria={pizzeria} delivery={delivery} />
        <Polyline
          positions={[
            [pizzeria.lat, pizzeria.lng],
            [delivery.lat, delivery.lng],
          ]}
          pathOptions={{ color: '#a3a3a3', weight: 2, dashArray: '6 6' }}
        />
        <Marker position={[pizzeria.lat, pizzeria.lng]} icon={pizzeriaIcon} />
        <Marker position={[delivery.lat, delivery.lng]} icon={homeIcon} />
        {clamped < 1 && <Marker position={scooterPosition} icon={scooterIcon} />}
      </MapContainer>
    </div>
  );
}
