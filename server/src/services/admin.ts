import type { Request, Response } from "express";
import { z } from "zod";
import { loadStore, saveStore } from "../db.js";
import { isImageCached, normalizeChinaImageUrl, warmImageUrls } from "./imageProxy.js";
import { DEAL_STEPS } from "./deals.js";

export function adminStats(_req: Request, res: Response) {
  const store = loadStore();
  const bySource = store.vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.source] = (acc[v.source] || 0) + 1;
    return acc;
  }, {});
  const cn = store.vehicles.filter((v) => v.country === "CN");
  let cached = 0;
  for (const v of cn) {
    const img = v.images?.[0];
    if (img && isImageCached(img)) cached += 1;
  }
  res.json({
    total: store.vehicles.length,
    korea: store.vehicles.filter((v) => v.country === "KR").length,
    china: cn.length,
    chinaPhotosCached: cached,
    bySource,
    leads: store.leads.length,
    deals: store.deals.length,
    users: store.users.length,
  });
}

export function adminListVehicles(req: Request, res: Response) {
  const store = loadStore();
  const q = req.query;
  let rows = [...store.vehicles];
  if (q.country === "KR" || q.country === "CN") rows = rows.filter((v) => v.country === q.country);
  if (q.source) rows = rows.filter((v) => v.source === String(q.source));
  if (q.status) rows = rows.filter((v) => v.status === String(q.status));
  if (q.brand) rows = rows.filter((v) => v.brand.toLowerCase() === String(q.brand).toLowerCase());
  if (q.q) {
    const s = String(q.q).toLowerCase();
    rows = rows.filter(
      (v) =>
        v.brand.toLowerCase().includes(s) ||
        v.model.toLowerCase().includes(s) ||
        v.public_slug.toLowerCase().includes(s)
    );
  }
  rows.sort((a, b) => b.id - a.id);
  const total = rows.length;
  const limit = Math.min(Math.max(Number(q.limit) || 40, 1), 100);
  const offset = Math.max(Number(q.offset) || 0, 0);
  const page = rows.slice(offset, offset + limit).map((v) => ({
    ...v,
    photo_cached: v.images?.[0] ? isImageCached(v.images[0]) : false,
  }));
  res.json({ items: page, total, limit, offset });
}

const patchSchema = z.object({
  status: z.enum(["AVAILABLE", "HIDDEN", "SOLD"]).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().nullable().optional(),
  mileage_km: z.number().int().nullable().optional(),
  foreign_price: z.number().nullable().optional(),
  estimated_total_rub: z.number().nullable().optional(),
  images: z.array(z.string()).optional(),
});

export function adminPatchVehicle(req: Request, res: Response) {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const store = loadStore();
  const slug = decodeURIComponent(req.params.slug);
  const row = store.vehicles.find((v) => v.public_slug === slug);
  if (!row) return res.status(404).json({ error: "not_found" });
  Object.assign(row, parsed.data);
  if (parsed.data.images) {
    row.images = parsed.data.images.map((u) =>
      row.country === "CN" ? normalizeChinaImageUrl(u) || u : u
    );
  }
  saveStore(store);
  res.json(row);
}

export function adminDeleteVehicle(req: Request, res: Response) {
  const store = loadStore();
  const slug = decodeURIComponent(req.params.slug);
  const idx = store.vehicles.findIndex((v) => v.public_slug === slug);
  if (idx < 0) return res.status(404).json({ error: "not_found" });
  const [removed] = store.vehicles.splice(idx, 1);
  saveStore(store);
  res.json({ ok: true, removed: removed.public_slug });
}

export async function adminWarmImages(req: Request, res: Response) {
  const store = loadStore();
  const country = String(req.body?.country || "CN");
  const limit = Math.min(Math.max(Number(req.body?.limit) || 60, 1), 200);

  let rows = store.vehicles.filter((v) => (country === "ALL" ? true : v.country === country));
  rows = rows.filter((v) => v.images?.length).slice(0, limit);

  // Repair previously rewritten broken tplv URLs in store
  let repaired = 0;
  for (const v of store.vehicles) {
    if (v.country !== "CN" || !v.images?.length) continue;
    // nothing to rewrite here — signed URLs come from re-import
  }
  if (repaired) saveStore(store);

  const urls = rows.flatMap((v) => v.images.slice(0, 2));
  const result = await warmImageUrls(urls, 5);
  res.json({ vehicles: rows.length, repaired, ...result });
}

export function adminListLeads(_req: Request, res: Response) {
  const store = loadStore();
  const items = [...store.leads].sort((a, b) => b.id - a.id).slice(0, 100);
  res.json({ items });
}

export function adminListDeals(_req: Request, res: Response) {
  const store = loadStore();
  const items = [...store.deals]
    .sort((a, b) => b.id - a.id)
    .slice(0, 100)
    .map((d) => ({ ...d, steps: DEAL_STEPS }));
  res.json({ items });
}

const dealPatchSchema = z.object({
  status: z.string().min(2),
  note: z.string().optional().default(""),
});

export function adminPatchDeal(req: Request, res: Response) {
  const parsed = dealPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const store = loadStore();
  const id = Number(req.params.id);
  const deal = store.deals.find((d) => d.id === id);
  if (!deal) return res.status(404).json({ error: "not_found" });
  const step = DEAL_STEPS.find((s) => s.status === parsed.data.status);
  if (!step) return res.status(400).json({ error: "bad_status" });
  deal.status = step.status;
  deal.events.push({
    at: new Date().toISOString(),
    status: step.status,
    title: step.title,
    text: parsed.data.note || step.text,
  });
  saveStore(store);
  res.json({ ...deal, steps: DEAL_STEPS });
}
