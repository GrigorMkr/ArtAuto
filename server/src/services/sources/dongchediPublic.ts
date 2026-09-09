import { latinizeVehicle, stripCjk } from "../latinNames.js";
import { parseEngineCcFromText, parsePowerHpFromText } from "../powerEstimate.js";
import {
  parseKvPairs,
  parsePowerFromKv,
  parseCcFromKv,
  buildTrimGroupsFromKv,
  type TrimSpecGroup,
} from "../trimSpecs.js";

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
  head_image_list?: Array<string | { url?: string; img_url?: string }>;
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
  year_month?: string | null;
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
  seats?: number | null;
  trim_specs?: TrimSpecGroup[];
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
  const detail = await fetchDongchediDetail(skuId);
  return detail?.images || [];
}

export type DongchediDetail = {
  images: string[];
  power_hp: number | null;
  engine_cc: number | null;
  transmission: string;
  drive: string;
  fuel_type: string;
  seats: number | null;
  year_month: string | null;
  trim_specs: TrimSpecGroup[];
  raw_kv: Record<string, string>;
};

function mapCnFuel(v?: string) {
  if (!v) return "";
  // defer to shared localizer (imported lazily via duplicate rules for zero circular dep)
  if (/纯电|电动|电车/.test(v) && !/混|油/.test(v)) return "электро";
  if (/柴油/.test(v) && /电|混/.test(v)) return "гибрид (дизель)";
  if (/混动|插电|增程|油电/.test(v)) return "гибрид";
  if (/柴油/.test(v)) return "дизель";
  if (/汽油|燃油|油车/.test(v)) return "бензин";
  return stripCjk(v) || "";
}

function mapCnDrive(v?: string) {
  if (!v) return "";
  if (/四驱|全时|适时|AWD|4WD/i.test(v)) return "полный";
  if (/后驱|RWD/i.test(v)) return "задний";
  if (/前驱|FF|FWD/i.test(v)) return "передний";
  return stripCjk(v) || "";
}

function mapCnGear(v?: string) {
  if (!v) return "";
  if (/电动车单速|单速变速|固定齿比|减速器|电动.*变速/.test(v)) return "Редуктор (EV)";
  if (/CVT|无级/.test(v)) return "CVT";
  if (/双离合|DCT|干式|湿式/.test(v)) return "робот";
  if (/手动|MT/.test(v) && !/自动/.test(v)) return "механика";
  if (/9.?挡.?自动|9.*自动/.test(v)) return "9-ступ. АКПП";
  if (/8.?挡.?自动|8.*自动|8挡自动/.test(v)) return "8-ступ. АКПП";
  if (/7.?挡.?自动|7.*自动|7挡自动/.test(v)) return "7-ступ. АКПП";
  if (/6.?挡.?自动|6.*自动|6挡自动/.test(v)) return "6-ступ. АКПП";
  if (/5.?挡.?自动|5.*自动/.test(v)) return "5-ступ. АКПП";
  if (/自动|AT|手自一体|AMT/.test(v)) return "автомат";
  const stripped = stripCjk(v);
  return stripped || "автомат";
}

function pickKv(map: Map<string, string>, ...keys: string[]) {
  for (const k of keys) {
    if (map.has(k) && map.get(k)) return map.get(k)!;
  }
  for (const [k, v] of map) {
    if (keys.some((want) => k.includes(want)) && v) return v;
  }
  return "";
}

function parseYearMonthCn(raw?: string | null): string | null {
  if (!raw) return null;
  const m = String(raw).match(/(20\d{2})\D{0,2}(\d{1,2})/);
  if (!m) return null;
  const y = m[1];
  const mo = m[2].padStart(2, "0");
  if (Number(mo) < 1 || Number(mo) > 12) return null;
  return `${y}${mo}`;
}

