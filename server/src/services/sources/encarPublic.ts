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

export async function fetchEncarPage(offset = 0, limit = 40): Promise<EncarOffer[]> {
  const params = new URLSearchParams({
    count: "true",
    q: "(And.Hidden.N._.CarType.Y.)",
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

export async function fetchEncarBatch(total = 400): Promise<NormalizedImport[]> {
  const out: NormalizedImport[] = [];
  const pageSize = 40;
  for (let offset = 0; offset < total; offset += pageSize) {
    console.log(`[encar] page offset=${offset}`);
    const page = await fetchEncarPage(offset, pageSize);
    if (!page.length) break;
    for (const item of page) out.push(normalizeEncar(item));
    if (page.length < pageSize) break;
  }
  return out;
}
