export type CustomsResult = {
  customs_value_rub: number;
  clearance_fee_rub: number;
  duty_rub: number;
  excise_rub: number;
  vat_rub: number;
  total_rub: number;
  age_band: string;
};

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

/** Silver: 5–7 и старше 7 — ставки «старше 5 лет» (€/см³). */
const AGE_OVER_5: Array<[number | null, number]> = [
  [1000, 3.0],
  [1500, 3.2],
  [1800, 3.5],
  [2300, 4.8],
  [3000, 5.0],
  [null, 5.7],
];

/** Customs clearance fees from 01.01.2026 (PP RF №1638) — matches Silver Auto. */
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

/** Age bands as TKS calculator: <3 / 3–5 / 5–7 / ≥7 (Decision 74). */
export function customsAgeBand(ageYears: number) {
  if (ageYears < 3) return "under_3";
  if (ageYears < 5) return "from_3_to_5";
  if (ageYears < 7) return "from_5_to_7";
  return "over_7";
}

/**
 * Легковой ДВС, физлицо, личное пользование (Silver-like).
 * Единый платёж + таможенный сбор. НДС и акциз = 0 для физлица.
 */
export function personalIceCustoms(params: {
  ageYears: number;
  engineCc: number;
  customsValueRub: number;
  customsValueEur: number;
  eurRub: number;
}): CustomsResult {
  const { ageYears, engineCc, customsValueRub, customsValueEur, eurRub } = params;
  const age_band = customsAgeBand(ageYears);
  let duty: number;

  if (ageYears < 3) {
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
    const byCcDuty = engineCc * minPerCc * eurRub;
    duty = Math.max(byValue, byCcDuty);
  } else if (ageYears < 5) {
    duty = engineCc * byCc(AGE_3_TO_5, engineCc) * eurRub;
  } else {
    // 5–7 и старше 7
    duty = engineCc * byCc(AGE_OVER_5, engineCc) * eurRub;
  }

  const clearance_fee_rub = clearanceFee(customsValueRub);
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
