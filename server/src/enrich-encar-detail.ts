/**
 * Enrich Encar cars with SPEC/CATEGORY from detail API (cc, fuel, yearMonth, gearbox…).
 * HP is not in Encar SPEC — derived from trim badges after detail fields land.
 * Usage: npx tsx src/enrich-encar-detail.ts [limit]
 */
import { loadStore, saveStore } from "./db.js";
import { createPricingContext, estimateVehicleTotal } from "./estimate.js";
import {
  estimatePowerHp,
  hpToKw,
  isTrustedPowerSource,
  resolveEngineCc,
} from "./services/powerEstimate.js";
import { fetchEncarDetail } from "./services/sources/encarPublic.js";
import { buildTrimGroupsFromVehicle, serializeTrimSpecs } from "./services/trimSpecs.js";

const limit = Number(process.argv[2] || 2000);

async function main() {
  const store = loadStore();
  const pricingCtx = createPricingContext();
  const rows = store.vehicles
    .filter((v) => v.source === "encar" && v.status === "AVAILABLE")
    .slice(0, limit);
  console.log(`Enriching detail for ${rows.length} Encar cars…`);
  let updated = 0;
  let withCc = 0;
  const concurrency = 8;

  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (v) => {
        try {
          const d = await fetchEncarDetail(v.source_listing_id);
          if (!d) return;
          if (d.is_lease) {
            v.status = "HIDDEN";
            updated += 1;
            return;
          }
          let changed = false;
          const set = <K extends keyof typeof v>(key: K, val: (typeof v)[K]) => {
            if (val == null || val === "" || val === v[key]) return;
            (v as Record<string, unknown>)[key as string] = val;
            changed = true;
          };

          if (d.brand) set("brand", d.brand);
          if (d.model && d.model !== "Model") set("model", d.model);
          if (d.trim) set("trim", d.trim);
          if (d.year) set("year", d.year);
          if (d.mileage_km != null) set("mileage_km", d.mileage_km);
          if (d.fuel_type) set("fuel_type", d.fuel_type);
          if (d.transmission) set("transmission", d.transmission);
          if (d.drive) set("drive", d.drive);
          if (d.body_type) set("body_type", d.body_type);
          if (d.engine_cc != null) {
            set("engine_cc", d.engine_cc);
            withCc += 1;
          }
          if (d.color) set("color", d.color);
          if (d.foreign_price != null && !v.foreign_price) set("foreign_price", d.foreign_price);
          if (d.images.length > (v.images?.length || 0)) {
            v.images = [...new Set([...d.images, ...(v.images || [])])].slice(0, 16);
            changed = true;
          }

          const yearMonth = d.year_month || v.specifications?.year_month;
          const seats = d.seats ?? (v.specifications?.seats != null ? Number(v.specifications.seats) : null);

          if (v.foreign_price != null) {
            const engineCc = resolveEngineCc({
              engine_cc: v.engine_cc,
              trim: v.trim,
              model: v.model,
              brand: v.brand,
            });
            const power = estimatePowerHp({
              power_hp: null,
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

            const priced = estimateVehicleTotal(
              {
                country: v.country,
                year: v.year || new Date().getFullYear() - 3,
                engine_cc: engineCc,
                power_hp: power.hp,
                fuel_type: v.fuel_type || "бензин",
                foreign_price: v.foreign_price,
                foreign_currency: v.foreign_currency,
                brand: v.brand,
                model: v.model,
                trim: v.trim,
                year_month: yearMonth,
              },
              pricingCtx
            );
            v.estimated_total_rub = priced.total_rub;

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
              ...(yearMonth ? { year_month: String(yearMonth) } : {}),
              ...(seats && seats > 0 ? { seats } : {}),
              ...(trimGroups.length ? { trim_specs_json: serializeTrimSpecs(trimGroups) } : {}),
            };
            changed = true;
          }

          if (changed) updated += 1;
        } catch {
          /* skip */
        }
      })
    );
    console.log(
      `progress ${Math.min(i + concurrency, rows.length)}/${rows.length} updated=${updated} cc=${withCc}`
    );
    await new Promise((r) => setTimeout(r, 60));
  }

  saveStore(store);
  console.log(`Done. updated=${updated} with_cc=${withCc}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
