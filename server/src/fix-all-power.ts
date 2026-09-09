/**
 * Reprice + rebuild trim specs so every car gets trusted HP (listed/badge/text).
 * Usage: npx tsx src/fix-all-power.ts
 */
import { loadStore, saveStore } from "./db.js";
import { createPricingContext, estimateVehicleTotal } from "./estimate.js";
import {
  estimatePowerHp,
  hpToKw,
  isTrustedPowerSource,
  resolveEngineCc,
} from "./services/powerEstimate.js";
import { classifyTksFuel, buildTrimGroupsFromVehicle, serializeTrimSpecs } from "./services/trimSpecs.js";

async function main() {
  const store = loadStore();
  const ctx = createPricingContext();
  let trusted = 0;
  let missing = 0;
  const samples: Array<Record<string, unknown>> = [];

  for (const v of store.vehicles) {
    if (v.foreign_price == null || v.status !== "AVAILABLE") continue;
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

    const priorSource =
      typeof v.specifications?.power_source === "string" ? v.specifications.power_source : "";
    const keepListed =
      priorSource === "listed" && v.power_hp != null && v.power_hp > 0 ? v.power_hp : null;

    const power = estimatePowerHp({
      power_hp: keepListed,
      engine_cc: tks === "electric" ? 0 : engineCc,
      fuel_type: v.fuel_type || "",
      trim: v.trim,
      brand: v.brand,
      model: v.model,
    });

    const displayHp = isTrustedPowerSource(power.source) ? power.hp : null;
    v.power_hp = displayHp;
    v.power_kw = displayHp != null ? hpToKw(displayHp) : null;

    if (displayHp != null) trusted += 1;
    else {
      missing += 1;
      if (samples.length < 25) {
        samples.push({
          id: v.id,
          src: v.source,
          brand: v.brand,
          model: v.model,
          trim: v.trim,
          fuel: v.fuel_type,
          power,
        });
      }
    }

    const seats =
      v.specifications?.seats != null ? Number(v.specifications.seats) : null;
    const keepOem =
      typeof v.specifications?.trim_specs_json === "string" &&
      v.source === "dongchedi" &&
      priorSource === "listed"
        ? v.specifications.trim_specs_json
        : null;

    const trimGroups = keepOem
      ? null
      : buildTrimGroupsFromVehicle({
          brand: v.brand,
          model: v.model,
          year: v.year,
          body_type: v.body_type,
          engine_cc: tks === "electric" ? null : v.engine_cc || engineCc,
          power_hp: displayHp,
          fuel_type: v.fuel_type,
          transmission: v.transmission,
          drive: v.drive,
          seats,
          color: v.color,
        });

    const priced = estimateVehicleTotal(
      {
        country: v.country,
        year,
        engine_cc: tks === "electric" ? 0 : engineCc,
        power_hp: displayHp,
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
      ...(yearMonth != null ? { year_month: yearMonth } : {}),
      ...(seats != null ? { seats } : {}),
      ...(keepOem
        ? { trim_specs_json: keepOem }
        : trimGroups
          ? { trim_specs_json: serializeTrimSpecs(trimGroups) }
          : {}),
    };
  }

  saveStore(store);
  console.log(JSON.stringify({ trusted, missing, samples }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
