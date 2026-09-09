import { stripCjk } from "./latinNames.js";

/** Structured trim/spec groups for vehicle detail (Silver-like). */

export type TrimSpecRow = { label: string; value: string };
export type TrimSpecGroup = { title: string; rows: TrimSpecRow[] };

export function parseKvPairs(json: unknown): Map<string, string> {
  const map = new Map<string, string>();
  const dig = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const x of node) dig(x);
      return;
    }
    if (typeof node === "object") {
      const o = node as Record<string, unknown>;
      if (typeof o.name === "string" && o.value != null && String(o.value).trim()) {
        map.set(o.name, String(o.value).trim());
      }
      for (const v of Object.values(o)) dig(v);
    }
  };
  dig(json);
  return map;
}

export function kwToHp(kw: number) {
  return Math.round(kw / 0.7355);
}

export function parsePowerFromKv(map: Map<string, string>): number | null {
  for (const [k, v] of map) {
    if (/最大功率|功率|马力/.test(k)) {
      const kw = v.match(/([\d.]+)\s*kW/i);
      if (kw) return kwToHp(Number(kw[1]));
      const hp = v.match(/([\d.]+)\s*(?:Ps|PS|马力|hp)?/i);
      if (hp) {
        const n = Number(hp[1]);
        if (n >= 40 && n <= 1500) return Math.round(n);
      }
    }
  }
  return null;
}

export function parseCcFromKv(map: Map<string, string>): number | null {
  for (const [k, v] of map) {
    if (/排量|发动机/.test(k) || k === "发动机") {
      const cc = v.match(/(\d{3,4})\s*m?l/i) || v.match(/(\d{3,4})/);
      if (cc && /排量/.test(k)) {
        const n = Number(cc[1]);
        if (n >= 600 && n <= 8000) return n;
      }
      const lit = v.match(/(\d)\.(\d)\s*T?/);
      if (lit) {
        const n = Math.round(Number(`${lit[1]}.${lit[2]}`) * 1000);
        if (n >= 600 && n <= 8000) return n;
      }
    }
  }
  // "1.6T" style in engine field
  for (const [k, v] of map) {
    if (/发动机|动力/.test(k)) {
      const lit = v.match(/(\d)\.(\d)\s*T?/i);
      if (lit) return Math.round(Number(`${lit[1]}.${lit[2]}`) * 1000);
    }
  }
  return null;
}

const CN_LABEL: Record<string, string> = {
  上牌时间: "Дата регистрации",
  注册时间: "Дата регистрации",
  首次上牌: "Дата регистрации",
  出厂时间: "Дата производства",
  车级: "Класс авто",
  级别: "Класс авто",
  车身结构: "Тип кузова",
  环保标准: "Экостандарт",
  长宽高: "Д×Ш×В (мм)",
  "长×宽×高(mm)": "Д×Ш×В (мм)",
  "长×宽×高": "Д×Ш×В (мм)",
  长度: "Длина (мм)",
  宽度: "Ширина (мм)",
  高度: "Высота (мм)",
  轴距: "Колёсная база (мм)",
  "轴距(mm)": "Колёсная база (мм)",
  座位数: "Мест",
  "座位数(个)": "Мест",
  发动机: "Двигатель",
  排量: "Объём двигателя",
  "气缸容积(mL)": "Объём двигателя",
  最大功率: "Макс. мощность",
  最大马力: "Макс. мощность (л.с.)",
  "最大马力(Ps)": "Макс. мощность (л.с.)",
  "最大功率(kW)": "Макс. мощность",
  燃料形式: "Вид топлива",
  燃油标号: "Марка топлива",
  综合油耗: "Расход топлива (л/100км)",
  工信部油耗: "Расход топлива (л/100км)",
  百公里油耗: "Расход топлива (л/100км)",
  变速箱: "КПП",
  变速箱类型: "КПП",
  驱动方式: "Привод",
  电动机总功率: "Мощность ЭД",
  电池容量: "Ёмкость батареи",
  续航里程: "Запас хода",
};

function translateCnValue(key: string, value: string): string {
  let v = value.replace(/mm$/i, "").trim();
  if (/燃料形式|能源|燃料/.test(key)) return localizeFuel(v);
  if (/驱动/.test(key)) return localizeDrive(v);
  if (/变速|变速箱/.test(key)) return localizeTransmission(v);
  if (/环保|排放/.test(key) || /国VI|国Ⅵ|欧|Euro/i.test(v)) return localizeEco(v);
  if (/车身结构|车级|级别/.test(key)) return localizeBodyClass(v);
  if (/发动机/.test(key)) {
    return scrubDisplayValue(v.replace(/(\d+)\s*马力/g, "$1 л.с."));
  }
  return scrubDisplayValue(v);
}

