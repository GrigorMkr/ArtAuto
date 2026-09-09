/**
 * Enrich Encar cars with SPEC/CATEGORY from detail API (color, gearbox, body, yearMonth, etc.).
 * Usage: npx tsx src/enrich-encar-detail.ts [limit]
 */
import { loadStore, saveStore } from "./db.js";
import { createPricingContext, estimateVehicleTotal } from "./estimate.js";
import { fetchEncarDetail } from "./services/sources/encarPublic.js";

const limit = Number(process.argv[2] || 2000);

async function main() {
  const store = loadStore();
  const pricingCtx = createPricingContext();
  const rows = store.vehicles
    .filter((v) => v.source === "encar" && v.status === "AVAILABLE")
    .slice(0, limit);
  console.log(`Enriching detail for ${rows.length} Encar cars…`);
  let updated = 0;
  const concurrency = 6;

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
          if (d.engine_cc != null) set("engine_cc", d.engine_cc);
          if (d.color) set("color", d.color);
          if (d.foreign_price != null && !v.foreign_price) set("foreign_price", d.foreign_price);
          if (d.images.length > (v.images?.length || 0)) {
            v.images = [...new Set([...d.images, ...(v.images || [])])].slice(0, 16);
            changed = true;
          }
          if (d.year_month) {
            const specs = { ...(v.specifications || {}) };
            if (specs.year_month !== d.year_month) {
              specs.year_month = d.year_month;
              v.specifications = specs;
              changed = true;
            }
          }
          if (d.seats != null) {
            const specs = { ...(v.specifications || {}) };
            if (specs.seats !== d.seats) {
              specs.seats = d.seats;
              v.specifications = specs;
              changed = true;
            }
          }

          if (changed && v.foreign_price != null) {
            const priced = estimateVehicleTotal(
              {
                country: v.country,
                year: v.year || new Date().getFullYear() - 3,
                engine_cc: v.engine_cc,
                power_hp: v.power_hp,
                fuel_type: v.fuel_type || "бензин",
                foreign_price: v.foreign_price,
                foreign_currency: v.foreign_currency,
                brand: v.brand,
                model: v.model,
                trim: v.trim,
                year_month: d.year_month || v.specifications?.year_month,
              },
              pricingCtx
            );
            v.estimated_total_rub = priced.total_rub;
            if (!v.power_hp && priced.power_hp_used) {
              v.power_hp = priced.power_hp_used;
              v.power_kw = Math.round(priced.power_hp_used * 0.7355 * 100) / 100;
            }
            if (!v.engine_cc && priced.engine_cc_used) {
              v.engine_cc = priced.engine_cc_used;
            }
            v.specifications = {
              ...priced.breakdown,
              customs_value_rub: priced.customs_value_rub,
              recycling_note: priced.recycling_note,
              age_band: priced.age_band,
              age_band_label: priced.age_band_label,
              age_years: priced.age_years,
              power_hp_used: priced.power_hp_used,
              ...(d.year_month || v.specifications?.year_month
                ? { year_month: d.year_month || v.specifications?.year_month }
                : {}),
              ...(v.specifications?.seats != null ? { seats: v.specifications.seats } : {}),
            };
          }

          if (changed) updated += 1;
        } catch {
          /* skip */
        }
      })
    );
    console.log(`progress ${Math.min(i + concurrency, rows.length)}/${rows.length} updated=${updated}`);
    await new Promise((r) => setTimeout(r, 60));
  }

  saveStore(store);
  console.log(`Done. updated=${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
