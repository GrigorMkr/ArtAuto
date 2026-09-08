/** Public Encar search API (same feed their website uses). */

import { latinizeVehicle, stripCjk } from "../latinNames.js";

const BRAND_MAP: Record<string, string> = {
  현대: "Hyundai",
  기아: "Kia",
  제네시스: "Genesis",
  쌍용: "SsangYong",
  르노코리아: "Renault Korea",
  쉐보레: "Chevrolet",
  삼성: "Renault Samsung",
  BMW: "BMW",
  벤츠: "Mercedes-Benz",
  아우디: "Audi",
  폭스바겐: "Volkswagen",
  도요타: "Toyota",
  렉서스: "Lexus",
  혼다: "Honda",
  닛산: "Nissan",
  볼보: "Volvo",
  미니: "MINI",
  포르쉐: "Porsche",
  랜드로버: "Land Rover",
  지프: "Jeep",
  테슬라: "Tesla",
  포드: "Ford",
};

const FUEL_MAP: Record<string, string> = {
  가솔린: "бензин",
  디젤: "дизель",
  LPG: "LPG",
  전기: "электро",
  가솔린전기: "гибрид",
  하이브리드: "гибрид",
  "가솔린+전기": "гибрид",
};

export type EncarOffer = {
  Id: string;
  Manufacturer?: string;
  Model?: string;
  Badge?: string;
  BadgeDetail?: string;
  FuelType?: string;
  FormYear?: string;
  Year?: number;
  Mileage?: number;
  Price?: number;
  Photo?: string;
  Photos?: Array<{ location?: string; ordering?: number }>;
  OfficeCityState?: string;
};

export type NormalizedImport = {
  country: "KR" | "CN";
  source: string;
  source_listing_id: string;
  source_url: string;
  brand: string;
  model: string;
  trim: string;
  year: number | null;
  mileage_km: number | null;
  fuel_type: string;
  transmission: string;
  drive: string;
  body_type: string;
  engine_cc: number | null;
  power_hp: number | null;
  color: string;
  foreign_price: number | null;
  foreign_currency: string;
  images: string[];
};

function photoUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  if (cleaned.endsWith("_")) return `https://ci.encar.com${cleaned}001.jpg`;
  return `https://ci.encar.com${cleaned}`;
}

export function normalizeEncar(o: EncarOffer): NormalizedImport {
  const names = latinizeVehicle(o.Manufacturer || "", o.Model || "", o.Badge || "");
  const year = o.FormYear
    ? Number(o.FormYear)
    : o.Year
      ? Math.floor(Number(o.Year) / 100)
      : null;
  const images = (o.Photos || [])
    .map((p) => photoUrl(p.location || ""))
    .filter(Boolean);
  if (!images.length && o.Photo) images.push(photoUrl(o.Photo));
  const unique = [...new Set(images)];
  // Prefer studio _001 first for cards, keep the rest for the gallery
  unique.sort((a, b) => {
    const score = (u: string) => (/_001\.(jpg|jpeg|png)$/i.test(u) ? 0 : 1);
    return score(a) - score(b);
  });
  const fuel = FUEL_MAP[o.FuelType || ""] || stripCjk(o.FuelType || "");

  return {
    country: "KR",
    source: "encar",
    source_listing_id: String(o.Id),
    source_url: `https://www.encar.com/dc/dc_cardetailview.do?carid=${o.Id}`,
    brand: names.brand,
    model: names.model || "Model",
    trim: stripCjk([o.Badge, o.BadgeDetail].filter(Boolean).join(" · ")),
    year: Number.isFinite(year) ? year : null,
    mileage_km: o.Mileage != null ? Math.round(Number(o.Mileage)) : null,
    fuel_type: fuel,
    transmission: "",
    drive: "",
    body_type: "",
    engine_cc: null,
    power_hp: null,
    color: "",
    foreign_price: o.Price != null ? Math.round(Number(o.Price) * 10000) : null,
    foreign_currency: "KRW",
    images: unique.slice(0, 30),
  };
}

export async function fetchEncarPage(
  offset = 0,
  limit = 40,
  opts?: { carType?: string; manufacturer?: string }
): Promise<EncarOffer[]> {
  const carType = opts?.carType || "A";
  const parts = [`Hidden.N.`, `CarType.${carType}.`];
  if (opts?.manufacturer) parts.push(`Manufacturer.${opts.manufacturer}.`);
  const params = new URLSearchParams({
    count: "true",
    q: `(And.${parts.join("_.")})`,
    sr: `|ModifiedDate|${offset}|${limit}`,
  });
  const url = `https://api.encar.com/search/car/list/general?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      Referer: "https://www.encar.com/",
      Origin: "https://www.encar.com",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Encar HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { SearchResults?: EncarOffer[] };
  return data.SearchResults || [];
}

export async function fetchEncarGallery(carId: string): Promise<string[]> {
  if (!carId) return [];
  const url = `https://api.encar.com/v1/readside/vehicle/${encodeURIComponent(carId)}?include=PHOTOS`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        Referer: "https://www.encar.com/",
        Origin: "https://www.encar.com",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      photos?: Array<{ path?: string; location?: string; code?: string }>;
    };
    const out: string[] = [];
    for (const p of json.photos || []) {
      const u = photoUrl(p.path || p.location || "");
      if (u && !out.includes(u)) out.push(u);
    }
    out.sort((a, b) => {
      const score = (u: string) => {
        const m = u.match(/_(\d{3})\.(jpg|jpeg|png)$/i);
        if (!m) return 50;
        const n = Number(m[1]);
        if (n === 1) return 0;
        if (n <= 10) return n;
        return 20 + n;
      };
      return score(a) - score(b);
    });
    return out.slice(0, 16);
  } catch {
    return [];
  }
}