/** Map CN / mixed transmission → RU (no hieroglyphs). */
export function localizeTransmission(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/电动车单速|单速变速|固定齿比|减速器|电动.*变速/.test(v)) return "Редуктор (EV)";
  if (/CVT|无级/.test(v)) return "CVT";
  if (/双离合|DCT|干式|湿式/.test(v)) return "Робот (DCT)";
  if (/手动|MT/.test(v) && !/自动/.test(v)) return "Механика";
  if (/9.?挡.?自动|9.*自动/.test(v)) return "9-ступ. АКПП";
  if (/8.?挡.?自动|8.*自动|8挡自动/.test(v)) return "8-ступ. АКПП";
  if (/7.?挡.?自动|7.*自动|7挡自动/.test(v)) return "7-ступ. АКПП";
  if (/6.?挡.?自动|6.*自动|6挡自动/.test(v)) return "6-ступ. АКПП";
  if (/5.?挡.?自动|5.*自动/.test(v)) return "5-ступ. АКПП";
  if (/自动变速箱|手自一体|AMT|自动|AT/.test(v)) return "АКПП";
  if (/автомат|АКПП|CVT|робот|механик|редуктор/i.test(v)) return scrubDisplayValue(v);
  return scrubDisplayValue(stripCjk(v)) || "АКПП";
}

export function localizeFuel(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/纯电|电动|电车|электро|electric|\bEV\b|BEV/i.test(v) && !/混|гибрид|hybrid|油|дизель|бензин/i.test(v))
    return "Электро";
  if (/柴油.*电|电.*柴油|дизель.*гибрид|diesel.*hybrid/i.test(v)) return "Гибрид (дизель)";
  if (/插电|油电|混动|增程|48V|轻混|гибрид|hybrid|DM-?i|HEV|PHEV/i.test(v)) return "Гибрид";
  if (/柴油|дизель|diesel/i.test(v)) return "Дизель";
  if (/汽油|燃油|油车|бензин|gasoline|petrol/i.test(v)) return "Бензин";
  return scrubDisplayValue(v);
}

export function localizeDrive(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/四驱|全时|适时|AWD|4WD|полн/i.test(v)) return "Полный";
  if (/后驱|RWD|задн/i.test(v)) return "Задний";
  if (/前驱|FF|FWD|передн/i.test(v)) return "Передний (FF)";
  return scrubDisplayValue(v);
}

function localizeEco(v: string): string {
  if (/国\s*VI\s*b|国Ⅵ\s*b|国VIb|国Ⅵb|欧\s*6b|Euro\s*6b/i.test(v)) return "Евро 6b";
  if (/国\s*VI|国Ⅵ|欧\s*VI|欧\s*6|Euro\s*6|欧VI/i.test(v)) return "Евро 6";
  if (/国\s*V\b|国Ⅴ|欧\s*V\b|欧V(?!I)|Euro\s*5/i.test(v)) return "Евро 5";
  if (/国\s*IV|国Ⅳ|欧\s*IV|欧IV|Euro\s*4/i.test(v)) return "Евро 4";
  if (/Евро/i.test(v)) return scrubDisplayValue(v);
  return scrubDisplayValue(v);
}

function localizeBodyClass(v: string): string {
  const map: Array<[RegExp, string]> = [
    [/紧凑型SUV/i, "Компактный кроссовер"],
    [/中型SUV/i, "Средний кроссовер"],
    [/中大型SUV|大型SUV/i, "Большой кроссовер"],
    [/小型SUV/i, "Малый кроссовер"],
    [/紧凑型车/i, "Компактный класс"],
    [/中型车/i, "Средний класс"],
    [/中大型车/i, "Бизнес-класс"],
    [/小型车/i, "Малый класс"],
    [/中大型MPV|MPV/i, "Минивэн"],
    [/两厢车|掀背/i, "Хэтчбек"],
    [/三厢车|轿车/i, "Седан"],
    [/SUV/i, "Кроссовер"],
  ];
  for (const [re, ru] of map) {
    if (re.test(v)) return ru;
  }
  return scrubDisplayValue(v);
}

