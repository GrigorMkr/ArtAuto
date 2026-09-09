import { loadStore, saveStore } from "../db.js";
import { createPricingContext, estimateVehicleTotal } from "../estimate.js";
import { estimatePowerHp, hpToKw, resolveEngineCc } from "./powerEstimate.js";

/** Recalculate estimated_total_rub + breakdown for all priced vehicles. */
export function repriceAllVehicles() {
  const store = loadStore();
  const ctx = createPricingContext();
  let updated = 0;
  for (const v of store.vehicles) {
    if (v.foreign_price == null) continue;
    const year = v.year || new Date().getFullYear() - 3;
    const yearMonth = v.specifications?.year_month;
    const engineCc = resolveEngineCc({
      engine_cc: v.engine_cc,
      trim: v.trim,
      model: v.model,
      brand: v.brand,
    });
    if (!v.engine_cc && engineCc) v.engine_cc = engineCc;

    const power = estimatePowerHp({
      power_hp: v.power_hp,
      engine_cc: engineCc,
      fuel_type: v.fuel_type || "бензин",
      trim: v.trim,
      brand: v.brand,
      model: v.model,
    });
    if (!v.power_hp) {
      v.power_hp = power.hp;
      v.power_kw = hpToKw(power.hp);
    }

    const priced = estimateVehicleTotal(
      {
        country: v.country,
        year,
        engine_cc: engineCc,
        power_hp: v.power_hp,
        fuel_type: v.fuel_type || "бензин",
        foreign_price: v.foreign_price,
        foreign_currency: v.foreign_currency || (v.country === "CN" ? "CNY" : "KRW"),
        brand: v.brand,
        model: v.model,
        trim: v.trim,
        year_month: yearMonth,
      },
      ctx
    );
    v.estimated_total_rub = priced.total_rub;
    const seats = v.specifications?.seats;
    const keepYm = v.specifications?.year_month;
    v.specifications = {
      ...priced.breakdown,
      customs_value_rub: priced.customs_value_rub,
      recycling_note: priced.recycling_note,
      age_band: priced.age_band,
      age_band_label: priced.age_band_label,
      age_years: priced.age_years,
      power_hp_used: priced.power_hp_used,
      power_source: power.source,
      power_estimated: power.estimated ? 1 : 0,
      ...(keepYm != null ? { year_month: keepYm } : {}),
      ...(seats != null ? { seats } : {}),
    };
    updated += 1;
  }
  saveStore(store);
  return { updated, total: store.vehicles.length };
}
