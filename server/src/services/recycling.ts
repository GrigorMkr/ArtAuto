import { loadStore, type Store } from "../db.js";

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
    .sort((a, b) => b.id - a.id)[0];

  if (!rule) {
    if (params.ageGroup === "under_3") return 3400;
    return 5200;
  }
  return Math.round(rule.base_rate_rub * rule.coefficient);
}
