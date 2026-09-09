/** Estimate engine power / displacement when sources omit them. */

const BADGE_HP: Array<{ re: RegExp; hp: number }> = [
  // BMW
  { re: /\bM60i\b|\bM550i\b|\b550i\b/i, hp: 523 },
  { re: /\bM50i\b|\b50i\b/i, hp: 530 },
  { re: /\bM50d\b/i, hp: 381 },
  { re: /\b40i\b/i, hp: 340 },
  { re: /\b35i\b/i, hp: 306 },
  { re: /\b30i\b/i, hp: 252 },
  { re: /\b28i\b/i, hp: 245 },
  { re: /\b25i\b/i, hp: 231 },
  { re: /\b23i\b/i, hp: 204 },
  { re: /\b20i\b|\b18i\b/i, hp: 184 },
  { re: /\b16i\b/i, hp: 136 },
  { re: /\b40d\b/i, hp: 340 },
  { re: /\b30d\b/i, hp: 286 },
  { re: /\b25d\b/i, hp: 231 },
  { re: /\b20d\b/i, hp: 190 },
  { re: /\b18d\b/i, hp: 150 },
  { re: /\b45e\b|\b50e\b/i, hp: 394 },
  { re: /\b530e\b|\b330e\b/i, hp: 292 },
  // Mercedes
  { re: /\bAMG\s*63\b/i, hp: 585 },
  { re: /\bAMG\s*53\b/i, hp: 435 },
  { re: /\bAMG\s*45\b/i, hp: 421 },
  { re: /\bAMG\s*43\b/i, hp: 367 },
  { re: /\bAMG\s*35\b/i, hp: 306 },
  { re: /\bS\s*580\b|\b580\b/i, hp: 503 },
  { re: /\bS\s*500\b|\b500\b(?!\s*e)/i, hp: 435 },
  { re: /\b450\b/i, hp: 367 },
  { re: /\b400\b/i, hp: 330 },
  { re: /\b350\b/i, hp: 286 },
  { re: /\b300\b/i, hp: 258 },
  { re: /\b250\b/i, hp: 204 },
  { re: /\b220\b/i, hp: 194 },
  { re: /\b200\b/i, hp: 184 },
  { re: /\b180\b/i, hp: 156 },
  // Audi
  { re: /\bRS\s*6\b|\bRS6\b/i, hp: 600 },
  { re: /\bRS\s*7\b|\bRS7\b/i, hp: 600 },
  { re: /\bS6\b/i, hp: 444 },
  { re: /\bS5\b/i, hp: 354 },
  { re: /\bS4\b/i, hp: 354 },
  { re: /\b55\s*TFSI\b|\b55\s*TFSIe\b/i, hp: 340 },
  { re: /\b45\s*TFSI\b/i, hp: 265 },
  { re: /\b40\s*TFSI\b/i, hp: 204 },
  { re: /\b35\s*TFSI\b/i, hp: 150 },
  { re: /\b50\s*TDI\b/i, hp: 286 },
  { re: /\b45\s*TDI\b/i, hp: 231 },
  { re: /\b40\s*TDI\b/i, hp: 204 },
  // Genesis / Hyundai / Kia
  { re: /\b3\.5T\b|\b3\.5\s*T\b/i, hp: 380 },
  { re: /\b2\.5[Tt]\b/i, hp: 281 },
  { re: /\b2\.0[Tt]\b/i, hp: 245 },
  { re: /\b1\.6[Tt]\b/i, hp: 180 },
  { re: /\b1\.4[Tt]\b/i, hp: 140 },
  { re: /\b3\.5\b.*?(?:GDi|Smartstream|Lambda)/i, hp: 294 },
  { re: /\b3\.8\b/i, hp: 315 },
  { re: /\b2\.2\b.*?(?:CRDi|디젤)/i, hp: 202 },
  { re: /\bTheta\b.*2\.0/i, hp: 245 },
  // Porsche
  { re: /\bTurbo\s*S\b/i, hp: 650 },
  { re: /\bGTS\b/i, hp: 480 },
  { re: /\b4S\b/i, hp: 443 },
  { re: /\bCarrera\s*S\b/i, hp: 450 },
  // Tesla
  { re: /\bPlaid\b/i, hp: 1020 },
  { re: /\bPerformance\b/i, hp: 462 },
  { re: /\bLong\s*Range\b|\bLR\b/i, hp: 670 },
  // Volvo
  { re: /\bT8\b/i, hp: 405 },
  { re: /\bT6\b/i, hp: 300 },
  { re: /\bT5\b/i, hp: 250 },
  { re: /\bB5\b/i, hp: 250 },
  { re: /\bB6\b/i, hp: 300 },
  { re: /\bD5\b/i, hp: 235 },
];