/** Strip leftover CJK — never show hieroglyphs in UI. */
export function scrubDisplayValue(value: string): string {
  let v = String(value || "").trim();
  if (!v) return "";
  v = v
    .replace(/(\d+)\s*马力/g, "$1 л.с.")
    .replace(/纯电动/g, "электро")
    .replace(/插电式混动|油电混动|油电混合|48V轻混系统|48V轻混|轻混/g, "")
    .replace(/电动车单速变速箱|单速变速箱/g, "Редуктор (EV)")
    .replace(/5门5座两厢车|5门5座掀背车/g, "Хэтчбек")
    .replace(/5门7座MPV/g, "Минивэн 7 мест")
    .replace(/中大型MPV/g, "Минивэн")
    .replace(/小型车/g, "Малый класс")
    .replace(/欧IV/gi, "Евро 4")
    .replace(/欧V(?!I)/gi, "Евро 5")
    .replace(/欧VI\s*b?/gi, "Евро 6")
    .replace(/\s+/g, " ")
    .trim();
  if (/[\u3400-\u9fff]/.test(v)) v = stripCjk(v);
  return v.replace(/\s+/g, " ").trim();
}

/** TKS engine types for personal-use calc. */
export type TksFuelClass =
  | "gasoline"
  | "diesel"
  | "hybrid_gas"
  | "hybrid_diesel"
  | "electric";

export function classifyTksFuel(raw: string): TksFuelClass {
  const s = String(raw || "");
  // TKS labels: бензиновый / дизельный / бензиновый и электрический /
  // дизельный и электрический / электрический
  if (
    (/электро|электрическ|electric|\bEV\b|BEV|纯电/i.test(s) &&
      !/гибрид|hybrid|混|бензин|дизель|汽油|柴油|gasoline|diesel/i.test(s)) ||
    (/электрическ/i.test(s) && !/бензин|дизель/i.test(s))
  ) {
    return "electric";
  }
  if (
    /дизель.*электрическ|дизель.*гибрид|гибрид.*дизель|diesel.*hybrid|hybrid.*diesel|柴油.*电|电.*柴油/i.test(
      s
    )
  ) {
    return "hybrid_diesel";
  }
  if (
    /бензин.*электрическ|гибрид|hybrid|DM-?i|HEV|PHEV|混动|插电|增程|48V/i.test(s)
  ) {
    return "hybrid_gas";
  }
  if (/дизель|diesel|柴油/i.test(s)) return "diesel";
  return "gasoline";
}

export function buildTrimGroupsFromKv(map: Map<string, string>): TrimSpecGroup[] {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (map.has(k) && map.get(k)) return { key: k, value: map.get(k)! };
    }
    return null;
  };

  const groups: TrimSpecGroup[] = [];
  const push = (title: string, keys: string[][]) => {
    const rows: TrimSpecRow[] = [];
    for (const ks of keys) {
      const hit = pick(...ks);
      if (!hit) continue;
      const label = CN_LABEL[hit.key] || hit.key;
      let value = translateCnValue(hit.key, hit.value);
      if (/最大功率/.test(hit.key) && /kW/i.test(hit.value)) {
        const kw = Number(hit.value.replace(/[^\d.]/g, ""));
        if (kw > 0) value = `${kwToHp(kw)} л.с.`;
      }
      rows.push({ label, value });
    }
    if (rows.length) groups.push({ title, rows });
  };

  push("Основные", [
    ["车级", "级别"],
    ["环保标准"],
    ["车身结构"],
    ["上牌时间", "注册时间", "首次上牌"],
    ["出厂时间"],
  ]);
  push("Кузов", [
    ["长宽高", "长×宽×高(mm)", "长×宽×高"],
    ["长度"],
    ["宽度"],
    ["高度"],
    ["轴距", "轴距(mm)"],
    ["座位数", "座位数(个)"],
  ]);

  // Silver-style engine line: "1.6T 170 л.с. L4"
  const eng = pick("发动机");
  const pwr = pick("最大马力", "最大马力(Ps)", "最大功率", "最大功率(kW)");
  const engRows: TrimSpecRow[] = [];
  if (eng || pwr) {
    let engVal = eng ? translateCnValue(eng.key, eng.value) : "";
    // OEM often already has "1.6T 170马力 L4"
    if (/马力|л\.с/i.test(engVal)) {
      engVal = engVal.replace(/(\d+)\s*马力/g, "$1 л.с.");
      engRows.push({ label: "Двигатель", value: engVal });
      const vol = engVal.match(/(\d\.\d\s*T)/i)?.[1];
      const hpN = engVal.match(/(\d+)\s*л\.с/);
      if (vol) engRows.push({ label: "Объём двигателя", value: vol });
      if (hpN) engRows.push({ label: "Макс. мощность (л.с.)", value: hpN[1] });
    } else {
      let hpLabel = "";
      if (pwr) {
        if (/kW/i.test(pwr.value)) {
          const kw = Number(pwr.value.replace(/[^\d.]/g, ""));
          if (kw > 0) hpLabel = `${kwToHp(kw)} л.с.`;
        } else {
          hpLabel = translateCnValue(pwr.key, pwr.value);
          if (!/л\.с/.test(hpLabel) && /^\d+/.test(hpLabel)) hpLabel = `${hpLabel.replace(/[^\d.]/g, "")} л.с.`;
        }
      }
      const composed = [engVal, hpLabel].filter(Boolean).join(" ");
      if (composed) engRows.push({ label: "Двигатель", value: composed });
      if (engVal) engRows.push({ label: "Объём двигателя", value: engVal });
      if (hpLabel)
        engRows.push({
          label: "Макс. мощность (л.с.)",
          value: hpLabel.replace(/\s*л\.с\./, ""),
        });
    }
  }
  for (const ks of [
    ["燃料形式"],
    ["燃油标号"],
    ["综合油耗", "工信部油耗", "百公里油耗"],
    ["电动机总功率"],
    ["电池容量"],
    ["续航里程"],
  ] as string[][]) {
    const hit = pick(...ks);
    if (!hit) continue;
    engRows.push({ label: CN_LABEL[hit.key] || hit.key, value: translateCnValue(hit.key, hit.value) });
  }
  if (engRows.length) groups.push({ title: "Двигатель", rows: engRows });

  push("КПП", [["变速箱", "变速箱类型"]]);
  push("Ходовая", [["驱动方式"]]);

  return groups;
}

