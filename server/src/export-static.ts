/**
 * Export slim catalog JSON for GitHub Pages / offline frontend.
 * Usage: npx tsx src/export-static.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadStore, type Vehicle } from "./db.js";
import { latinizeVehicle, stripCjk } from "./services/latinNames.js";
import { proxiedImages } from "./services/imageProxy.js";
import { dedupeVisualVehicles } from "./services/dedupeVehicles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "..", "web", "public", "data", "catalog.json");

function isOkBrand(v: Vehicle) {
  if (v.country !== "CN" && v.country !== "KR") return false;
  if (v.status !== "AVAILABLE") return false;
  const b = v.brand
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9а-яёㄱ-ㅎㅏ-ㅣ가-힣]+/gi, "");
  return !!b && b !== "unknown" && b.length >= 2;
}

function slim(v: Vehicle) {
  const names = latinizeVehicle(v.brand, v.model, v.trim || v.generation);
  const imgs = (v.images || []).slice(0, 8);
  return {
    public_slug: `${v.source}-${v.source_listing_id}`,
    country: v.country,
    source: v.source,
    source_listing_id: v.source_listing_id,
    source_url: v.source_url,
    status: v.status,
    brand: names.brand,
    model: names.model || stripCjk(v.model) || "Model",
    generation: stripCjk(v.generation),
    trim: stripCjk(v.trim),
    year: v.year,
    mileage_km: v.mileage_km,
    fuel_type: stripCjk(v.fuel_type),
    transmission: v.transmission,
    drive: v.drive,
    body_type: v.body_type,
    engine_cc: v.engine_cc,
    power_hp: v.power_hp,
    power_kw: v.power_kw,
    color: v.color,
    foreign_price: v.foreign_price,
    foreign_currency: v.foreign_currency,
    estimated_total_rub: v.estimated_total_rub,
    specifications: v.specifications || {},
    images: proxiedImages(imgs),
  };
}

const store = loadStore();
const vehicles = dedupeVisualVehicles(
  store.vehicles
    .filter(isOkBrand)
    .sort((a, b) => {
      const score = (v: Vehicle) =>
        (v.source === "encar" ? 4 : 0) + (v.images?.length ? 2 : 0);
      return score(b) - score(a) || b.id - a.id;
    })
).map(slim);

const brands = [...new Set(vehicles.map((v) => v.brand).filter(Boolean))].sort((a, b) =>
  a.localeCompare(b, "en")
);
const models = vehicles
  .map((v) => ({ brand: v.brand, model: v.model }))
  .filter((m, i, arr) => arr.findIndex((x) => x.brand === m.brand && x.model === m.model) === i)
  .sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

const commercial = {
  CNY: 12.2,
  KRW: 0.065,
  EUR: 100,
  USD: 100,
};
for (const row of store.fx_rates || []) {
  const rate = row.manual_commercial_rate_rub
    ? row.manual_commercial_rate_rub
    : row.official_rate_rub * (1 + (row.commercial_markup_pct || 0) / 100);
  if (row.code in commercial) (commercial as Record<string, number>)[row.code] = rate;
}

const payload = {
  generatedAt: new Date().toISOString(),
  total: vehicles.length,
  vehicles,
  brands,
  models,
  commercial,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload));
console.log(`Wrote ${vehicles.length} vehicles → ${outPath} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);
