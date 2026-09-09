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
  /** Often YYYYMM (first registration), e.g. 202507 */
  Year?: number;
  Mileage?: number;
  Price?: number;
  /** 일반 = retail sale; 리스 / 렌트 = lease / rental takeover (exclude). */
  SellType?: string;
  Photo?: string;
  Photos?: Array<{ location?: string; ordering?: number }>;
  OfficeCityState?: string;
};

/** Retail sales only — exclude lease (리스) and rent (렌트) takeovers. */
export function isEncarRetailSellType(sellType?: string | null) {
  if (!sellType) return true;
  return sellType === "일반";
}

export type NormalizedImport = {
  country: "KR" | "CN";
  source: string;
  source_listing_id: string;
  source_url: string;
  brand: string;
  model: string;
  trim: string;
  year: number | null;
  /** YYYYMM from Encar Year / yearMonth — for TKS age bands */
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
  const yearNum = o.Year != null ? Number(o.Year) : NaN;
  const yearMonth =
    Number.isFinite(yearNum) && yearNum >= 190001 && yearNum <= 210012
      ? String(Math.trunc(yearNum))
      : null;
  const year = o.FormYear
    ? Number(o.FormYear)
    : yearMonth
      ? Math.floor(Number(yearMonth) / 100)
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
    year_month: yearMonth,
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
  // SellType.일반 = normal retail; drops 리스 (lease) / 렌트 (rent) listings at the API.
  const parts = [`Hidden.N.`, `CarType.${carType}.`, `SellType.일반.`];
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
  const detail = await fetchEncarDetail(carId);
  return detail?.images || [];
}

export type EncarDetail = {
  images: string[];
  brand: string;
  model: string;
  trim: string;
  year: number | null;
  year_month: string | null;
  mileage_km: number | null;
  fuel_type: string;
  transmission: string;
  drive: string;
  body_type: string;
  engine_cc: number | null;
  color: string;
  foreign_price: number | null;
  seats: number | null;
  /** True when Encar marks the listing as operating lease / rent takeover. */
  is_lease: boolean;
};

const COLOR_MAP: Record<string, string> = {
  흰색: "белый",
  흰색투톤: "белый",
  화이트: "белый",
  검정: "чёрный",
  검정색: "чёрный",
  검은색: "чёрный",
  블랙: "чёрный",
  쥐색: "серый",
  회색: "серый",
  은회색: "серебристо-серый",
  은색: "серебристый",
  명은색: "серебристый",
  실버: "серебристый",
  청색: "синий",
  파란색: "синий",
  하늘색: "голубой",
  청옥색: "бирюзовый",
  빨강: "красный",
  빨간색: "красный",
  레드: "красный",
  자주색: "бордовый",
  진주: "жемчужный",
  진주색: "жемчужный",
  갈색: "коричневый",
  베이지: "бежевый",
  녹색: "зелёный",
  담녹색: "светло-зелёный",
  연두색: "салатовый",
  노랑: "жёлтый",
  노란색: "жёлтый",
  보라: "фиолетовый",
  골드: "золотистый",
  금색: "золотистый",
  연금색: "золотистый",
  오렌지: "оранжевый",
  주황색: "оранжевый",
  핑크: "розовый",
  분홍색: "розовый",
  보라색: "фиолетовый",
  남색: "тёмно-синий",
  카키: "хаки",
  청록색: "бирюзовый",
};

/** Ordered longer keys first so 은회색 beats 회색. */
const COLOR_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);

function mapColor(name?: string | null) {
  if (!name) return "";
  const raw = String(name).trim();
  if (COLOR_MAP[raw]) return COLOR_MAP[raw];
  for (const key of COLOR_KEYS) {
    if (raw.includes(key)) return COLOR_MAP[key];
  }
  const stripped = stripCjk(raw).trim();
  // Never leave Hangul/CJK in the catalog UI.
  if (!stripped || /[\u3000-\u9fff\uac00-\ud7af]/.test(stripped)) return "";
  return stripped;
}

const TRANS_MAP: Record<string, string> = {
  오토: "автомат",
  자동: "автомат",
  수동: "механика",
  CVT: "CVT",
  DCT: "робот",
  AMT: "робот",
};

const BODY_MAP: Record<string, string> = {
  SUV: "SUV",
  준중형차: "компакт",
  중형차: "средний класс",
  대형차: "полноразмерный",
  경차: "кей-кар",
  소형차: "малолитражка",
  승용: "легковое",
  승합차: "минивэн",
  화물차: "грузовой",
  스포츠카: "спорткар",
  픽업: "пикап",
  밴: "фургон",
  버스: "автобус",
};

function mapTransmission(name?: string | null) {
  if (!name) return "";
  const mapped = TRANS_MAP[name] || stripCjk(name);
  if (!mapped || /[\u3000-\u9fff\uac00-\ud7af]/.test(mapped)) return TRANS_MAP[name] || "";
  return mapped;
}

function mapBody(name?: string | null) {
  if (!name) return "";
  if (BODY_MAP[name]) return BODY_MAP[name];
  for (const [k, v] of Object.entries(BODY_MAP)) {
    if (name.includes(k)) return v;
  }
  const mapped = stripCjk(name);
  if (!mapped || /[\u3000-\u9fff\uac00-\ud7af]/.test(mapped)) return "";
  return mapped;
}