export function serializeTrimSpecs(groups: TrimSpecGroup[]): string {
  return JSON.stringify(groups);
}

export function deserializeTrimSpecs(raw: unknown): TrimSpecGroup[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as TrimSpecGroup[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Fallback card from already-normalized listing fields (Encar / partial CN). */
export function buildTrimGroupsFromVehicle(v: {
  body_type?: string | null;
  engine_cc?: number | null;
  power_hp?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  drive?: string | null;
  trim?: string | null;
  seats?: number | null;
  year?: number | null;
  color?: string | null;
  brand?: string | null;
  model?: string | null;
}): TrimSpecGroup[] {
  const groups: TrimSpecGroup[] = [];
  const push = (title: string, rows: TrimSpecRow[]) => {
    const clean = rows.filter((r) => r.value);
    if (clean.length) groups.push({ title, rows: clean });
  };

  push("Основные", [
    v.brand ? { label: "Марка", value: v.brand } : null,
    v.model ? { label: "Модель", value: v.model } : null,
    v.year != null ? { label: "Год выпуска", value: String(v.year) } : null,
    v.body_type ? { label: "Тип кузова", value: v.body_type } : null,
    v.color ? { label: "Цвет", value: v.color } : null,
  ].filter(Boolean) as TrimSpecRow[]);

  const engLabel =
    v.trim && /\d\.\d\s*T/i.test(v.trim)
      ? v.trim.match(/\d\.\d\s*T/i)![0]
      : v.engine_cc
        ? `${(v.engine_cc / 1000).toFixed(1)} л`
        : "";
  const eng =
    engLabel && v.power_hp
      ? `${engLabel} ${v.power_hp} л.с.`
      : engLabel || (v.power_hp ? `${v.power_hp} л.с.` : "");

  push("Двигатель", [
    eng ? { label: "Двигатель", value: scrubDisplayValue(eng) } : null,
    v.engine_cc && v.engine_cc > 200 && !/электро/i.test(v.fuel_type || "")
      ? { label: "Объём двигателя", value: `${v.engine_cc} см³` }
      : null,
    v.power_hp ? { label: "Макс. мощность (л.с.)", value: String(v.power_hp) } : null,
    v.fuel_type ? { label: "Вид топлива", value: localizeFuel(v.fuel_type) } : null,
  ].filter(Boolean) as TrimSpecRow[]);

  push("КПП", [
    v.transmission
      ? {
          label: "КПП",
          value: /электро/i.test(v.fuel_type || "")
            ? "Редуктор (EV)"
            : localizeTransmission(v.transmission),
        }
      : null,
  ].filter(Boolean) as TrimSpecRow[]);
  push("Ходовая", [
    v.drive ? { label: "Привод", value: localizeDrive(v.drive) } : null,
  ].filter(Boolean) as TrimSpecRow[]);
  push("Кузов", [
    v.seats != null && v.seats > 0 ? { label: "Мест", value: String(v.seats) } : null,
    v.body_type ? { label: "Тип кузова", value: scrubDisplayValue(v.body_type) } : null,
  ].filter(Boolean) as TrimSpecRow[]);

  return groups;
}