function findIdInJson(json: unknown, key: string): string | null {
  let found: string | null = null;
  const dig = (n: unknown, depth = 0) => {
    if (!n || found || depth > 14) return;
    if (Array.isArray(n)) {
      for (const x of n) dig(x, depth + 1);
      return;
    }
    if (typeof n === "object") {
      const o = n as Record<string, unknown>;
      if (o[key] != null && o[key] !== "" && o[key] !== 0) {
        found = String(o[key]);
        return;
      }
      for (const v of Object.values(o)) dig(v, depth + 1);
    }
  };
  dig(json);
  return found;
}

/** OEM trim table: car_group_list_key like "1.6T/170马力" + tags ["前驱"]. */
async function fetchDongchediCarListSpecs(
  seriesId: string,
  carId: string
): Promise<{
  power_hp: number | null;
  engine_cc: number | null;
  drive: string;
  transmission: string;
  group_key: string;
  car_name: string;
}> {
  const empty = {
    power_hp: null as number | null,
    engine_cc: null as number | null,
    drive: "",
    transmission: "",
    group_key: "",
    car_name: "",
  };
  if (!seriesId || !carId) return empty;
  const url = `https://m.dcdapp.com/motor/pc/car/series/car_list?series_id=${encodeURIComponent(
    seriesId
  )}&city_name=${encodeURIComponent("北京")}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36",
        Referer: "https://m.dongchedi.com/",
      },
    });
    if (!res.ok) return empty;
    const json = (await res.json()) as unknown;
    let hit: Record<string, unknown> | null = null;
    const dig = (n: unknown) => {
      if (!n || hit) return;
      if (Array.isArray(n)) {
        for (const x of n) dig(x);
        return;
      }
      if (typeof n === "object") {
        const o = n as Record<string, unknown>;
        if (String(o.car_id ?? o.id ?? "") === String(carId)) {
          hit = o;
          return;
        }
        for (const v of Object.values(o)) dig(v);
      }
    };
    dig(json);
    if (!hit) return empty;

    const group = String(hit.car_group_list_key || "");
    const hpM = group.match(/(\d{2,4})\s*马力/);
    const litM = group.match(/(\d)\.(\d)\s*T?/i) || group.match(/(\d)\.(\d)\s*L/i);
    const tags = Array.isArray(hit.tags) ? hit.tags.map(String) : [];
    const driveTag = tags.find((t) => /前驱|后驱|四驱|AWD|4WD|FF|RWD/i.test(t)) || "";
    const cfg = hit.car_config as { base_config?: string[] } | undefined;
    const gearRaw = cfg?.base_config?.find((x) => /挡|自动|手动|CVT|双离合/.test(x)) || "";

    return {
      power_hp: hpM ? Number(hpM[1]) : null,
      engine_cc: litM ? Math.round(Number(`${litM[1]}.${litM[2]}`) * 1000) : null,
      drive: mapCnDrive(driveTag),
      transmission: mapCnGear(gearRaw),
      group_key: group,
      car_name: String(hit.car_name || hit.name || ""),
    };
  } catch {
    return empty;
  }
}

function inferCnFuel(kv: Map<string, string>, titleBits: string[]): string {
  const raw = pickKv(kv, "燃料形式", "能源类型", "燃料") || titleBits.join(" ");
  const mapped = mapCnFuel(raw);
  if (mapped) return mapped;
  if (/纯电|电动|EV|Model\s*[Y3SX]/i.test(raw)) return "электро";
  if (/柴油|Diesel/i.test(raw)) return "дизель";
  if (/混动|DM-?i|PHEV|HEV|增程/i.test(raw)) return "гибрид";
  if (pickKv(kv, "发动机", "排量") || /\d\.\d\s*T|\d{3,4}\s*m?l/i.test(raw)) return "бензин";
  return "";
}

/** Normalize OEM table labels into short keys used by trimSpecs. */
function normalizeOemKey(raw: string): string {
  const k = raw.replace(/\s+/g, "").trim();
  if (/长.?宽.?高/.test(k)) return "长宽高";
  if (/最大马力/.test(k)) return "最大马力";
  if (/最大功率/.test(k)) return "最大功率";
  if (/座位数/.test(k)) return "座位数";
  if (/轴距/.test(k)) return "轴距";
  if (/环保标准|排放标准/.test(k)) return "环保标准";
  if (/^级别$|车级|车身级别/.test(k)) return "级别";
  if (/车身结构|车身形式/.test(k)) return "车身结构";
  if (/气缸容积|排量/.test(k) && /mL|ml|排量/.test(k)) return "排量";
  if (/^发动机$/.test(k) || k === "发动机") return "发动机";
  if (/变速箱类型/.test(k)) return "变速箱类型";
  if (/变速箱/.test(k)) return "变速箱";
  if (/驱动方式/.test(k)) return "驱动方式";
  if (/燃料形式|能源类型/.test(k)) return "燃料形式";
  return k;
}

const oemEntityCache = new Map<string, Map<string, string>>();

/** OEM param table HTML: 最大马力(Ps), 长×宽×高(mm), 座位数(个), … */
async function fetchDongchediOemEntity(carId: string): Promise<Map<string, string>> {
  const empty = new Map<string, string>();
  if (!carId) return empty;
  if (oemEntityCache.has(carId)) return oemEntityCache.get(carId)!;

  const hosts = [
    `https://m.dcdapp.com/motor/car_page/v1/get_entity/?car_id_list=${encodeURIComponent(carId)}`,
    `https://api.dcarapi.com/motor/car_page/v1/get_entity/?car_id_list=${encodeURIComponent(carId)}`,
  ];
  for (const url of hosts) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(22000),
        headers: {
          Accept: "text/html,application/xhtml+xml,*/*",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36",
          Referer: "https://m.dongchedi.com/",
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      if (!html || html.length < 200) continue;
      const map = new Map<string, string>();
      const re =
        /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html))) {
        const key = m[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        const val = m[2]
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!key || !val || val === "-" || val === "—") continue;
        const nk = normalizeOemKey(key);
        if (!map.has(nk)) map.set(nk, val);
      }
      if (map.size) {
        oemEntityCache.set(carId, map);
        return map;
      }
    } catch {
      /* try next host */
    }
  }
  oemEntityCache.set(carId, empty);
  return empty;
}

