import { loadStore, type Store } from "../db.js";

/** Preferential personal recycling threshold ≈ 160 hp */
export const PREFERENTIAL_POWER_KW = 117.68;

export function recyclingAgeGroup(ageYears: number) {
  if (ageYears < 3) return "under_3";
  if (ageYears < 5) return "from_3_to_5";
  if (ageYears < 7) return "from_5_to_7";
  return "over_7";
}

export function calculateRecyclingFee(
  params: {
    ageGroup: string;
    fuelType?: string;
    engineCc: number;
    powerKw: number;
    personalUse?: boolean;
  },
  rules?: Store["recycling_rules"]
) {
  const personal = params.personalUse === false ? 0 : 1;
  const list = rules ?? loadStore().recycling_rules;
  const rule = list
    .filter(
      (r) =>
        r.age_group === params.ageGroup &&
        r.personal_use === personal &&
        r.engine_cc_from <= params.engineCc &&
        r.power_kw_from <= params.powerKw &&
        (r.engine_cc_to == null || r.engine_cc_to >= params.engineCc) &&
        (r.power_kw_to == null || r.power_kw_to >= params.powerKw) &&
        (r.fuel_type === "" || r.fuel_type === (params.fuelType ?? ""))
    )
    .sort((a, b) => {
      // Prefer more specific power band
      const aPow = a.power_kw_to == null ? 1e9 : a.power_kw_to;
      const bPow = b.power_kw_to == null ? 1e9 : b.power_kw_to;
      return aPow - bPow || b.id - a.id;
    })[0];

  if (!rule) {
    if (params.powerKw <= PREFERENTIAL_POWER_KW) {
      return params.ageGroup === "under_3" ? 3400 : 5200;
    }
    return Math.round(20000 * 33.37);
  }
  return Math.round(rule.base_rate_rub * rule.coefficient);
}

export function recyclingExplain(base: number, coefficient: number, total: number) {
  return `${base.toLocaleString("ru-RU")} ₽ × ${coefficient} = ${total.toLocaleString("ru-RU")} ₽`;
}
