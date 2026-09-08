import { latinizeVehicle, stripCjk } from "../latinNames.js";

export type DongchediSku = {
  sku_id?: number | string;
  brand_name?: string;
  series_name?: string;
  car_name?: string;
  title?: string;
  sub_title?: string;
  car_year?: number;
  mileage?: string | number;
  sh_price?: string | number;
  origin_sh_price?: string | number;
  car_img_url?: string;
  image_list?: Array<string | { url?: string; img_url?: string }>;
  images?: Array<string | { url?: string; img_url?: string }>;
  head_image_list?: Array<string | { url?: string }>;
  car_source_city_name?: string;
  link_url?: string;
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

const BRAND_MAP: Record<string, string> = {
  日产: "Nissan",
  丰田: "Toyota",
  本田: "Honda",
  大众: "Volkswagen",
  奥迪: "Audi",
  宝马: "BMW",
  奔驰: "Mercedes-Benz",
  保时捷: "Porsche",
  现代: "Hyundai",
  起亚: "Kia",
  吉利: "Geely",
  比亚迪: "BYD",
  长安: "Changan",
  红旗: "Hongqi",
  理想: "Li Auto",
  特斯拉: "Tesla",
  福特: "Ford",
  雪佛兰: "Chevrolet",
  别克: "Buick",
  马自达: "Mazda",
  雷克萨斯: "Lexus",
  沃尔沃: "Volvo",
  凯迪拉克: "Cadillac",
  路虎: "Land Rover",
  捷豹: "Jaguar",
  斯巴鲁: "Subaru",
  三菱: "Mitsubishi",
  名爵: "MG",
  领克: "Lynk & Co",
  小鹏: "XPeng",
  蔚来: "NIO",
  问界: "AITO",
};

function parseMileage(raw: string | number | undefined): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Math.round(raw);
  const s = String(raw);
  const m = s.match(/([\d.]+)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  // "12.70万公里" → 127000
  if (s.includes("万")) return Math.round(n * 10000);
  return Math.round(n);
}

function parsePriceWan(raw: string | number | undefined): number | null {
  if (raw == null || raw === "" || raw === "暂无报价") return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  // Dongchedi sh_price is in 万元
  return Math.round(n * 10000);
}

function cleanImage(url: string) {
  if (!url) return "";
  // Keep full signed Dongchedi URL (query + ~tplv template required)
  return url.trim();
}

export function normalizeChinaImageUrl(url: string) {
  return cleanImage(url);
}

function collectImages(o: DongchediSku): string[] {
  const out: string[] = [];
  const push = (raw?: string) => {
    const u = raw ? cleanImage(raw) : "";
    if (u && !out.includes(u)) out.push(u);
  };
  push(o.car_img_url);
  for (const list of [o.image_list, o.images, o.head_image_list]) {
    for (const item of list || []) {
      if (typeof item === "string") push(item);
      else push(item?.url || item?.img_url);
    }
  }
  return out.slice(0, 30);
}

/** Pull listing gallery from Dongchedi H5 detail API (real multi photos). */
export async function fetchDongchediGallery(skuId: string): Promise<string[]> {
  if (!skuId) return [];
  const url = `https://api.dcarapi.com/motor/sh_information/api/h5/sku_detail/full?sku_id=${encodeURIComponent(skuId)}&aid=1839`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        Referer: `https://api.dcarapi.com/motor/feoffline/usedcar_detail/detail.html?sku_id=${skuId}`,
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as unknown;
    const found: string[] = [];
    const dig = (node: unknown) => {
      if (!node) return;
      if (typeof node === "string") {
        if (/tos-cn-i-f042mdwyw7\/[a-f0-9]{32}/i.test(node) && !/:100:100/.test(node)) {
          found.push(cleanImage(node));
        }
        return;
      }
      if (Array.isArray(node)) {
        for (const x of node) dig(x);
        return;
      }
      if (typeof node === "object") {
        for (const v of Object.values(node as Record<string, unknown>)) dig(v);
      }
    };
    dig(json);
    // Prefer unique image hashes (one URL per photo)
    const byHash = new Map<string, string>();
    for (const u of found) {
      const m = u.match(/tos-cn-i-f042mdwyw7\/([a-f0-9]{32})/i);
      if (!m) continue;
      const hash = m[1].toLowerCase();
      if (!byHash.has(hash)) byHash.set(hash, u);
    }
    return [...byHash.values()].slice(0, 12);
  } catch {
    return [];
  }
}