async function fetchDongchediJson(skuId: string): Promise<unknown | null> {
  const hosts = [
    `https://m.dcdapp.com/motor/sh_information/api/h5/sku_detail/full?sku_id=${encodeURIComponent(skuId)}&aid=1839`,
    `https://api.dcarapi.com/motor/sh_information/api/h5/sku_detail/full?sku_id=${encodeURIComponent(skuId)}&aid=1839`,
  ];
  for (const url of hosts) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(28000),
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
            Referer: url.includes("dcdapp")
              ? `https://m.dongchedi.com/usedcar/${skuId}`
              : `https://api.dcarapi.com/motor/feoffline/usedcar_detail/detail.html?sku_id=${skuId}`,
          },
        });
        if (!res.ok) continue;
        const json = (await res.json()) as { status?: number; message?: string };
        if (json && (json.status === 0 || json.message === "success" || (json as { data?: unknown }).data)) {
          return json;
        }
      } catch {
        if (attempt < 1) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  return null;
}

/** Full Dongchedi used-car card: photos + params (power, wheelbase, etc.). */
export async function fetchDongchediDetail(skuId: string): Promise<DongchediDetail | null> {
  if (!skuId) return null;
  const json = await fetchDongchediJson(skuId);
  if (!json) return null;

  try {
    const kv = parseKvPairs(json);
    const carId = findIdInJson(json, "car_id");
    const seriesId = findIdInJson(json, "series_id");
    const listSpecs =
      carId && seriesId ? await fetchDongchediCarListSpecs(seriesId, carId) : null;
    const oem = carId ? await fetchDongchediOemEntity(carId) : new Map<string, string>();
    for (const [k, v] of oem) {
      if (!kv.has(k) || !kv.get(k)) kv.set(k, v);
      // Prefer fuller OEM engine string when listing only has "1.6T"
      if (k === "发动机" && /马力|L\d/i.test(v)) kv.set(k, v);
      if (k === "最大马力" && v) kv.set(k, v);
      if (k === "长宽高" && v) kv.set(k, v);
      if (k === "座位数" && v) kv.set(k, v);
      if (k === "环保标准" && v) kv.set(k, v);
      if (k === "级别" && v) kv.set(k, v);
    }

    // Enrich KV from OEM group key for trim card completeness
    if (listSpecs?.group_key) {
      const [disp, hpPart] = listSpecs.group_key.split("/");
      if (disp && !kv.has("发动机")) kv.set("发动机", disp);
      if (hpPart && !kv.has("最大马力")) kv.set("最大马力", hpPart.replace(/马力/, ""));
    }
    if (listSpecs?.drive && !kv.has("驱动方式")) {
      const cn =
        listSpecs.drive === "передний"
          ? "前驱"
          : listSpecs.drive === "полный"
            ? "四驱"
            : listSpecs.drive === "задний"
              ? "后驱"
              : "";
      if (cn) kv.set("驱动方式", cn);
    }
    // highlight sometimes puts drive under 动力类型
    const driveHint = pickKv(kv, "驱动方式", "驱动形式");
    if (!driveHint) {
      const dyn = pickKv(kv, "动力类型");
      if (/前驱|后驱|四驱|AWD|4WD|FF/i.test(dyn)) kv.set("驱动方式", dyn);
    }
    if (listSpecs?.transmission && !kv.has("变速箱")) {
      kv.set("变速箱", listSpecs.group_key.includes("DCT") ? "双离合" : "自动");
    }
    if (!kv.has("燃料形式")) {
      const fuel = inferCnFuel(kv, [listSpecs?.car_name || "", listSpecs?.group_key || ""]);
      if (fuel === "электро") kv.set("燃料形式", "纯电");
      else if (fuel === "дизель") kv.set("燃料形式", "柴油");
      else if (fuel === "гибрид") kv.set("燃料形式", "混动");
      else if (fuel === "бензин") kv.set("燃料形式", "汽油");
    }

    const trim_specs = buildTrimGroupsFromKv(kv);

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
    const byHash = new Map<string, string>();
    for (const u of found) {
      const m = u.match(/tos-cn-i-f042mdwyw7\/([a-f0-9]{32})/i);
      const key = m ? m[1].toLowerCase() : u;
      if (!byHash.has(key)) byHash.set(key, u);
    }

    const seatsRaw = pickKv(kv, "座位数", "座位数(个)");
    const seats = seatsRaw ? Number(String(seatsRaw).replace(/\D/g, "")) : null;
    const year_month = parseYearMonthCn(
      pickKv(kv, "上牌时间", "注册时间", "首次上牌", "出厂时间")
    );

    const fuel_type = inferCnFuel(kv, [listSpecs?.car_name || "", listSpecs?.group_key || ""]);
    const isEv =
      /электро/i.test(fuel_type) && !/гибрид|бензин|дизель/i.test(fuel_type);

    const oemHp = oem.get("最大马力");
    const oemHpN = oemHp ? Number(String(oemHp).replace(/[^\d.]/g, "")) : null;
    const power_hp =
      (oemHpN && oemHpN >= 40 && oemHpN <= 1500 ? Math.round(oemHpN) : null) ||
      parsePowerFromKv(kv) ||
      listSpecs?.power_hp ||
      parsePowerHpFromText(listSpecs?.group_key || "");
    const oemCc = oem.get("排量");
    const oemCcN = oemCc ? Number(String(oemCc).replace(/[^\d]/g, "")) : null;
    const engine_cc = isEv
      ? null
      : (oemCcN && oemCcN >= 600 && oemCcN <= 8000 ? oemCcN : null) ||
        parseCcFromKv(kv) ||
        listSpecs?.engine_cc ||
        parseEngineCcFromText(listSpecs?.group_key || "", listSpecs?.car_name || "");

    return {
      images: [...byHash.values()].slice(0, 12),
      power_hp,
      engine_cc,
      transmission:
        mapCnGear(pickKv(kv, "变速箱", "变速箱类型")) || listSpecs?.transmission || "",
      drive: mapCnDrive(pickKv(kv, "驱动方式", "驱动形式")) || listSpecs?.drive || "",
      fuel_type,
      seats: Number.isFinite(seats) && seats! > 0 ? seats : null,
      year_month,
      trim_specs,
      raw_kv: Object.fromEntries(kv),
    };
  } catch {
    return null;
  }
}