/** Parse litres → cm³ from titles like 2.5L / 1.5T / 2.0T. */
export function parseEngineCcFromText(...parts: Array<string | null | undefined>): number | null {
  const text = parts.filter(Boolean).join(" ");
  if (!text) return null;
  const ccExact = text.match(/(\d{3,4})\s*(?:см³|cc|CC)\b/);
  if (ccExact) {
    const n = Number(ccExact[1]);
    if (n >= 600 && n <= 8000) return n;
  }
  const liters = text.match(/\b(\d)\.(\d)\s*[LlTtТт]\b/) || text.match(/\b(\d)\.(\d)\s*L\b/i);
  if (liters) {
    const lit = Number(`${liters[1]}.${liters[2]}`);
    if (lit >= 0.6 && lit <= 8) return Math.round(lit * 1000);
  }
  const cnLiters = text.match(/(\d)\.(\d)\s*升/);
  if (cnLiters) {
    const lit = Number(`${cnLiters[1]}.${cnLiters[2]}`);
    if (lit >= 0.6 && lit <= 8) return Math.round(lit * 1000);
  }
  return null;
}

export function parsePowerHpFromText(...parts: Array<string | null | undefined>): number | null {
  const text = parts.filter(Boolean).join(" ");
  if (!text) return null;
  const patterns = [
    /(\d{2,4})\s*(?:л\.?\s*с\.?|лс|PS|hp|HP)\b/i,
    /(\d{2,4})\s*马力/,
    /最大功率[（(]?[^\d]*(\d{2,4})/,
    /功率[：:\s]*(\d{2,4})/,
    /(\d{2,3})\s*kW/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      let n = Number(m[1]);
      if (/kW/i.test(m[0]) && !/л|hp|PS|马力/i.test(m[0])) {
        n = Math.round(n / 0.7355);
      }
      if (n >= 50 && n <= 1500) return n;
    }
  }
  return null;
}

function byDisplacement(engineCc: number, fuel: string): number {
  const diesel = /дизель|diesel/i.test(fuel);
  const hybrid = /гибрид|hybrid|DM-?i|HEV|PHEV/i.test(fuel);
  if (/электро|electric|EV|BEV/i.test(fuel)) {
    if (engineCc <= 0) return 200;
  }
  if (engineCc <= 1000) return hybrid ? 100 : 75;
  if (engineCc <= 1600) return diesel ? 115 : hybrid ? 140 : 130;
  if (engineCc <= 2000) return diesel ? 150 : hybrid ? 180 : 190;
  if (engineCc <= 2500) return diesel ? 190 : hybrid ? 200 : 220;
  if (engineCc <= 3000) return diesel ? 250 : 340;
  if (engineCc <= 4000) return diesel ? 340 : 400;
  return 450;
}

export function estimatePowerHp(params: {
  power_hp?: number | null;
  engine_cc?: number | null;
  fuel_type?: string;
  trim?: string;
  brand?: string;
  model?: string;
}): { hp: number; estimated: boolean; source: "listed" | "text" | "badge" | "cc" } {
  if (params.power_hp != null && params.power_hp > 0) {
    return { hp: Math.round(params.power_hp), estimated: false, source: "listed" };
  }

  const fromText = parsePowerHpFromText(params.brand, params.model, params.trim);
  if (fromText) return { hp: fromText, estimated: true, source: "text" };

  const blob = [params.brand, params.model, params.trim].filter(Boolean).join(" ");
  for (const row of BADGE_HP) {
    if (row.re.test(blob)) return { hp: row.hp, estimated: true, source: "badge" };
  }

  const cc =
    (params.engine_cc && params.engine_cc > 0
      ? params.engine_cc
      : parseEngineCcFromText(params.trim, params.model)) || 2000;
  return { hp: byDisplacement(cc, params.fuel_type || ""), estimated: true, source: "cc" };
}

export function resolveEngineCc(params: {
  engine_cc?: number | null;
  trim?: string;
  model?: string;
  brand?: string;
}): number {
  if (params.engine_cc && params.engine_cc > 200) return Math.round(params.engine_cc);
  return parseEngineCcFromText(params.trim, params.model, params.brand) || 2000;
}

export function hpToKw(hp: number) {
  return Math.round(hp * 0.7355 * 100) / 100;
}