/** Major Encar marques so filters get real brand coverage (domestic + import). */
const ENCAR_BRAND_QUOTAS: Array<{ carType: "Y" | "N"; manufacturer: string; limit: number }> = [
  { carType: "Y", manufacturer: "현대", limit: 180 },
  { carType: "Y", manufacturer: "기아", limit: 180 },
  { carType: "Y", manufacturer: "제네시스", limit: 90 },
  { carType: "Y", manufacturer: "KG모빌리티(쌍용)", limit: 60 },
  { carType: "Y", manufacturer: "르노코리아", limit: 50 },
  { carType: "Y", manufacturer: "쉐보레", limit: 50 },
  { carType: "N", manufacturer: "BMW", limit: 90 },
  { carType: "N", manufacturer: "벤츠", limit: 90 },
  { carType: "N", manufacturer: "아우디", limit: 50 },
  { carType: "N", manufacturer: "폭스바겐", limit: 40 },
  { carType: "N", manufacturer: "도요타", limit: 40 },
  { carType: "N", manufacturer: "렉서스", limit: 35 },
  { carType: "N", manufacturer: "볼보", limit: 35 },
  { carType: "N", manufacturer: "미니", limit: 25 },
  { carType: "N", manufacturer: "포르쉐", limit: 25 },
  { carType: "N", manufacturer: "랜드로버", limit: 25 },
  { carType: "N", manufacturer: "지프", limit: 25 },
  { carType: "N", manufacturer: "테슬라", limit: 25 },
  { carType: "N", manufacturer: "혼다", limit: 25 },
  { carType: "N", manufacturer: "닛산", limit: 25 },
  { carType: "N", manufacturer: "포드", limit: 25 },
  { carType: "N", manufacturer: "페라리", limit: 10 },
  { carType: "N", manufacturer: "마세라티", limit: 10 },
  { carType: "N", manufacturer: "재규어", limit: 15 },
  { carType: "N", manufacturer: "인피니티", limit: 15 },
];

export async function fetchEncarBatch(total = 1200): Promise<NormalizedImport[]> {
  const out: NormalizedImport[] = [];
  const seen = new Set<string>();
  const pageSize = 40;

  const pushPage = async (page: EncarOffer[]) => {
    for (const item of page) {
      const n = normalizeEncar(item);
      if (!n.source_listing_id || seen.has(n.source_listing_id)) continue;
      seen.add(n.source_listing_id);
      out.push(n);
      if (out.length >= total) return true;
    }
    return false;
  };

  // 1) Balanced brand quotas so search filters include all major marques
  for (const quota of ENCAR_BRAND_QUOTAS) {
    if (out.length >= total) break;
    const want = Math.min(quota.limit, total - out.length);
    for (let offset = 0; offset < want; offset += pageSize) {
      console.log(
        `[encar] ${quota.carType}/${quota.manufacturer} offset=${offset} have=${out.length}/${total}`
      );
      let page: EncarOffer[] = [];
      try {
        page = await fetchEncarPage(offset, Math.min(pageSize, want - offset), {
          carType: quota.carType,
          manufacturer: quota.manufacturer,
        });
      } catch (e) {
        console.warn(`[encar] page failed`, quota.manufacturer, e);
        break;
      }
      if (!page.length) break;
      const full = await pushPage(page);
      if (full) break;
      if (page.length < pageSize) break;
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  // 2) Fill remaining from all cars (domestic + import)
  for (let offset = 0; out.length < total; offset += pageSize) {
    console.log(`[encar] fill CarType.A offset=${offset} have=${out.length}/${total}`);
    let page: EncarOffer[] = [];
    try {
      page = await fetchEncarPage(offset, pageSize, { carType: "A" });
    } catch (e) {
      console.warn(`[encar] fill failed`, e);
      break;
    }
    if (!page.length) break;
    const before = out.length;
    const full = await pushPage(page);
    if (full) break;
    if (out.length === before || page.length < pageSize) break;
    await new Promise((r) => setTimeout(r, 80));
  }

  // Enrich galleries from detail photos API (list often returns only ~4)
  const concurrency = 8;
  let multi = 0;
  console.log(`[encar] enriching galleries for ${out.length} cars (x${concurrency})…`);
  for (let i = 0; i < out.length; i += concurrency) {
    const chunk = out.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const gallery = await fetchEncarGallery(row.source_listing_id);
          if (gallery.length > row.images.length) {
            const merged = [...gallery, ...row.images].filter(Boolean);
            row.images = [...new Set(merged)].slice(0, 16);
          }
          if (row.images.length > 1) multi += 1;
        } catch {
          /* keep list photos */
        }
      })
    );
    if ((i / concurrency) % 15 === 0) {
      console.log(`[encar] gallery progress ${Math.min(i + concurrency, out.length)}/${out.length}`);
    }
    if (i + concurrency < out.length) await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`[encar] fetched ${out.length}, multi-photo=${multi}`);
  return out;
}
