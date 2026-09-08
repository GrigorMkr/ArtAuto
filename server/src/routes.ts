import { Router } from "express";
import { z } from "zod";
import { loadStore, saveStore, type Vehicle } from "./db.js";
import { calculateTotal, DEFAULT_SETTINGS } from "./services/pricing.js";
import { formatLead, sendTelegram } from "./services/telegram.js";
import { latinizeVehicle, stripCjk } from "./services/latinNames.js";
import { estimateVehicleTotal } from "./estimate.js";
import { imageProxy, proxiedImages } from "./services/imageProxy.js";
import { login, logout, me, register, requireAuth, requireAdmin } from "./services/auth.js";
import { createDeal, listDeals } from "./services/deals.js";
import {
  adminDeleteVehicle,
  adminListDeals,
  adminListLeads,
  adminListVehicles,
  adminPatchDeal,
  adminPatchVehicle,
  adminStats,
  adminWarmImages,
} from "./services/admin.js";

export const api = Router();

function serialize(v: Vehicle, opts?: { allImages?: boolean; light?: boolean }) {
  const names = latinizeVehicle(v.brand, v.model, v.trim || v.generation);
  const imgs = v.images || [];
  return {
    public_slug: `${v.source}-${v.source_listing_id}`,
    country: v.country,
    source: v.source,
    source_listing_id: v.source_listing_id,
    source_url: v.source_url,
    status: v.status,
    brand: names.brand,
    model: names.model || stripCjk(v.model) || "Model",
    generation: opts?.light ? "" : stripCjk(v.generation),
    trim: opts?.light ? "" : stripCjk(v.trim),
    year: v.year,
    mileage_km: v.mileage_km,
    fuel_type: stripCjk(v.fuel_type),
    transmission: v.transmission,
    drive: v.drive,
    body_type: opts?.light ? "" : v.body_type,
    engine_cc: opts?.light ? null : v.engine_cc,
    power_hp: opts?.light ? null : v.power_hp,
    power_kw: opts?.light ? null : v.power_kw,
    color: opts?.light ? "" : v.color,
    foreign_price: v.foreign_price,
    foreign_currency: v.foreign_currency,
    estimated_total_rub: v.estimated_total_rub,
    specifications: opts?.light ? {} : v.specifications || {},
    // Catalog cards: few photos for hover scrub; detail: full gallery.
    images: proxiedImages(opts?.allImages ? imgs : imgs.slice(0, 5)),
  };
}

let rankedCache: { key: number; rows: Vehicle[] } | null = null;

/** Korea: local marques only. China: all CN-market lots (Dongchedi), drop junk brands. */
function isKoreaChinaBrand(v: Vehicle) {
  if (v.country !== "CN" && v.country !== "KR") return false;
  const b = v.brand
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9а-яёㄱ-ㅎㅏ-ㅣ가-힣]+/gi, "");
  if (!b || b === "unknown") return false;

  // Chinese market listings — keep volume; filter only empty/garbage names
  if (v.country === "CN") {
    if (b.length < 2) return false;
    return true;
  }

  const korea = [
    "hyundai",
    "kia",
    "genesis",
    "ssangyong",
    "kgmobility",
    "renaultkorea",
    "renaultsamsung",
    "samsung",
    "daewoo",
    "기아",
    "현대",
    "제네시스",
    "쌍용",
  ];

  return korea.some((k) => {
    const key = k.toLowerCase().replace(/[^a-z0-9а-яёㄱ-ㅎㅏ-ㅣ가-힣]+/gi, "");
    return key.length > 1 && b.includes(key);
  });
}

