/**
 * Drop near-duplicate listings (same car under different Encar IDs).
 * Prefer cover-image fingerprint; fall back to brand/model/year/price/mileage.
 */
export function dedupeVisualVehicles<
  T extends {
    source: string;
    brand: string;
    model: string;
    year?: number | null;
    mileage_km?: number | null;
    foreign_price?: number | null;
    images?: string[] | null;
  },
>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const v of rows) {
    const key = visualKey(v);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function unwrapImageUrl(src: string): string {
  let u = src;
  if (src.startsWith("/api/img?")) {
    try {
      u = new URL(src, "https://local.invalid").searchParams.get("u") || src;
    } catch {
      /* keep */
    }
  }
  if (u.includes("wsrv.nl/") || u.includes("images.weserv.nl/")) {
    try {
      u = new URL(u).searchParams.get("url") || u;
    } catch {
      /* keep */
    }
  }
  return u;
}

function visualKey(v: {
  source: string;
  brand: string;
  model: string;
  year?: number | null;
  mileage_km?: number | null;
  foreign_price?: number | null;
  images?: string[] | null;
}): string {
  const cover = v.images?.[0];
  if (cover) {
    const raw = unwrapImageUrl(cover);
    try {
      const parsed = new URL(raw);
      return `${v.source}|img|${parsed.hostname.toLowerCase()}${parsed.pathname}`;
    } catch {
      return `${v.source}|img|${raw.split("?")[0]}`;
    }
  }
  return [
    v.source,
    "meta",
    v.brand.trim().toLowerCase(),
    v.model.trim().toLowerCase(),
    v.year ?? "",
    v.foreign_price ?? "",
    v.mileage_km ?? "",
  ].join("|");
}
