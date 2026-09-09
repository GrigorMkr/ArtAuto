import { loadStore, saveStore, type Vehicle } from "../db.js";
import { createPricingContext, estimateVehicleTotal } from "../estimate.js";
import { estimatePowerHp, hpToKw, resolveEngineCc } from "./powerEstimate.js";
import { fetchEncarBatch, type NormalizedImport as EncarNorm } from "./sources/encarPublic.js";
import {
  fetchDongchediBatch,
  type NormalizedImport as DcdNorm,
} from "./sources/dongchediPublic.js";
import { fetchChe168Batch, type NormalizedImport as CheNorm } from "./sources/che168Public.js";

type NormalizedImport = EncarNorm | DcdNorm | CheNorm;

function slugify(_brand: string, _model: string, source: string, id: string) {
  return `${source}-${String(id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function upsertNormalized(
  store: ReturnType<typeof loadStore>,
  nv: NormalizedImport,
  pricingCtx: ReturnType<typeof createPricingContext>
) {
  const existing = store.vehicles.find(
    (v) => v.source === nv.source && v.source_listing_id === nv.source_listing_id
  );

  const year = nv.year || new Date().getFullYear() - 3;
  const yearMonth =
    ("year_month" in nv && nv.year_month) ||
    existing?.specifications?.year_month ||
    null;
  const power = estimatePowerHp({
    power_hp: nv.power_hp,
    engine_cc: nv.engine_cc,
    fuel_type: nv.fuel_type,
    trim: nv.trim,
    brand: nv.brand,
    model: nv.model,
  });
  const engineCc = resolveEngineCc({
    engine_cc: nv.engine_cc,
    trim: nv.trim,
    model: nv.model,
    brand: nv.brand,
  });
  const powerHp = nv.power_hp ?? power.hp;
  const priced =
    nv.foreign_price != null
      ? estimateVehicleTotal(
          {
            country: nv.country,
            year,
            year_month: yearMonth,
            engine_cc: engineCc,
            power_hp: powerHp,
            fuel_type: nv.fuel_type || "бензин",
            foreign_price: nv.foreign_price,
            foreign_currency: nv.foreign_currency,
            brand: nv.brand,
            model: nv.model,
            trim: nv.trim,
          },
          pricingCtx
        )
      : null;

  const payload: Vehicle = {
    id: existing?.id ?? store.seq.vehicle++,
    public_slug: slugify(nv.brand, nv.model, nv.source, nv.source_listing_id),
    country: nv.country,
    source: nv.source,
    source_listing_id: nv.source_listing_id,
    source_url: nv.source_url,
    status: "AVAILABLE",
    brand: nv.brand,
    model: nv.model,
    generation: "",
    trim: nv.trim,
    year: nv.year,
    mileage_km: nv.mileage_km,
    fuel_type: nv.fuel_type,
    transmission: nv.transmission,
    drive: nv.drive,
    body_type: nv.body_type,
    engine_cc: nv.engine_cc ?? engineCc,
    power_hp: powerHp,
    power_kw: hpToKw(powerHp),
    color: nv.color,
    foreign_price: nv.foreign_price,
    foreign_currency: nv.foreign_currency,
    estimated_total_rub: priced?.total_rub ?? existing?.estimated_total_rub ?? null,
    specifications: priced
      ? {
          ...priced.breakdown,
          customs_value_rub: priced.customs_value_rub,
          recycling_note: priced.recycling_note,
          age_band: priced.age_band,
          age_band_label: priced.age_band_label,
          age_years: priced.age_years,
          power_hp_used: priced.power_hp_used,
          power_source: power.source,
          power_estimated: power.estimated ? 1 : 0,
          ...(yearMonth ? { year_month: String(yearMonth) } : {}),
        }
      : existing?.specifications ?? {},
    images: nv.images.length ? nv.images : existing?.images || [],
  };

  if (existing) Object.assign(existing, payload, { id: existing.id });
  else store.vehicles.push(payload);

  return { created: !existing, slug: payload.public_slug };
}

function stats(store: ReturnType<typeof loadStore>) {
  return {
    total: store.vehicles.length,
    korea: store.vehicles.filter((v) => v.country === "KR").length,
    china: store.vehicles.filter((v) => v.country === "CN").length,
    bySource: store.vehicles.reduce<Record<string, number>>((acc, v) => {
      acc[v.source] = (acc[v.source] || 0) + 1;
      return acc;
    }, {}),
  };
}

function purgeDemos(store: ReturnType<typeof loadStore>) {
  store.vehicles = store.vehicles.filter((v) => v.source !== "demo");
}

function applyBatch(source: string, offers: NormalizedImport[]) {
  const store = loadStore();
  purgeDemos(store);
  const pricingCtx = createPricingContext();
  let created = 0;
  let updated = 0;
  const keepIds = new Set(offers.map((o) => o.source_listing_id));

  for (const offer of offers) {
    const r = upsertNormalized(store, offer, pricingCtx);
    if (r.created) created += 1;
    else updated += 1;
  }

  // drop stale listings from this source that disappeared upstream
  store.vehicles = store.vehicles.filter(
    (v) => v.source !== source || keepIds.has(v.source_listing_id)
  );

  saveStore(store);
  return { created, updated, ...stats(store) };
}

export async function importFromEncar(limit = 1200) {
  const { seed } = await import("../seed.js");
  seed();
  console.log(`[import] Encar fetch up to ${limit}…`);
  const offers = await fetchEncarBatch(limit);
  console.log(`[import] Encar fetched ${offers.length}, pricing…`);
  const result = { source: "encar", fetched: offers.length, ...applyBatch("encar", offers) };
  console.log(`[import] Encar done`, result.total, result.bySource);
  return result;
}

export async function importFromDongchedi(limit = 500) {
  const { seed } = await import("../seed.js");
  seed();
  console.log(`[import] Dongchedi fetch up to ${limit}…`);
  const offers = await fetchDongchediBatch(limit);
  console.log(`[import] Dongchedi fetched ${offers.length}, pricing…`);
  const result = { source: "dongchedi", fetched: offers.length, ...applyBatch("dongchedi", offers) };
  console.log(`[import] Dongchedi done`, result.total, result.bySource);
  try {
    const { warmImageUrls } = await import("./imageProxy.js");
    const urls = offers.flatMap((o) => o.images.slice(0, 1)).slice(0, 80);
    if (urls.length) {
      console.log(`[import] warming ${urls.length} China photos…`);
      const warm = await warmImageUrls(urls, 4);
      console.log(`[import] photo warm`, warm);
      Object.assign(result, { photos: warm });
    }
  } catch (e) {
    console.warn(`[import] photo warm failed`, e);
  }
  return result;
}

export async function importFromChe168(limit = 60) {
  const { seed } = await import("../seed.js");
  seed();
  console.log(`[import] Che168 fetch up to ${limit}…`);
  const offers = await fetchChe168Batch(limit);
  console.log(`[import] Che168 fetched ${offers.length}`);
  if (!offers.length) {
    return {
      source: "che168",
      fetched: 0,
      created: 0,
      updated: 0,
      reachable: false,
      ...stats(loadStore()),
    };
  }
  const result = {
    source: "che168",
    fetched: offers.length,
    reachable: true,
    ...applyBatch("che168", offers),
  };
  return result;
}

export async function importChina(limit = 500) {
  const dcd = await importFromDongchedi(limit);
  const che = await importFromChe168(Math.min(limit, 60));
  return { dongchedi: dcd, che168: che };
}
