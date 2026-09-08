import type { Request, Response } from "express";
import { z } from "zod";
import { loadStore, saveStore } from "../db.js";
import { getUserFromReq } from "./auth.js";

export const DEAL_STEPS = [
  { status: "requested", title: "Заявка", text: "Заявка принята, менеджер свяжется с вами." },
  { status: "confirmed", title: "Подтверждение", text: "Условия зафиксированы, готовим выкуп." },
  { status: "paid", title: "Оплата", text: "Поступила оплата по счёту." },
  { status: "purchased", title: "Выкуп", text: "Автомобиль выкуплен на площадке." },
  { status: "inspection", title: "Проверка", text: "Диагностика и фотоотчёт перед отправкой." },
  { status: "shipping", title: "В пути", text: "Автомобиль едет в порт / на границу." },
  { status: "customs", title: "Таможня", text: "Таможенное оформление и утильсбор." },
  { status: "delivery", title: "Доставка по РФ", text: "Едет в ваш город." },
  { status: "delivered", title: "Выдан", text: "Автомобиль передан, документы на руках." },
] as const;

function findVehicle(slug: string) {
  const store = loadStore();
  const decoded = decodeURIComponent(slug);
  return (
    store.vehicles.find((v) => v.public_slug === decoded) ||
    store.vehicles.find((v) => `${v.source}-${v.source_listing_id}` === decoded) ||
    store.vehicles.find((v) => v.source_listing_id === decoded)
  );
}

export function listDeals(req: Request, res: Response) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const deals = loadStore()
    .deals.filter((d) => d.user_id === user.id)
    .sort((a, b) => b.id - a.id)
    .map((d) => ({ ...d, steps: DEAL_STEPS }));
  res.json(deals);
}

const createSchema = z.object({
  vehicle_slug: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  model: z.string().optional().default(""),
  year: z.coerce.number().int().optional().nullable(),
  country: z.string().optional().default(""),
  comment: z.string().optional().default(""),
});

export function createDeal(req: Request, res: Response) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const store = loadStore();
  const data = parsed.data;
  const car = data.vehicle_slug ? findVehicle(data.vehicle_slug) : null;
  const now = new Date().toISOString();
  const first = DEAL_STEPS[0];

  const deal = {
    id: store.seq.deal++,
    user_id: user.id,
    created_at: now,
    vehicle_slug: car ? `${car.source}-${car.source_listing_id}` : data.vehicle_slug,
    brand: car?.brand || data.brand.trim() || "Авто",
    model: car?.model || data.model.trim() || "",
    year: car?.year ?? data.year ?? null,
    country: car?.country || data.country || "",
    image: car?.images?.[0] || "",
    estimated_total_rub: car?.estimated_total_rub ?? null,
    comment: data.comment.trim(),
    status: first.status,
    events: [{ at: now, status: first.status, title: first.title, text: first.text }],
  };

  store.deals.push(deal);
  saveStore(store);
  res.status(201).json({ ...deal, steps: DEAL_STEPS });
}