function parseDrive(...parts: Array<string | null | undefined>) {
  const text = parts.filter(Boolean).join(" ").toUpperCase();
  if (/\bAWD\b|\b4WD\b|4MATIC|XDRIVE|QUATTRO|ALL[\s-]?WHEEL/.test(text)) return "полный";
  if (/\bRWD\b|REAR/.test(text)) return "задний";
  if (/\bFWD\b|2WD|FF\b/.test(text)) return "передний";
  return "";
}

/**
 * Full Encar vehicle card: photos + technical fields from CATEGORY/SPEC.
 */
export async function fetchEncarDetail(carId: string): Promise<EncarDetail | null> {
  if (!carId) return null;
  const include = "CATEGORY,SPEC,ADVERTISEMENT,PHOTOS";
  const url = `https://api.encar.com/v1/readside/vehicle/${encodeURIComponent(carId)}?include=${encodeURIComponent(include)}`;
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
    if (!res.ok) return null;
    const json = (await res.json()) as {
      photos?: Array<{ path?: string; location?: string }>;
      category?: {
        manufacturerEnglishName?: string;
        manufacturerName?: string;
        modelGroupEnglishName?: string;
        modelGroupName?: string;
        modelName?: string;
        gradeEnglishName?: string;
        gradeName?: string;
        gradeDetailEnglishName?: string;
        gradeDetailName?: string;
        formYear?: string;
        yearMonth?: string;
      };
      spec?: {
        mileage?: number;
        displacement?: number;
        transmissionName?: string;
        fuelName?: string;
        colorName?: string;
        seatCount?: number;
        bodyName?: string;
      };
      advertisement?: {
        price?: number;
        advertisementType?: string;
        leaseRentInfo?: unknown;
      };
      manage?: { dummyVehicleId?: number };
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

    const cat = json.category || {};
    const spec = json.spec || {};
    const brandRaw = cat.manufacturerEnglishName || cat.manufacturerName || "";
    const modelRaw =
      cat.modelGroupEnglishName || cat.modelGroupName || cat.modelName || "";
    const names = latinizeVehicle(brandRaw, modelRaw, cat.gradeEnglishName || cat.gradeName || "");
    const fuel = FUEL_MAP[spec.fuelName || ""] || stripCjk(spec.fuelName || "");
    const isEv = /электро|전기|EV/i.test(fuel) || spec.fuelName === "전기";
    const drive = parseDrive(
      cat.gradeEnglishName,
      cat.gradeName,
      cat.gradeDetailEnglishName,
      cat.gradeDetailName
    );
    const year = cat.formYear ? Number(cat.formYear) : null;
    const yearMonth = cat.yearMonth ? String(cat.yearMonth) : null;
    const price =
      json.advertisement?.price != null
        ? Math.round(Number(json.advertisement.price) * 10000)
        : null;
    const advType = String(json.advertisement?.advertisementType || "").toUpperCase();
    const isLease =
      advType.includes("LEASE") ||
      advType.includes("RENT") ||
      json.advertisement?.leaseRentInfo != null;

    return {
      images: out.slice(0, 16),
      brand: names.brand,
      model: names.model || stripCjk(modelRaw) || "Model",
      trim: stripCjk(
        [cat.gradeEnglishName || cat.gradeName, cat.gradeDetailEnglishName || cat.gradeDetailName]
          .filter(Boolean)
          .join(" · ")
      ),
      year: Number.isFinite(year) ? year : null,
      year_month: yearMonth,
      mileage_km: spec.mileage != null ? Math.round(Number(spec.mileage)) : null,
      fuel_type: fuel,
      transmission: mapTransmission(spec.transmissionName),
      drive,
      body_type: mapBody(spec.bodyName),
      engine_cc:
        !isEv && spec.displacement != null && Number(spec.displacement) > 200
          ? Math.round(Number(spec.displacement))
          : null,
      color: mapColor(spec.colorName),
      foreign_price: price,
      seats: spec.seatCount != null ? Number(spec.seatCount) : null,
      is_lease: isLease,
    };
  } catch {
    return null;
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
      if (!isEncarRetailSellType(item.SellType)) continue;
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

  // Enrich galleries from detail photos API (list often returns only ~4);
  // also drop any OPERATING_LEASE that slipped past SellType.
  const concurrency = 8;
  let multi = 0;
  const dropLease = new Set<string>();
  console.log(`[encar] enriching galleries for ${out.length} cars (x${concurrency})…`);
  for (let i = 0; i < out.length; i += concurrency) {
    const chunk = out.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const detail = await fetchEncarDetail(row.source_listing_id);
          if (detail?.is_lease) {
            dropLease.add(row.source_listing_id);
            return;
          }
          const gallery = detail?.images || [];
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

  const filtered = dropLease.size
    ? out.filter((r) => !dropLease.has(r.source_listing_id))
    : out;
  console.log(
    `[encar] fetched ${filtered.length}, multi-photo=${multi}, dropped_lease=${dropLease.size}`
  );
  return filtered;
}