export function normalizeDongchedi(o: DongchediSku): NormalizedImport {
  const id = String(o.sku_id ?? "");
  const names = latinizeVehicle(o.brand_name || "", o.series_name || "", o.car_name || o.title || "");
  const price = parsePriceWan(o.sh_price ?? o.origin_sh_price);
  const images = collectImages(o);
  const titleBlob = [o.car_name, o.title, o.sub_title, o.series_name].filter(Boolean).join(" ");
  const fuel_type = /DM-?i|HEV|PHEV|混动/i.test(titleBlob)
    ? "гибрид"
    : /纯电|EV|电动/i.test(titleBlob)
      ? "электро"
      : "";
  const isEv = fuel_type === "электро";
  const engine_cc = isEv ? null : parseEngineCcFromText(titleBlob);
  const power_hp = parsePowerHpFromText(titleBlob);

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
    fuel_type,
    transmission: "",
    drive: "",
    body_type: "",
    engine_cc,
    power_hp,
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

  // Enrich galleries + real specs (HP, drive, trim card) from H5 detail API
  const concurrency = 6;
  let multi = 0;
  let withPower = 0;
  console.log(`[dongchedi] enriching detail for ${out.length} cars (x${concurrency})…`);
  for (let i = 0; i < out.length; i += concurrency) {
    const chunk = out.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const detail = await fetchDongchediDetail(row.source_listing_id);
          if (!detail) return;
          if (detail.images.length > 1) {
            const merged = [...row.images, ...detail.images].filter(Boolean);
            const byHash = new Map<string, string>();
            for (const u of merged) {
              const m = u.match(/tos-cn-i-f042mdwyw7\/([a-f0-9]{32})/i);
              const key = m ? m[1].toLowerCase() : u;
              if (!byHash.has(key)) byHash.set(key, u);
            }
            row.images = [...byHash.values()].slice(0, 12);
            if (row.images.length > 1) multi += 1;
          }
          if (detail.power_hp) {
            row.power_hp = detail.power_hp;
            withPower += 1;
          }
          if (detail.engine_cc && (!row.engine_cc || row.engine_cc === 1600)) {
            row.engine_cc = detail.engine_cc;
          }
          if (/электро/i.test(detail.fuel_type || row.fuel_type || "")) {
            row.engine_cc = null;
          }
          if (detail.transmission) row.transmission = detail.transmission;
          if (detail.drive) row.drive = detail.drive;
          if (detail.fuel_type) row.fuel_type = detail.fuel_type;
          if (detail.seats) row.seats = detail.seats;
          if (detail.year_month) row.year_month = detail.year_month;
          if (detail.trim_specs.length) row.trim_specs = detail.trim_specs;
        } catch {
          /* keep cover */
        }
      })
    );
    if (i + concurrency < out.length) await new Promise((r) => setTimeout(r, 120));
    if ((i / concurrency) % 10 === 0) {
      console.log(
        `[dongchedi] detail progress ${Math.min(i + concurrency, out.length)}/${out.length} power=${withPower}`
      );
    }
  }

  console.log(`[dongchedi] fetched ${out.length} unique listings, multi-photo=${multi}, with_power=${withPower}`);
  return out;
}
