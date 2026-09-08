import axios from "axios";
import type { CalcResult, CatalogFilters, CatalogResponse, MetaResponse, Vehicle } from "./types";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export async function fetchCatalog(filters: CatalogFilters = {}) {
  const { data } = await api.get<CatalogResponse>("/catalog", { params: filters });
  return data;
}

export async function fetchVehicle(slug: string) {
  const { data } = await api.get<Vehicle>(`/vehicles/${slug}`);
  return data;
}

export async function fetchMeta() {
  const { data } = await api.get<MetaResponse>("/meta");
  return data;
}

export async function createLead(payload: Record<string, unknown>) {
  const { data } = await api.post("/leads", payload);
  return data;
}

export async function runCalculator(payload: Record<string, unknown>) {
  const { data } = await api.post<CalcResult>("/calculator", payload);
  return data;
}

export function mediaUrl(src?: string | null) {
  if (!src) return "";
  if (src.startsWith("/api/img?") || src.startsWith("/api/img/")) return src;
  if (src.startsWith("/brand/")) return src;
  if (src.startsWith("https://wsrv.nl/") || src.startsWith("https://images.weserv.nl/")) return src;
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  // China CDN: load via public mirror in the browser (keep full signed URL)
  try {
    const host = new URL(src).hostname.toLowerCase();
    if (
      host.includes("byteimg") ||
      host.includes("dcd") ||
      host.includes("dcar") ||
      host.includes("toutiao") ||
      host.includes("dongchedi")
    ) {
      return `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=jpg&w=900&q=80`;
    }
  } catch {
    /* fall through */
  }
  return `/api/img?u=${encodeURIComponent(src)}`;
}

export function formatRub(value: number | null | undefined) {
  if (value == null) return "по запросу";
  return new Intl.NumberFormat("ru-RU").format(Math.round(value)) + " ₽";
}

export function countryLabel(code: string) {
  return code === "KR" ? "Корея" : code === "CN" ? "Китай" : code;
}
