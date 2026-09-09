import { loadStore, saveStore } from "../db.js";
import { createPricingContext, estimateVehicleTotal } from "../estimate.js";
import { estimatePowerHp, hpToKw, resolveEngineCc, isTrustedPowerSource } from "./powerEstimate.js";
import { classifyTksFuel } from "./trimSpecs.js";

/** Recalculate estimated_total_rub + breakdown for all priced vehicles. */
export function repriceAllVehicles() {
  const store = loadStore();
  const ctx = createPricingContext();
  let updated = 0;
  for (const v of store.vehicles) {
    if (v.foreign_price == null) continue;
    const year = v.year || new Date().getFullYear() - 3;
    const yearMonth = v.specifications?.year_month;
    const tks = classifyTksFuel(v.fuel_type || "");
    if (tks === "electric" && v.engine_cc) v.engine_cc = null;

    const engineCc = resolveEngineCc({
      engine_cc: v.engine_cc,
      trim: v.trim,
      model: v.model,
      brand: v.brand,
      fuel_type: v.fuel_type,
    });
    // Never invent cc onto the vehicle record.
    if (tks !== "electric" && !v.engine_cc && engineCc && v.engine_cc !== engineCc) {
      // only fill if we parsed from trim text, not default 2000 alone without trim hint
      if (v.trim || v.model) {
        /* keep listed null; estimate uses resolved */
      }
    }

    const priorSource =
      typeof v.specifications?.power_source === "string" ? v.specifications.power_source : "";
    const keepListed =
      priorSource === "listed" && v.power_hp != null && v.power_hp > 0
        ? v.power_hp
        : null;
    const power = estimatePowerHp({
      power_hp: keepListed,
      engine_cc: tks === "electric" ? 0 : engineCc,
      fuel_type: v.fuel_type || "",
      trim: v.trim,
      brand: v.brand,
      model: v.model,
    });

    if (isTrustedPowerSource(power.source)) {
      v.power_hp = power.hp;
      v.power_kw = hpToKw(power.hp);
    } else if (tks === "electric") {
      // keep existing listed EV power if any
      if (!(v.power_hp != null && v.power_hp > 0)) {
        v.power_hp = null;
        v.power_kw = null;
      }
    } else {
      v.power_hp = null;
      v.power_kw = null;
    }

    const priced = estimateVehicleTotal(
      {
        country: v.country,
        year,
        engine_cc: tks === "electric" ? 0 : engineCc,
        power_hp: v.power_hp,
        fuel_type: v.fuel_type || "",
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
    const keepTrim = v.specifications?.trim_specs_json;
    v.specifications = {
      ...priced.breakdown,
      customs_value_rub: priced.customs_value_rub,
      recycling_note: priced.recycling_note,
      age_band: priced.age_band,
      age_band_label: priced.age_band_label,
      age_years: priced.age_years,
      power_hp_used: priced.power_hp_used,
      power_source: power.source,
      power_estimated: power.source === "cc" ? 1 : 0,
      engine_cc_used: priced.engine_cc_used,
      ...(keepYm != null ? { year_month: keepYm } : {}),
      ...(seats != null ? { seats } : {}),
      ...(keepTrim != null ? { trim_specs_json: keepTrim } : {}),
    };
    updated += 1;
  }
  saveStore(store);
  return { updated, total: store.vehicles.length };
}
