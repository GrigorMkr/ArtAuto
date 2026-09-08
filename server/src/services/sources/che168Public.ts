/**
 * Che168 public endpoints are often unreachable from RU networks.
 * We try a few known hosts; importer treats empty result as soft-fail.
 */

export type Che168Item = Record<string, unknown>;

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

function pick(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== "") return v;
  }
  return undefined;
}

export function normalizeChe168(o: Che168Item): NormalizedImport | null {
  const id = String(pick(o, ["infoid", "infoId", "carid", "id", "Cid"]) ?? "");
  if (!id) return null;
  const brand = String(pick(o, ["brandname", "brandName", "BrandName", "brand"]) ?? "");
  const model = String(pick(o, ["seriesname", "seriesName", "SeriesName", "series"]) ?? "");
  const priceRaw = Number(pick(o, ["price", "Price", "pricewan"]) ?? 0);
  // Che168 prices are usually in 万元
  const foreign_price = priceRaw > 0 ? Math.round(priceRaw * (priceRaw < 1000 ? 10000 : 1)) : null;
  const mileage = Number(pick(o, ["mileage", "Mileage", "mileageing"]) ?? 0);
  const year = Number(pick(o, ["regdate", "year", "Year", "firstregyear"]) ?? 0);
  const img = String(pick(o, ["imageurl", "ImageUrl", "pic", "photo", "imgurl"]) ?? "");

  return {
    country: "CN",
    source: "che168",
    source_listing_id: id,
    source_url: `https://www.che168.com/dealer/carinfo_${id}.html`,
    brand,
    model,
    trim: String(pick(o, ["name", "carname", "title"]) ?? ""),
    year: year > 1900 ? Math.floor(year) : null,
    mileage_km: mileage > 0 ? Math.round(mileage < 1000 ? mileage * 10000 : mileage) : null,
    fuel_type: "",
    transmission: "",
    drive: "",
    body_type: "",
    engine_cc: null,
    power_hp: null,
    color: "",
    foreign_price,
    foreign_currency: "CNY",
    images: img ? [img.startsWith("//") ? `https:${img}` : img] : [],
  };
}

export async function fetchChe168Batch(total = 60): Promise<NormalizedImport[]> {
  const endpoints = [
    `https://cacheapigo.che168.com/CarProduct/GetUsedCarList.ashx?_appid=2sc.pc&pageindex=1&pagesize=${Math.min(total, 40)}&pid=110000`,
    `https://mapi.che168.com/cardealerapi/v1/car/list?pageindex=1&pagesize=${Math.min(total, 40)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json,*/*",
          Referer: "https://www.che168.com/",
        },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      const list =
        (json.list as Che168Item[]) ||
        (json.result as Che168Item[]) ||
        ((json.data as Record<string, unknown>)?.list as Che168Item[]) ||
        [];
      if (!Array.isArray(list) || !list.length) continue;
      return list.map(normalizeChe168).filter((x): x is NormalizedImport => !!x && !!x.foreign_price);
    } catch {
      // try next host
    }
  }
  return [];
}
