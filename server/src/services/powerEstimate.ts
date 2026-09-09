/**
 * Horsepower for customs/recycling.
 * Encar SPEC has no HP — Silver maps trim badges (40i→340) and shows util as approximate.
 * We only treat badge/text/listed as displayable; cc fallback is for util only.
 */

type PowerSource = "listed" | "text" | "badge" | "cc";

/** Import / European badges (order matters — longer / more specific first). */
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
  { re: /\bS\s*580\b/i, hp: 503 },
  { re: /\bS\s*500\b/i, hp: 435 },
  { re: /\bE\s*450\b|\bGLC\s*450\b|\bGLE\s*450\b|\b450\s*4MATIC\b/i, hp: 367 },
  { re: /\bE\s*400\b|\bC\s*400\b|\b400\s*4MATIC\b/i, hp: 330 },
  { re: /\bE\s*350\b|\bC\s*350\b|\b350\s*4MATIC\b/i, hp: 286 },
  { re: /\bE\s*300\b|\bC\s*300\b|\b300\s*4MATIC\b/i, hp: 258 },
  { re: /\bE\s*220\b|\bC\s*220\b|\b220\s*4MATIC\b/i, hp: 194 },
  { re: /\bE\s*200\b|\bC\s*200\b/i, hp: 184 },
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
  // BMW series codes (320i contains "20i" but word-boundary fails — match full codes)
  { re: /\bM340i\b|\b340i\b/i, hp: 374 },
  { re: /\b330i\b/i, hp: 258 },
  { re: /\b320i\b/i, hp: 184 },
  { re: /\b318i\b/i, hp: 156 },
  { re: /\b530i\b/i, hp: 252 },
  { re: /\b520i\b/i, hp: 184 },
  { re: /\b530d\b/i, hp: 286 },
  { re: /\b520d\b/i, hp: 190 },
  { re: /\bX3\b.*\b20i\b|\b20i\b.*\bX3\b/i, hp: 184 },
  { re: /\bX5\b.*\b40i\b|\b40i\b/i, hp: 340 },
  // VW / Audi TDI / TFSI liter forms
  { re: /\b3\.0\s*TDI\b/i, hp: 250 },
  { re: /\b2\.0\s*TDI\b/i, hp: 190 },
  { re: /\b2\.0\s*TSI\b|\b2\.0\s*TFSI\b/i, hp: 190 },
  { re: /\b1\.5\s*TSI\b/i, hp: 150 },
  { re: /\b1\.4\s*TSI\b/i, hp: 150 },
  // Land Rover diesel codes (Encar grade: TD4 / TD6 / TDV6)
  { re: /\b3\.0\s*TD6\b|\bTD6\b/i, hp: 258 },
  { re: /\b2\.7\s*TDV6\b|\bTDV6\b/i, hp: 190 },
  { re: /\b2\.0\s*TD4\b|\bTD4\b/i, hp: 180 },
  { re: /\b3\.0\s*SDV6\b|\bSDV6\b/i, hp: 258 },
  // Mercedes without spaces
  { re: /\bS580\b/i, hp: 503 },
  { re: /\bS500\b/i, hp: 435 },
  { re: /\bCLS450\b|\bE450\b|\bGLE450\b|\bGLC450\b/i, hp: 367 },
  { re: /\bC300\b|\bE300\b/i, hp: 258 },
  { re: /\bC200\b|\bE200\b/i, hp: 184 },
  // Genesis / Hyundai / Kia / GM / Renault turbo badges (Encar: "1.6 Turbo", "1.3 TCe")
  { re: /\b1\.6T\b|\b1\.6\s*(?:T(?:urbo)?|터보)\b/i, hp: 180 },
  { re: /\b1\.5T\b|\b1\.5\s*(?:T(?:urbo)?|터보)\b/i, hp: 170 },
  { re: /\b1\.4T\b|\b1\.4\s*(?:T(?:urbo)?|터보)\b/i, hp: 140 },
  { re: /\b1\.3T\b|\b1\.3\s*(?:T(?:urbo)?|TCe|터보)\b/i, hp: 156 },
  { re: /\b2\.0T\b|\b2\.0\s*(?:T(?:urbo)?|터보)\b|\bTheta\b.*2\.0/i, hp: 245 },
  { re: /\b2\.5T\b|\b2\.5\s*(?:T(?:urbo)?|터보)\b/i, hp: 304 },
  { re: /\b3\.0T\b|\b3\.0\s*(?:T(?:urbo)?|터보)\b/i, hp: 340 },
  { re: /\b3\.5T\b|\b3\.5\s*(?:T(?:urbo)?|터보)\b/i, hp: 380 },
  { re: /\b3\.3T\b|\b3\.3\s*(?:T(?:urbo)?|터보)\b/i, hp: 370 },
  { re: /\b4\.0T\b|\b4\.0\s*(?:T(?:urbo)?|터보)\b/i, hp: 550 },
  { re: /\b5\.2T\b|\b5\.2\s*(?:T(?:urbo)?|터보)\b/i, hp: 450 },
  { re: /\bVS500\b/i, hp: 430 },
  { re: /\b3\.8\b/i, hp: 315 },
  { re: /\b3\.5\b.*?(?:GDi|Smartstream|Lambda|가솔린|Gasoline)/i, hp: 294 },
  // Porsche / Tesla / Volvo
  { re: /\bTurbo\s*S\b/i, hp: 650 },
  { re: /\bGTS\b/i, hp: 480 },
  { re: /\b4S\b/i, hp: 443 },
  { re: /\bCarrera\s*S\b/i, hp: 450 },
  { re: /\bPlaid\b/i, hp: 1020 },
  { re: /\bPerformance\b/i, hp: 462 },
  { re: /\bLong\s*Range\b/i, hp: 670 },
  { re: /\bT8\b/i, hp: 405 },
  { re: /\bT6\b/i, hp: 300 },
  { re: /\bT5\b/i, hp: 250 },
  { re: /\bB5\b/i, hp: 250 },
  { re: /\bB6\b/i, hp: 300 },
  { re: /\bD5\b/i, hp: 235 },
];

