import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.pizzawise');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export interface PizzaRequest {
  size: string;
  crust: string;
  sauce: string;
  toppings: string[];
}

export interface ComparisonResult {
  pizzeriaId: string;
  pizzeriaName: string;
  priceAgorot: number;
  distanceKm: number;
  etaMinutes: number | null;
  matchQuality: 'exact' | 'approximate';
  missingToppings: string[];
  crustAvailable: boolean;
  sauceAvailable: boolean;
}

// The API re-quotes an order from scratch rather than trusting a
// client-submitted price, so it needs the full pizza request and delivery
// location again at order time — this is what `compare` leaves behind for
// `order` to read, so the user doesn't have to retype everything.
export interface LastCompare {
  request: PizzaRequest;
  location: { lat: number; lng: number };
  results: ComparisonResult[];
}

interface Config {
  token?: string;
  lastCompare?: LastCompare;
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return {};
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

export function saveConfig(patch: Partial<Config>): void {
  const current = loadConfig();
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...current, ...patch }, null, 2));
}

export function requireToken(): string {
  const { token } = loadConfig();
  if (!token) {
    console.error('Not logged in. Run `pizzawise login` first.');
    process.exit(1);
  }
  return token;
}
