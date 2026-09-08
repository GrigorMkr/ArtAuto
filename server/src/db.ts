import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "store.json");

export type Vehicle = {
  id: number;
  public_slug: string;
  country: "KR" | "CN";
  source: string;
  source_listing_id: string;
  source_url: string;
  status: string;
  brand: string;
  model: string;
  generation: string;
  trim: string;
  year: number | null;
  mileage_km: number | null;
  fuel_type: string;
  transmission: string;
  drive: string;
  body_type: string;
  engine_cc: number | null;
  power_hp: number | null;
  power_kw: number | null;
  color: string;
  foreign_price: number | null;
  foreign_currency: string;
  estimated_total_rub: number | null;
  specifications: Record<string, number>;
  images: string[];
};

export type Store = {
  vehicles: Vehicle[];
  price_settings: Array<{ key: string; value: number; currency: string; description: string }>;
  fx_rates: Array<{
    code: string;
    official_rate_rub: number;
    commercial_markup_pct: number;
    manual_commercial_rate_rub: number | null;
  }>;
  recycling_rules: Array<{
    id: number;
    age_group: string;
    fuel_type: string;
    engine_cc_from: number;
    engine_cc_to: number | null;
    power_kw_from: number;
    power_kw_to: number | null;
    base_rate_rub: number;
    coefficient: number;
    personal_use: number;
  }>;
  leads: Array<{
    id: number;
    created_at: string;
    name: string;
    phone: string;
    city: string;
    email: string;
    message: string;
    vehicle_slug: string;
    vehicle_snapshot: string;
    calculation_snapshot: string;
    page_url: string;
    status: string;
    telegram_sent_at: string | null;
    user_id?: number | null;
  }>;
  users: Array<{
    id: number;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    password_hash: string;
    token: string;
    token_expires: string;
    role: "user" | "admin";
  }>;
  deals: Array<{
    id: number;
    user_id: number;
    created_at: string;
    vehicle_slug: string;
    brand: string;
    model: string;
    year: number | null;
    country: string;
    image: string;
    estimated_total_rub: number | null;
    comment: string;
    status: string;
    events: Array<{ at: string; status: string; title: string; text: string }>;
  }>;
  seq: { vehicle: number; lead: number; rule: number; user: number; deal: number };
};

const emptyStore = (): Store => ({
  vehicles: [],
  price_settings: [],
  fx_rates: [],
  recycling_rules: [],
  leads: [],
  users: [],
  deals: [],
  seq: { vehicle: 1, lead: 1, rule: 1, user: 1, deal: 1 },
});

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(emptyStore(), null, 2), "utf8");
}

let cache: { mtimeMs: number; store: Store } | null = null;

export function loadStore(): Store {
  ensure();
  const stat = fs.statSync(dbPath);
  if (cache && cache.mtimeMs === stat.mtimeMs) return cache.store;
  const store = JSON.parse(fs.readFileSync(dbPath, "utf8")) as Store;
  cache = { mtimeMs: stat.mtimeMs, store };
  return store;
}

export function saveStore(store: Store) {
  ensure();
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2), "utf8");
  try {
    const stat = fs.statSync(dbPath);
    cache = { mtimeMs: stat.mtimeMs, store };
  } catch {
    cache = null;
  }
}

export function withStore<T>(fn: (store: Store) => T): T {
  const store = loadStore();
  const result = fn(store);
  saveStore(store);
  return result;
}

export function migrate() {
  ensure();
  const store = loadStore();
  let dirty = false;
  if (!Array.isArray(store.users)) {
    store.users = [];
    dirty = true;
  }
  if (!Array.isArray(store.deals)) {
    store.deals = [];
    dirty = true;
  }
  if (!store.seq.user) {
    store.seq.user = 1;
    dirty = true;
  }
  if (!store.seq.deal) {
    store.seq.deal = 1;
    dirty = true;
  }
  for (const u of store.users) {
    if (!u.role) {
      u.role = "user";
      dirty = true;
    }
  }
  // no-op for images here — Dongchedi URLs must keep signatures; refresh via import
  if (dirty) saveStore(store);
}