export function normalizeDongchedi(o: DongchediSku): NormalizedImport {
  const id = String(o.sku_id ?? "");
  const names = latinizeVehicle(o.brand_name || "", o.series_name || "", o.car_name || o.title || "");
  const price = parsePriceWan(o.sh_price ?? o.origin_sh_price);
  const images = collectImages(o);

  return {
    country: "CN",
    source: "dongchedi",
    source_listing_id: id,
    source_url: id ? `https://www.dongchedi.com/usedcar/${id}` : "",
    brand: names.brand,
    model: names.model || "Model",
    trim: stripCjk(o.car_name || o.title || ""),
    year: o.car_year ? Number(o.car_year) : null,
    mileage_km: parseMileage(o.mileage),
    fuel_type: "",
    transmission: "",
    drive: "",
    body_type: "",
    engine_cc: null,
    power_hp: null,
    color: "",
    foreign_price: price,
    foreign_currency: "CNY",
    images,
  };
}

export async function fetchDongchediPage(
  offset = 0,
  limit = 20,
  city = "北京"
): Promise<DongchediSku[]> {
  const params = new URLSearchParams({
    aid: "1556",
    city_name: city,
    sh_city_name: city,
    selected_city_name: city,
    limit: String(limit),
    offset: String(offset),
    sort: "4",
    shop_type: "9",
    entry: "main_page",
  });
  const url = `https://m.dcdapp.com/motor/sh_go/api/shop/sku_search?${params}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json",
      Referer: "https://m.dongchedi.com/",
    },
  });
  if (!res.ok) throw new Error(`Dongchedi HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: { sku_list?: DongchediSku[]; has_more?: boolean };
  };
  return json.data?.sku_list || [];
}

const DONGCHEDI_CITIES = [
  "北京",
  "上海",
  "广州",
  "深圳",
  "成都",
  "杭州",
  "重庆",
  "武汉",
  "西安",
  "苏州",
  "天津",
  "南京",
  "青岛",
  "长沙",
  "郑州",
  "东莞",
  "宁波",
  "佛山",
  "合肥",
  "大连",
];

export async function fetchDongchediBatch(total = 500): Promise<NormalizedImport[]> {
  const out: NormalizedImport[] = [];
  const seen = new Set<string>();
  const pageSize = 20;
  const perCityPages = 8;

  for (const city of DONGCHEDI_CITIES) {
    if (out.length >= total) break;
    for (let page = 0; page < perCityPages && out.length < total; page++) {
      const offset = page * pageSize;
      console.log(`[dongchedi] ${city} offset=${offset} have=${out.length}/${total}`);
      let list: DongchediSku[] = [];
      try {
        list = await fetchDongchediPage(offset, pageSize, city);
      } catch (e) {
        console.warn(`[dongchedi] page failed ${city}@${offset}`, e);
        break;
      }
      if (!list.length) break;
      for (const item of list) {
        const n = normalizeDongchedi(item);
        if (!n.source_listing_id || !n.foreign_price) continue;
        if (seen.has(n.source_listing_id)) continue;
        seen.add(n.source_listing_id);
        out.push(n);
        if (out.length >= total) break;
      }
      if (list.length < pageSize) break;
      await new Promise((r) => setTimeout(r, 140));
    }
  }

  // Enrich with real per-listing galleries from H5 detail API
  const concurrency = 6;
  let multi = 0;
  console.log(`[dongchedi] enriching galleries for ${out.length} cars (x${concurrency})…`);
  for (let i = 0; i < out.length; i += concurrency) {
    const chunk = out.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const gallery = await fetchDongchediGallery(row.source_listing_id);
          if (gallery.length > 1) {
            const merged = [...row.images, ...gallery].filter(Boolean);
            const byHash = new Map<string, string>();
            for (const u of merged) {
              const m = u.match(/tos-cn-i-f042mdwyw7\/([a-f0-9]{32})/i);
              const key = m ? m[1].toLowerCase() : u;
              if (!byHash.has(key)) byHash.set(key, u);
            }
            row.images = [...byHash.values()].slice(0, 12);
            if (row.images.length > 1) multi += 1;
          }
        } catch {
          /* keep cover */
        }
      })
    );
    if (i + concurrency < out.length) await new Promise((r) => setTimeout(r, 120));
    if ((i / concurrency) % 10 === 0) {
      console.log(`[dongchedi] gallery progress ${Math.min(i + concurrency, out.length)}/${out.length}`);
    }
  }

  console.log(`[dongchedi] fetched ${out.length} unique listings, multi-photo=${multi}`);
  return out;
}