/**
 * Korean NA / diesel trims by liters + fuel (Encar grade like "2.5 가솔린", "1.7 디젤").
 * Typical Smartstream / CRDi outputs — same approach Silver uses for catalog cards.
 */
function hpFromKrLiterFuel(blob: string, fuelHint: string): number | null {
  const diesel =
    /디젤|diesel|e-?VGT|CRDi/i.test(blob) || /дизель|diesel/i.test(fuelHint);
  const hybrid =
    /하이브리드|hybrid|HEV|PHEV|전기/i.test(blob) || /гибрид|hybrid/i.test(fuelHint);
  const lpg = /LPG|엘피지/i.test(blob) || /LPG/i.test(fuelHint);
  // Only real turbo markers — NOT TDI/TD4/Tech/TCe (those are badges or NA).
  const turbo =
    /(?:^|[^\d])(\d)[.,](\d)\s*(?:Turbo|터보|TCe)\b/i.test(blob) ||
    /(?:^|[^\d])(\d)[.,](\d)\s*T(?:\b|(?=[^A-Za-z]))/i.test(blob);
  if (turbo) return null; // handled by BADGE_HP

  const litM =
    blob.match(/(?:^|[^\d])(\d)[.,](\d)\s*(?:L|리터|가솔린|Gasoline|디젤|Diesel|LPG)?/i) ||
    blob.match(/\b(\d)[.,](\d)\b/);
  if (!litM) return null;
  const lit = Number(`${litM[1]}.${litM[2]}`);
  if (!(lit >= 0.8 && lit <= 6.5)) return null;

  if (hybrid) {
    if (lit <= 1.6) return 141;
    if (lit <= 2.0) return 195;
    if (lit <= 2.5) return 230;
    return 245;
  }
  if (diesel) {
    if (lit <= 1.6) return 136;
    if (lit <= 1.7) return 141;
    if (lit <= 2.0) return 186;
    if (lit <= 2.2) return 202;
    if (lit <= 3.0) return 250;
    return 280;
  }
  if (lpg) {
    if (lit <= 2.0) return 146;
    if (lit <= 3.0) return 235;
    return 280;
  }
  // Gasoline NA — Hyundai/Kia/Genesis common
  if (lit <= 1.0) return 76;
  if (lit <= 1.2) return 84;
  if (lit <= 1.4) return 100;
  if (lit <= 1.6) return 123;
  if (lit <= 1.8) return 147;
  if (lit <= 2.0) return 160;
  if (lit <= 2.4) return 184;
  if (lit <= 2.5) return 198;
  if (lit <= 3.0) return 249;
  if (lit <= 3.3) return 290;
  if (lit <= 3.5) return 294;
  if (lit <= 3.8) return 315;
  if (lit <= 5.0) return 430;
  return 450;
}