function rankedVehicles() {
  const store = loadStore();
  const key = store.vehicles.length + store.seq.vehicle;
  if (rankedCache && rankedCache.key === key) return rankedCache.rows;
  const rows = store.vehicles
    .filter((v) => v.status === "AVAILABLE" && isKoreaChinaBrand(v))
    .sort((a, b) => {
      const score = (v: Vehicle) =>
        (v.source === "encar" ? 4 : 0) +
        (v.images?.length ? 2 : 0) +
        (String(v.images?.[0] || "").includes("encar.com") ? 2 : 0);
      return score(b) - score(a) || b.id - a.id;
    });
  rankedCache = { key, rows };
  return rows;
}

function commercialRate(code: string) {
  const row = loadStore().fx_rates.find((r) => r.code === code);
  if (!row) return code === "CNY" ? 12.2 : code === "KRW" ? 0.065 : 100;
  if (row.manual_commercial_rate_rub) return row.manual_commercial_rate_rub;
  return row.official_rate_rub * (1 + row.commercial_markup_pct / 100);
}

function setting(key: string) {
  return loadStore().price_settings.find((s) => s.key === key)?.value ?? DEFAULT_SETTINGS[key]?.value ?? 0;
}

api.get("/catalog", (req, res) => {
  const q = req.query;
  let rows = rankedVehicles();

  if (q.country === "KR" || q.country === "CN") rows = rows.filter((v) => v.country === q.country);
  if (q.brand) rows = rows.filter((v) => v.brand.toLowerCase() === String(q.brand).toLowerCase());
  if (q.model) rows = rows.filter((v) => v.model.toLowerCase().includes(String(q.model).toLowerCase()));
  if (q.q) {
    const s = String(q.q).toLowerCase();
    rows = rows.filter((v) => v.brand.toLowerCase().includes(s) || v.model.toLowerCase().includes(s));
  }
  if (q.fuel) rows = rows.filter((v) => v.fuel_type.includes(String(q.fuel)));
  if (q.transmission) rows = rows.filter((v) => v.transmission.includes(String(q.transmission)));
  if (q.drive) rows = rows.filter((v) => v.drive === String(q.drive));
  if (q.body) rows = rows.filter((v) => v.body_type.includes(String(q.body)));
  if (q.year_from) rows = rows.filter((v) => (v.year ?? 0) >= Number(q.year_from));
  if (q.year_to) rows = rows.filter((v) => (v.year ?? 9999) <= Number(q.year_to));
  if (q.mileage_to) {
    const max = Number(q.mileage_to);
    const km = max < 1000 ? max * 1000 : max;
    rows = rows.filter((v) => (v.mileage_km ?? 0) <= km);
  }
  if (q.price_from) rows = rows.filter((v) => (v.estimated_total_rub ?? 0) >= Number(q.price_from));
  if (q.price_to) rows = rows.filter((v) => (v.estimated_total_rub ?? 0) <= Number(q.price_to));
  if (q.power_from) rows = rows.filter((v) => (v.power_hp ?? 0) >= Number(q.power_from));
  if (q.power_to) rows = rows.filter((v) => (v.power_hp ?? 0) <= Number(q.power_to));
  if (q.engine_from) rows = rows.filter((v) => (v.engine_cc ?? 0) >= Number(q.engine_from));
  if (q.engine_to) rows = rows.filter((v) => (v.engine_cc ?? 0) <= Number(q.engine_to));

  const total = rows.length;
  const limit = Math.min(Math.max(Number(q.limit) || 24, 1), 60);
  const offset = Math.max(Number(q.offset) || 0, 0);
  const page = rows.slice(offset, offset + limit);

  res.json({
    items: page.map((v) => serialize(v, { light: true })),
    total,
    limit,
    offset,
  });
});

function findVehicle(slugOrId: string) {
  const store = loadStore();
  const decoded = decodeURIComponent(slugOrId);
  return (
    store.vehicles.find((v) => v.public_slug === decoded) ||
    store.vehicles.find((v) => `${v.source}-${v.source_listing_id}` === decoded) ||
    store.vehicles.find((v) => v.source_listing_id === decoded)
  );
}

