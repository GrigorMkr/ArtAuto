import { loadStore, saveStore } from "../db.js";
import { createPricingContext, estimateVehicleTotal } from "../estimate.js";

/** Recalculate estimated_total_rub + breakdown for all priced vehicles. */
export function repriceAllVehicles() {
  const store = loadStore();
  const ctx = createPricingContext();
  let updated = 0;
  for (const v of store.vehicles) {
    if (v.foreign_price == null) continue;
    const year = v.year || new Date().getFullYear() - 3;
    const priced = estimateVehicleTotal(
      {
        country: v.country,
        year,
        engine_cc: v.engine_cc || 1600,
        power_hp: v.power_hp || 150,
        fuel_type: v.fuel_type || "бензин",
        foreign_price: v.foreign_price,
        foreign_currency: v.foreign_currency || (v.country === "CN" ? "CNY" : "KRW"),
      },
      ctx
    );
    v.estimated_total_rub = priced.total_rub;
    const seats = v.specifications?.seats;
    v.specifications = {
      ...priced.breakdown,
      recycling_note: priced.recycling_note,
      age_band: priced.age_band,
      ...(seats != null ? { seats } : {}),
    };
    updated += 1;
  }
  saveStore(store);
  return { updated, total: store.vehicles.length };
}
