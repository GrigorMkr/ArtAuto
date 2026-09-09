import { classifyTksFuel, type TksFuelClass } from "./trimSpecs.js";

export type CustomsResult = {
  customs_value_rub: number;
  clearance_fee_rub: number;
  duty_rub: number;
  excise_rub: number;
  vat_rub: number;
  total_rub: number;
  age_band: string;
};

/** Decision 107 Annex 2 — ICE under 3 years (max of % and €/cm³). */
const UNDER_3: Array<[number | null, number, number]> = [
  [8500, 54, 2.5],
  [16700, 48, 3.5],
  [42300, 48, 5.5],
  [84500, 48, 7.5],
  [169000, 48, 15],
  [null, 48, 20],
];

const AGE_3_TO_5: Array<[number | null, number]> = [
  [1000, 1.5],
  [1500, 1.7],
  [1800, 2.5],
  [2300, 2.7],
  [3000, 3.0],
  [null, 3.6],
];

/** «Старше 5 лет» — same €/cm³ for TKS 5–7 and ≥7. */
const AGE_OVER_5: Array<[number | null, number]> = [
  [1000, 3.0],
  [1500, 3.2],
  [1800, 3.5],
  [2300, 4.8],
  [3000, 5.0],
  [null, 5.7],
];

/** Customs clearance fees from 01.01.2026 (PP RF №1638). */
const CLEARANCE_FEES: Array<[number | null, number]> = [
  [200000, 1231],
  [450000, 2462],
  [1200000, 4924],
  [2700000, 13541],
  [4200000, 18465],
  [5500000, 21344],
  [10000000, 49240],
  [null, 73860],
];

/** Excise 2026 (₽ per hp) — used for EV СТП (and commercial ICE). */
const EXCISE_PER_HP: Array<[number | null, number]> = [
  [90, 0],
  [150, 64],
  [200, 613],
  [300, 1004],
  [400, 1711],
  [500, 1771],
  [null, 1829],
];

const VAT_RATE = 0.22;
const EV_DUTY_RATE = 0.15;

function byCc(table: Array<[number | null, number]>, engineCc: number) {
  for (const [maxCc, rate] of table) {
    if (maxCc === null || engineCc <= maxCc) return rate;
  }
  throw new Error("cc rule not found");
}

export function clearanceFee(customsValueRub: number) {
  for (const [maxValue, fee] of CLEARANCE_FEES) {
    if (maxValue === null || customsValueRub <= maxValue) return fee;
  }
  throw new Error("clearance fee rule not found");
}

export function exciseByPowerHp(powerHp: number) {
  const hp = Math.max(0, powerHp || 0);
  for (const [maxHp, rate] of EXCISE_PER_HP) {
    if (maxHp === null || hp <= maxHp) return Math.round(hp * rate);
  }
  return 0;
}

/**
 * Age bands for UI / TKS: «не более 3 / 5 / 7 лет» = ≤3 / ≤5 / ≤7 (Decision 74 / 107).
 */
export function customsAgeBand(ageYears: number) {
  if (ageYears <= 3) return "under_3";
  if (ageYears <= 5) return "from_3_to_5";
  if (ageYears <= 7) return "from_5_to_7";
  return "over_7";
}

/**
 * Personal-use customs (физлицо).
 *
 * ICE / diesel / gas-hybrid / diesel-hybrid → единая ставка (ETS), акциз+НДС внутри.
 * Pure EV (8703 80) → СТП: пошлина 15% + акциз по л.с. + НДС 22% (не единая ставка).
 * Parallel hybrids use ICE by engine cm³. Sequential EV-only hybrids need docs → rare.
 */
export function personalIceCustoms(params: {
  ageYears: number;
  engineCc: number;
  customsValueRub: number;
  customsValueEur: number;
  eurRub: number;
  fuelType?: string;
  tksFuel?: TksFuelClass;
  /** Required for accurate EV СТП (excise). */
  powerHp?: number;
}): CustomsResult {
  const { ageYears, engineCc, customsValueRub, customsValueEur, eurRub } = params;
  const age_band = customsAgeBand(ageYears);
  const fuel = params.tksFuel || classifyTksFuel(params.fuelType || "");
  const clearance_fee_rub = clearanceFee(customsValueRub);

  if (fuel === "electric") {
    const duty_rub = Math.round(customsValueRub * EV_DUTY_RATE);
    const excise_rub = exciseByPowerHp(params.powerHp || 0);
    const vat_rub = Math.round((customsValueRub + duty_rub + excise_rub) * VAT_RATE);
    return {
      customs_value_rub: customsValueRub,
      clearance_fee_rub,
      duty_rub,
      excise_rub,
      vat_rub,
      total_rub: clearance_fee_rub + duty_rub + excise_rub + vat_rub,
      age_band,
    };
  }

  // ICE path — gasoline, diesel, hybrid_gas, hybrid_diesel share ETS tables.
  let duty: number;
  if (ageYears <= 3) {
    let percent = 48;
    let minPerCc = 20;
    for (const [maxEur, p, min] of UNDER_3) {
      if (maxEur === null || customsValueEur <= maxEur) {
        percent = p;
        minPerCc = min;
        break;
      }
    }
    const byValue = (customsValueRub * percent) / 100;
    const byCcDuty = Math.max(engineCc, 1) * minPerCc * eurRub;
    duty = Math.max(byValue, byCcDuty);
  } else if (ageYears <= 5) {
    duty = Math.max(engineCc, 1) * byCc(AGE_3_TO_5, engineCc) * eurRub;
  } else {
    duty = Math.max(engineCc, 1) * byCc(AGE_OVER_5, engineCc) * eurRub;
  }

  const duty_rub = Math.round(duty);
  return {
    customs_value_rub: customsValueRub,
    clearance_fee_rub,
    duty_rub,
    excise_rub: 0,
    vat_rub: 0,
    total_rub: clearance_fee_rub + duty_rub,
    age_band,
  };
}