api.get("/vehicles/:slug", (req, res) => {
  const row = findVehicle(req.params.slug);
  if (!row || row.status !== "AVAILABLE" || !isKoreaChinaBrand(row)) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json(serialize(row, { allImages: true }));
});

api.get("/meta", (_req, res) => {
  const rows = rankedVehicles();
  const brands = [...new Set(rows.map((v) => v.brand).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "en")
  );
  const models = rows
    .map((v) => ({ brand: v.brand, model: v.model }))
    .filter((m, i, arr) => arr.findIndex((x) => x.brand === m.brand && x.model === m.model) === i)
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

  res.json({
    brands,
    models,
    rates: loadStore().fx_rates,
    settings: loadStore().price_settings,
    commercial: {
      CNY: commercialRate("CNY"),
      KRW: commercialRate("KRW"),
      EUR: commercialRate("EUR"),
      USD: commercialRate("USD"),
    },
  });
});

const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  city: z.string().optional().default(""),
  email: z.string().optional().default(""),
  message: z.string().optional().default(""),
  vehicle_slug: z.string().optional().default(""),
  page_url: z.string().optional().default(""),
  calculation_snapshot: z.record(z.any()).optional().default({}),
});

api.post("/leads", async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;
  const store = loadStore();

  let snapshot: Record<string, unknown> = {};
  if (data.vehicle_slug) {
    const v = store.vehicles.find((x) => x.public_slug === data.vehicle_slug);
    if (v) {
      snapshot = {
        brand: v.brand,
        model: v.model,
        year: v.year,
        source: v.source,
        source_listing_id: v.source_listing_id,
        estimated_total_rub: String(v.estimated_total_rub ?? ""),
      };
    }
  }

  const leadId = store.seq.lead++;
  store.leads.push({
    id: leadId,
    created_at: new Date().toISOString(),
    name: data.name.trim(),
    phone: data.phone.trim(),
    city: data.city.trim(),
    email: data.email.trim(),
    message: data.message.trim(),
    vehicle_slug: data.vehicle_slug,
    vehicle_snapshot: JSON.stringify(snapshot),
    calculation_snapshot: JSON.stringify(data.calculation_snapshot),
    page_url: data.page_url,
    status: "NEW",
    telegram_sent_at: null,
  });
  saveStore(store);

  let telegram: unknown = { skipped: true };
  try {
    const chat = process.env.TELEGRAM_LEADS_CHAT_ID || "";
    telegram = await sendTelegram(
      chat,
      formatLead({
        id: leadId,
        name: data.name,
        phone: data.phone,
        city: data.city,
        message: data.message,
        vehicle_slug: data.vehicle_slug,
        vehicle_snapshot: JSON.stringify(snapshot),
      })
    );
    if (!(telegram as { skipped?: boolean }).skipped) {
      const s2 = loadStore();
      const lead = s2.leads.find((l) => l.id === leadId);
      if (lead) lead.telegram_sent_at = new Date().toISOString();
      saveStore(s2);
    }
  } catch (e) {
    telegram = { error: String(e) };
  }

  res.status(201).json({ id: leadId, status: "ok", telegram });
});

const calcSchema = z.object({
  country: z.enum(["KR", "CN"]),
  foreign_price: z.number().positive(),
  foreign_currency: z.enum(["KRW", "CNY"]).optional(),
  year: z.number().int().min(1990).max(2100),
  engine_cc: z.number().int().min(0).max(8000),
  power_hp: z.number().positive().optional().default(150),
  fuel_type: z.string().optional().default("бензин"),
  delivery_city_rub: z.number().optional(),
});

