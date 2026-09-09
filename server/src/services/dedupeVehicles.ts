/**
 * Drop near-duplicate listings (same car under different IDs).
 * Keys: any shared photo fingerprint, then brand/model/year/price/mileage.
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
  const seenImg = new Set<string>();
  const seenMeta = new Set<string>();
  const out: T[] = [];

  for (const v of rows) {
    const meta = metaKey(v);
    const imgs = imageKeys(v);
    const imgHit = imgs.some((k) => seenImg.has(k));
    if (imgHit || seenMeta.has(meta)) continue;
    for (const k of imgs) seenImg.add(k);
    seenMeta.add(meta);
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

function imageKeys(v: { source: string; images?: string[] | null }): string[] {
  const keys = new Set<string>();
  for (const src of v.images || []) {
    const raw = unwrapImageUrl(src);
    try {
      const parsed = new URL(raw);
      const path = parsed.pathname.toLowerCase();
      // Encar: …/42608203_001.jpg → shared listing photo id
      const encar = path.match(/\/(\d{6,})_\d{3}\.(jpg|jpeg|png|webp)$/i);
      if (encar) {
        keys.add(`${v.source}|encar|${encar[1]}`);
        continue;
      }
      // Dongchedi / byteimg hash folder
      const hash = path.match(/\/([a-f0-9]{32})\b/i);
      if (hash) {
        keys.add(`${v.source}|hash|${hash[1].toLowerCase()}`);
        continue;
      }
      keys.add(`${v.source}|path|${parsed.hostname.toLowerCase()}${path.split("~")[0]}`);
    } catch {
      keys.add(`${v.source}|raw|${raw.split("?")[0]}`);
    }
  }
  return [...keys];
}

function metaKey(v: {
  source: string;
  brand: string;
  model: string;
  year?: number | null;
  mileage_km?: number | null;
  foreign_price?: number | null;
}): string {
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
