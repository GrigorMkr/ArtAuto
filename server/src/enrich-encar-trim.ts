/**
 * Build Silver-like trim_specs cards for Encar cars from known fields + badge HP.
 * Usage: npx tsx src/enrich-encar-trim.ts
 */
import { loadStore, saveStore } from "./db.js";
import { createPricingContext, estimateVehicleTotal } from "./estimate.js";
import { estimatePowerHp, hpToKw, isTrustedPowerSource, resolveEngineCc } from "./services/powerEstimate.js";
import { buildTrimGroupsFromVehicle, serializeTrimSpecs } from "./services/trimSpecs.js";

async function main() {
  const store = loadStore();
  const ctx = createPricingContext();
  let updated = 0;
  for (const v of store.vehicles) {
    if (v.source !== "encar" || v.status !== "AVAILABLE" || v.foreign_price == null) continue;
    const year = v.year || new Date().getFullYear() - 3;
    const engineCc = resolveEngineCc({
      engine_cc: v.engine_cc,
      trim: v.trim,
      model: v.model,
      brand: v.brand,
    });
    const priorSource =
      typeof v.specifications?.power_source === "string" ? v.specifications.power_source : "";
    const keepListed =
      priorSource === "listed" && v.power_hp != null && v.power_hp > 0 ? v.power_hp : null;
    const power = estimatePowerHp({
      power_hp: keepListed,
      engine_cc: engineCc,
      fuel_type: v.fuel_type || "бензин",
      trim: v.trim,
      brand: v.brand,
      model: v.model,
    });
    const displayHp = isTrustedPowerSource(power.source) ? power.hp : null;
    v.power_hp = displayHp;
    v.power_kw = displayHp != null ? hpToKw(displayHp) : null;
    if (!v.engine_cc && engineCc) v.engine_cc = engineCc;

    const seats =
      v.specifications?.seats != null ? Number(v.specifications.seats) : null;
    const trimGroups = buildTrimGroupsFromVehicle({
      brand: v.brand,
      model: v.model,
      year: v.year,
      body_type: v.body_type,
      engine_cc: v.engine_cc,
      power_hp: displayHp,
      fuel_type: v.fuel_type,
      transmission: v.transmission,
      drive: v.drive,
      trim: v.trim,
      seats: seats && seats > 0 ? seats : null,
      color: v.color,
    });

    const priced = estimateVehicleTotal(
      {
        country: "KR",
        year,
        year_month: v.specifications?.year_month,
        engine_cc: engineCc,
        power_hp: power.hp,
        fuel_type: v.fuel_type || "бензин",
        foreign_price: v.foreign_price,
        foreign_currency: v.foreign_currency || "KRW",
        brand: v.brand,
        model: v.model,
        trim: v.trim,
      },
      ctx
    );
    v.estimated_total_rub = priced.total_rub;
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
      ...(v.specifications?.year_month ? { year_month: v.specifications.year_month } : {}),
      ...(seats && seats > 0 ? { seats } : {}),
      ...(trimGroups.length ? { trim_specs_json: serializeTrimSpecs(trimGroups) } : {}),
    };
    updated += 1;
  }
  saveStore(store);
  console.log(`Encar trim cards: ${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
