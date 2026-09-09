/**
 * Build Silver-like trim_specs for cars missing Dongchedi detail groups (mainly Encar).
 * Usage: npx tsx src/enrich-trim-fallback.ts
 */
import { loadStore, saveStore } from "./db.js";
import { buildTrimGroupsFromVehicle, serializeTrimSpecs } from "./services/trimSpecs.js";

async function main() {
  const store = loadStore();
  let updated = 0;
  for (const v of store.vehicles) {
    if (v.status !== "AVAILABLE") continue;
    if (v.specifications?.trim_specs_json) continue;
    const seats =
      v.specifications?.seats != null ? Number(v.specifications.seats) : null;
    const groups = buildTrimGroupsFromVehicle({
      brand: v.brand,
      model: v.model,
      year: v.year,
      body_type: v.body_type,
      engine_cc: v.engine_cc,
      power_hp: v.power_hp,
      fuel_type: v.fuel_type,
      transmission: v.transmission,
      drive: v.drive,
      trim: v.trim,
      seats: seats && seats > 0 ? seats : null,
      color: v.color,
    });
    if (!groups.length) continue;
    v.specifications = {
      ...(v.specifications || {}),
      trim_specs_json: serializeTrimSpecs(groups),
    };
    updated += 1;
  }
  saveStore(store);
  console.log(`trim fallback updated=${updated}`);
}

main();
