import type { CatalogFilters, CatalogResponse, MetaResponse, Vehicle } from "./types";

type StaticCatalog = {
  generatedAt: string;
  total: number;
  vehicles: Vehicle[];
  brands: string[];
  models: Array<{ brand: string; model: string }>;
  commercial: Record<string, number>;
};

let cache: StaticCatalog | null = null;
let loading: Promise<StaticCatalog> | null = null;

function dataUrl(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/([^:]\/)\/+/g, "$1");
}

export async function loadStaticCatalog(): Promise<StaticCatalog> {
  if (cache) return cache;
  if (!loading) {
    loading = fetch(dataUrl("data/catalog.json"))
      .then(async (res) => {
        if (!res.ok) throw new Error(`static catalog HTTP ${res.status}`);
        const json = (await res.json()) as StaticCatalog;
        cache = json;
        return json;
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

function applyFilters(rows: Vehicle[], filters: CatalogFilters = {}) {
  let out = rows;
  if (filters.country === "KR" || filters.country === "CN") {
    out = out.filter((v) => v.country === filters.country);
  }
  if (filters.brand) {
    const b = String(filters.brand).toLowerCase();
    out = out.filter((v) => v.brand.toLowerCase() === b);
  }
  if (filters.model) {
    const m = String(filters.model).toLowerCase();
    out = out.filter((v) => v.model.toLowerCase() === m);
  }
  if (filters.q) {
    const tokens = String(filters.q)
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    out = out.filter((v) => {
      const hay = `${v.brand} ${v.model} ${v.trim || ""}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }
  if (filters.fuel) out = out.filter((v) => v.fuel_type.includes(String(filters.fuel)));
  if (filters.transmission) {
    out = out.filter((v) => v.transmission.includes(String(filters.transmission)));
  }
  if (filters.drive) {
    const d = String(filters.drive).toLowerCase();
    out = out.filter((v) => {
      const cur = (v.drive || "").toLowerCase();
      if (d === "передний" || d === "fwd") return cur === "передний" || cur === "fwd";
      if (d === "задний" || d === "rwd") return cur === "задний" || cur === "rwd";
      if (d === "полный" || d === "awd" || d === "4wd") {
        return cur === "полный" || cur === "awd" || cur === "4wd";
      }
      return cur === d;
    });
  }
  if (filters.body) out = out.filter((v) => v.body_type.includes(String(filters.body)));
  if (filters.year_from) out = out.filter((v) => (v.year ?? 0) >= Number(filters.year_from));
  if (filters.year_to) out = out.filter((v) => (v.year ?? 9999) <= Number(filters.year_to));
  if (filters.mileage_to) {
    const max = Number(filters.mileage_to);
    const km = max < 1000 ? max * 1000 : max;
    out = out.filter((v) => (v.mileage_km ?? 0) <= km);
  }
  if (filters.price_from) {
    out = out.filter((v) => (v.estimated_total_rub ?? 0) >= Number(filters.price_from));
  }
  if (filters.price_to) {
    out = out.filter((v) => (v.estimated_total_rub ?? 0) <= Number(filters.price_to));
  }
  if (filters.power_from) out = out.filter((v) => (v.power_hp ?? 0) >= Number(filters.power_from));
  if (filters.power_to) out = out.filter((v) => (v.power_hp ?? 0) <= Number(filters.power_to));
  return out;
}

export async function staticCatalogQuery(filters: CatalogFilters = {}): Promise<CatalogResponse> {
  const data = await loadStaticCatalog();
  const rows = applyFilters(data.vehicles, filters);
  const limit = Math.min(Math.max(Number(filters.limit) || 24, 1), 60);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  return {
    items: rows.slice(offset, offset + limit),
    total: rows.length,
    limit,
    offset,
  };
}

export async function staticVehicleQuery(slug: string): Promise<Vehicle | null> {
  const data = await loadStaticCatalog();
  const key = decodeURIComponent(slug);
  return data.vehicles.find((v) => v.public_slug === key) || null;
}

export async function staticMetaQuery(country?: string): Promise<MetaResponse> {
  const data = await loadStaticCatalog();
  let rows = data.vehicles;
  if (country === "KR" || country === "CN") rows = rows.filter((v) => v.country === country);
  const brands = [...new Set(rows.map((v) => v.brand).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "en")
  );
  const models = rows
    .map((v) => ({ brand: v.brand, model: v.model }))
    .filter((m, i, arr) => arr.findIndex((x) => x.brand === m.brand && x.model === m.model) === i)
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
  return {
    brands,
    models,
    commercial: data.commercial || {},
  };
}
