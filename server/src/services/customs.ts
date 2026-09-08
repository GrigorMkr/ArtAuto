export type CustomsResult = {
  customs_value_rub: number;
  clearance_fee_rub: number;
  duty_rub: number;
  total_rub: number;
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

const AGE_OVER_5: Array<[number | null, number]> = [
  [1000, 3.0],
  [1500, 3.2],
  [1800, 3.5],
  [2300, 4.8],
  [3000, 5.0],
  [null, 5.7],
];

const CLEARANCE_FEES: Array<[number | null, number]> = [
  [200000, 1067],
  [450000, 2134],
  [1200000, 4269],
  [2700000, 11746],
  [4200000, 16524],
  [5500000, 21344],
  [7000000, 27540],
  [null, 30000],
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

/** Легковой ДВС, физлицо, личное пользование */
export function personalIceCustoms(params: {
  ageYears: number;
  engineCc: number;
  customsValueRub: number;
  customsValueEur: number;
  eurRub: number;
}): CustomsResult {
  const { ageYears, engineCc, customsValueRub, customsValueEur, eurRub } = params;
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
    const byCcDuty = engineCc * minPerCc * eurRub;
    duty = Math.max(byValue, byCcDuty);
  } else if (ageYears <= 5) {
    duty = engineCc * byCc(AGE_3_TO_5, engineCc) * eurRub;
  } else {
    duty = engineCc * byCc(AGE_OVER_5, engineCc) * eurRub;
  }

  const clearance_fee_rub = clearanceFee(customsValueRub);
  const duty_rub = Math.round(duty);
  return {
    customs_value_rub: customsValueRub,
    clearance_fee_rub,
    duty_rub,
    total_rub: clearance_fee_rub + duty_rub,
  };
}