api.post("/calculator", (req, res) => {
  const parsed = calcSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const currency = d.foreign_currency ?? (d.country === "CN" ? "CNY" : "KRW");
  const result = estimateVehicleTotal({
    country: d.country,
    year: d.year,
    engine_cc: d.engine_cc || 1500,
    power_hp: d.power_hp,
    fuel_type: d.fuel_type,
    foreign_price: d.foreign_price,
    foreign_currency: currency,
  });

  if (d.delivery_city_rub != null) {
    const adjusted = calculateTotal({
      vehicle_rub: result.breakdown.vehicle_rub,
      foreign_expenses_rub: result.breakdown.foreign_expenses_rub,
      broker_rub: result.breakdown.broker_rub,
      transport_to_vladivostok_rub: result.breakdown.transport_to_vladivostok_rub,
      company_fee_rub: result.breakdown.company_fee_rub,
      delivery_russia_rub: d.delivery_city_rub,
      customs_total_rub: result.breakdown.customs_total_rub,
      recycling_fee_rub: result.breakdown.recycling_fee_rub,
      laboratory_rub: result.breakdown.laboratory_rub,
      extra_rub: result.breakdown.extra_rub,
    });
    return res.json({
      ...adjusted,
      rates: { CNY: commercialRate("CNY"), KRW: commercialRate("KRW"), EUR: commercialRate("EUR") },
      settings: {
        broker: setting(d.country === "CN" ? "CN_BROKER_RUB" : "KR_BROKER_RUB"),
        company_fee: setting(d.country === "CN" ? "CN_COMPANY_FEE_RUB" : "KR_COMPANY_FEE_RUB"),
      },
    });
  }

  res.json({
    ...result,
    rates: { CNY: commercialRate("CNY"), KRW: commercialRate("KRW"), EUR: commercialRate("EUR") },
  });
});

api.get("/health", (_req, res) => res.json({ ok: true, service: "artauto-api" }));

api.get("/img", imageProxy);
api.get("/img/:b64", imageProxy);

api.post("/auth/register", register);
api.post("/auth/login", login);
api.get("/auth/me", me);
api.post("/auth/logout", logout);
api.get("/cabinet/deals", requireAuth, listDeals);
api.post("/cabinet/deals", requireAuth, createDeal);

api.get("/admin/stats", requireAdmin, adminStats);
api.get("/admin/vehicles", requireAdmin, adminListVehicles);
api.patch("/admin/vehicles/:slug", requireAdmin, adminPatchVehicle);
api.delete("/admin/vehicles/:slug", requireAdmin, adminDeleteVehicle);
api.post("/admin/images/warm", requireAdmin, adminWarmImages);
api.get("/admin/leads", requireAdmin, adminListLeads);
api.get("/admin/deals", requireAdmin, adminListDeals);
api.patch("/admin/deals/:id", requireAdmin, adminPatchDeal);

api.post("/import/encar", requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.body?.limit || req.query.limit || 700);
    const { importFromEncar } = await import("./services/importer.js");
    const result = await importFromEncar(Math.min(Math.max(limit, 20), 1000));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post("/import/china", requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.body?.limit || req.query.limit || 500);
    const { importChina } = await import("./services/importer.js");
    const result = await importChina(Math.min(Math.max(limit, 20), 800));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post("/import/dongchedi", requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.body?.limit || req.query.limit || 500);
    const { importFromDongchedi } = await import("./services/importer.js");
    const result = await importFromDongchedi(Math.min(Math.max(limit, 20), 800));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post("/import/sync", requireAdmin, async (req, res) => {
  try {
    const { syncAllCatalog } = await import("./services/sync.js");
    const encar = Number(req.body?.encar || 700);
    const dongchedi = Number(req.body?.dongchedi || 500);
    const result = await syncAllCatalog({ encar, dongchedi });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.get("/import/status", requireAdmin, (_req, res) => {
  const store = loadStore();
  const bySource = store.vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.source] = (acc[v.source] || 0) + 1;
    return acc;
  }, {});
  res.json({
    total: store.vehicles.length,
    bySource,
    korea: store.vehicles.filter((v) => v.country === "KR").length,
    china: store.vehicles.filter((v) => v.country === "CN").length,
  });
});