/** Model-specific overrides when liters alone are ambiguous. */
const MODEL_HP: Array<{ re: RegExp; hp: number }> = [
  { re: /Palisade.*2\.2|2\.2.*Palisade/i, hp: 202 },
  { re: /Santa\s*Fe.*2\.2|2\.2.*Santa/i, hp: 202 },
  { re: /Sorento.*2\.2|2\.2.*Sorento/i, hp: 202 },
  { re: /Staria.*2\.2|2\.2.*Staria|Lounge.*Staria|Staria.*Diesel/i, hp: 177 },
  { re: /Canival|Carnival/i, hp: 202 },
  { re: /Grandeur.*2\.5|2\.5.*Grandeur|GN7.*2\.5|Grandeur.*Exclusive|Grandeur.*Le Blanc|Grandeur.*HG/i, hp: 198 },
  { re: /K8.*1\.6|K8.*Signature|K8.*Noblesse/i, hp: 180 },
  { re: /K8.*2\.5|2\.5.*K8/i, hp: 198 },
  { re: /Sonata.*2\.0|DN8.*2\.0|2\.0.*Sonata/i, hp: 160 },
  { re: /Sonata.*1\.7|1\.7.*Sonata|LF.*1\.7/i, hp: 141 },
  { re: /AVANTE.*1\.6|Elantra.*1\.6|1\.6.*AVANTE/i, hp: 123 },
  { re: /Tucson.*1\.6\s*T|1\.6\s*T.*Tucson|Tucson.*Diesel/i, hp: 180 },
  { re: /Sportage.*1\.6\s*T|Sportage.*Diesel/i, hp: 186 },
  { re: /morning|Morning|Ray\b/i, hp: 76 },
  { re: /TIBOLI|Tivoli/i, hp: 123 },
  { re: /G70.*2\.0\s*T|2\.0\s*T.*G70/i, hp: 245 },
  { re: /G80.*2\.5\s*T|2\.5\s*T.*G80/i, hp: 304 },
  { re: /GV70.*2\.5\s*T|2\.5\s*T.*GV70/i, hp: 304 },
  { re: /GV80.*3\.5\s*T|3\.5\s*T.*GV80/i, hp: 380 },
  { re: /Ioniq\s*5|IONIQ5/i, hp: 217 },
  { re: /Ioniq\s*6/i, hp: 228 },
  { re: /EV6/i, hp: 229 },
  { re: /EV9/i, hp: 283 },
  { re: /Casper|CASPER|Inster/i, hp: 76 },
  { re: /e-tron.*55|55.*e-tron|e-tron.*Sportback/i, hp: 408 },
  { re: /\be-tron\b/i, hp: 360 },
  { re: /ID\.?4|ID4/i, hp: 204 },
  { re: /ID\.?3|ID3/i, hp: 204 },
  { re: /ID\.?6|ID6/i, hp: 230 },
  { re: /XC40.*(?:Twin|Recharge|Electric)|(?:Twin|Recharge).*XC40/i, hp: 408 },
  { re: /C40.*(?:Twin|Recharge)|(?:Twin|Recharge).*C40/i, hp: 408 },
  { re: /I-?PACE|EV400/i, hp: 400 },
  { re: /Atto\s*3|Yuan\s*Plus/i, hp: 204 },
  { re: /Seal\b.*BYD|BYD.*Seal/i, hp: 313 },
  { re: /Dolphin/i, hp: 177 },
  { re: /Model\s*3.*Plaid|Plaid.*Model\s*3/i, hp: 460 },
  { re: /Model\s*3.*Performance|Performance.*Model\s*3/i, hp: 450 },
  { re: /Model\s*3/i, hp: 283 },
  { re: /Model\s*Y.*Plaid|Plaid.*Model\s*Y/i, hp: 460 },
  { re: /Model\s*Y.*Performance|Performance.*Model\s*Y/i, hp: 450 },
  { re: /Model\s*Y/i, hp: 299 },
  { re: /Model\s*S/i, hp: 670 },
  { re: /Model\s*X/i, hp: 670 },
  { re: /\bSU7\b/i, hp: 299 },
  { re: /\bNIO\b.*ET5|ET5/i, hp: 490 },
  { re: /\bNIO\b.*ET7|ET7/i, hp: 653 },
  { re: /Lexus.*ES|ES.*Luxury/i, hp: 218 },
  { re: /Arteon|Tiguan.*TDI|Passat.*TDI/i, hp: 190 },
  { re: /Touareg.*3\.0|3\.0.*Touareg|A8.*3\.0\s*TDI/i, hp: 250 },
  { re: /Mini.*Cooper|Cooper.*Mini/i, hp: 136 },
  { re: /Altima.*2\.5|2\.5.*Altima|2\.5\s*Tech/i, hp: 182 },
  { re: /Trailblazer.*1\.3|1\.3.*Trailblazer/i, hp: 156 },
  { re: /\bSM6\b.*1\.3|1\.3.*\bSM6\b|1\.3\s*TCe/i, hp: 156 },
  { re: /F-?150.*Raptor|Raptor.*5\.2/i, hp: 450 },
  { re: /McLaren.*\bGT\b|\bGT\b.*McLaren/i, hp: 620 },
  { re: /Bentley.*4\.0|4\.0.*Bentley|Continental.*GT/i, hp: 550 },
  { re: /GV60/i, hp: 314 },
  { re: /\biX1\b/i, hp: 313 },
  { re: /\bEQA\b/i, hp: 190 },
  { re: /\bEQB\b/i, hp: 228 },
  { re: /\bEQE\b/i, hp: 292 },
  { re: /\bEQS\b/i, hp: 333 },
  { re: /\bi4\b/i, hp: 286 },
  { re: /\biX\b/i, hp: 326 },
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
  const liters =
    text.match(/\b(\d)\.(\d)\s*[LlTtТт터보]/) ||
    text.match(/\b(\d),(\d)\s*(?:가솔린|Gasoline|디젤|Diesel|L)?/i) ||
    text.match(/\b(\d)\.(\d)\s*(?:가솔린|Gasoline|디젤|Diesel)/i);
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

/**
 * Last-resort util estimate by displacement.
 * Tuned to common KR NA engines (2.0→160, 2.5→198) — not a fake “catalog” HP.
 */
function byDisplacement(engineCc: number, fuel: string): number {
  const diesel = /дизель|diesel/i.test(fuel);
  const hybrid = /гибрид|hybrid|DM-?i|HEV|PHEV/i.test(fuel);
  if (/электро|electric|EV|BEV/i.test(fuel)) {
    if (engineCc <= 0) return 217;
  }
  if (engineCc <= 1000) return hybrid ? 100 : 76;
  if (engineCc <= 1400) return diesel ? 90 : hybrid ? 105 : 100;
  if (engineCc <= 1600) return diesel ? 136 : hybrid ? 141 : 123;
  if (engineCc <= 1800) return diesel ? 141 : hybrid ? 150 : 147;
  if (engineCc <= 2000) return diesel ? 186 : hybrid ? 195 : 160;
  if (engineCc <= 2200) return diesel ? 202 : 184;
  if (engineCc <= 2500) return diesel ? 202 : hybrid ? 230 : 198;
  if (engineCc <= 3000) return diesel ? 250 : hybrid ? 245 : 249;
  if (engineCc <= 3500) return diesel ? 280 : 294;
  if (engineCc <= 4000) return 320;
  return 400;
}

/** Whether catalog may show this HP as a spec (not cc-only guess). */
export function isTrustedPowerSource(source: PowerSource) {
  return source === "listed" || source === "badge" || source === "text";
}

export function estimatePowerHp(params: {
  power_hp?: number | null;
  engine_cc?: number | null;
  fuel_type?: string;
  trim?: string;
  brand?: string;
  model?: string;
}): { hp: number; estimated: boolean; source: PowerSource } {
  if (params.power_hp != null && params.power_hp > 0) {
    return { hp: Math.round(params.power_hp), estimated: false, source: "listed" };
  }

  const fromText = parsePowerHpFromText(params.brand, params.model, params.trim);
  if (fromText) return { hp: fromText, estimated: false, source: "text" };

  const litHint =
    params.engine_cc && params.engine_cc > 200
      ? `${(Math.round(params.engine_cc / 100) / 10).toFixed(1)}L`
      : "";
  const blob = [params.brand, params.model, params.trim, litHint].filter(Boolean).join(" ");
  for (const row of MODEL_HP) {
    if (row.re.test(blob)) return { hp: row.hp, estimated: false, source: "badge" };
  }
  for (const row of BADGE_HP) {
    if (row.re.test(blob)) return { hp: row.hp, estimated: false, source: "badge" };
  }

  const fuel = params.fuel_type || "";
  const isEv =
    /электро|electric|\bEV\b|BEV/i.test(fuel) &&
    !/гибрид|hybrid|бензин|дизель|gasoline|diesel/i.test(fuel);

  // Never invent ICE displacement → HP for pure EV.
  // If model unknown — mid EV (~280 л.с.) so util/акциз never fall into льгота by accident.
  if (isEv) {
    return { hp: 280, estimated: true, source: "cc" };
  }

  const fromLit = hpFromKrLiterFuel(blob, fuel);
  if (fromLit) return { hp: fromLit, estimated: false, source: "badge" };

  const cc =
    (params.engine_cc && params.engine_cc > 0
      ? params.engine_cc
      : parseEngineCcFromText(params.trim, params.model)) || 2000;
  return { hp: byDisplacement(cc, fuel), estimated: true, source: "cc" };
}

export function resolveEngineCc(params: {
  engine_cc?: number | null;
  trim?: string;
  model?: string;
  brand?: string;
  fuel_type?: string;
}): number {
  const fuel = params.fuel_type || "";
  const isEv =
    /электро|electric|\bEV\b|BEV/i.test(fuel) &&
    !/гибрид|hybrid|бензин|дизель|gasoline|diesel/i.test(fuel);
  if (isEv) return 0;

  if (params.engine_cc && params.engine_cc > 200) return Math.round(params.engine_cc);
  return parseEngineCcFromText(params.trim, params.model, params.brand) || 2000;
}

export function hpToKw(hp: number) {
  return Math.round(hp * 0.7355 * 100) / 100;
}
