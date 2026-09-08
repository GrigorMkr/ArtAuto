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

function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}

function viaWsrv(url: string) {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&w=900&q=80`;
}

/** Decode legacy `/api/img?u=` / `/api/img/:b64` (no Express on GitHub Pages). */
function unwrapImgProxy(src: string): string | null {
  if (src.startsWith("/api/img?")) {
    try {
      return new URL(src, "https://local.invalid").searchParams.get("u");
    } catch {
      return null;
    }
  }
  if (src.startsWith("/api/img/")) {
    try {
      const b64 = src.slice("/api/img/".length).split(/[?#]/)[0];
      return decodeURIComponent(atob(b64));
    } catch {
      return null;
    }
  }
  return null;
}

function needsPublicMirror(host: string) {
  return (
    host.includes("encar") ||
    host.includes("byteimg") ||
    host.includes("dcd") ||
    host.includes("dcar") ||
    host.includes("toutiao") ||
    host.includes("dongchedi")
  );
}

/**
 * Resolve image URLs for both local API and static GitHub Pages.
 * Encar/China CDNs go through wsrv.nl (Pages has no `/api/img` proxy).
 */
export function mediaUrl(src?: string | null) {
  if (!src) return "";
  const unwrapped = unwrapImgProxy(src);
  if (unwrapped) src = unwrapped;

  if (src.startsWith("/brand/") || src.startsWith("brand/")) return assetUrl(src);
  if (src.startsWith("https://wsrv.nl/") || src.startsWith("https://images.weserv.nl/")) return src;
  if (src.startsWith("/") && !src.startsWith("//")) return src;

  try {
    const host = new URL(src).hostname.toLowerCase();
    if (needsPublicMirror(host)) return viaWsrv(src);
  } catch {
    /* fall through */
  }

  if (/^https?:\/\//i.test(src)) return viaWsrv(src);
  return src;
}

export function formatRub(value: number | null | undefined) {
  if (value == null) return "по запросу";
  return new Intl.NumberFormat("ru-RU").format(Math.round(value)) + " ₽";
}

export function countryLabel(code: string) {
  return code === "KR" ? "Корея" : code === "CN" ? "Китай" : code;
}
