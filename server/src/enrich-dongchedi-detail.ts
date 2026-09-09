/**
 * Pull real HP / drive / trim card from Dongchedi H5 detail for existing CN cars.
 * Usage: npx tsx src/enrich-dongchedi-detail.ts [limit]
 */
import { loadStore, saveStore } from "./db.js";
import { createPricingContext, estimateVehicleTotal } from "./estimate.js";
import { estimatePowerHp, hpToKw, isTrustedPowerSource, resolveEngineCc } from "./services/powerEstimate.js";
import { fetchDongchediDetail } from "./services/sources/dongchediPublic.js";
import {
  buildTrimGroupsFromVehicle,
  serializeTrimSpecs,
} from "./services/trimSpecs.js";

const limit = Number(process.argv[2] || 2000);

async function main() {
  const store = loadStore();
  const pricingCtx = createPricingContext();
  const rows = store.vehicles
    .filter((v) => v.source === "dongchedi" && v.status === "AVAILABLE")
    .slice(0, limit);
  console.log(`Enriching Dongchedi detail for ${rows.length} cars…`);
  let updated = 0;
  let withPower = 0;
  const concurrency = 6;

  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (v) => {
        try {
          const d = await fetchDongchediDetail(v.source_listing_id);
          if (!d) return;
          let changed = false;

          if (d.power_hp) {
            v.power_hp = d.power_hp;
            v.power_kw = hpToKw(d.power_hp);
            withPower += 1;
            changed = true;
          }
          if (d.engine_cc && (!v.engine_cc || v.engine_cc === 1600)) {
            v.engine_cc = d.engine_cc;
            changed = true;
          }
          if (d.transmission && d.transmission !== v.transmission) {
            v.transmission = d.transmission;
            changed = true;
          }
          if (d.drive && d.drive !== v.drive) {
            v.drive = d.drive;
            changed = true;
          }
          if (d.fuel_type && d.fuel_type !== v.fuel_type) {
            v.fuel_type = d.fuel_type;
            changed = true;
          }
          if (d.year_month) {
            changed = true;
          }
          if (d.images.length > 1) {
            const merged = [...(v.images || []), ...d.images].filter(Boolean);
            const byHash = new Map<string, string>();
            for (const u of merged) {
              const m = u.match(/tos-cn-i-f042mdwyw7\/([a-f0-9]{32})/i);
              const key = m ? m[1].toLowerCase() : u;
              if (!byHash.has(key)) byHash.set(key, u);
            }
            v.images = [...byHash.values()].slice(0, 12);
            changed = true;
          }

          const seats = d.seats ?? (v.specifications?.seats != null ? Number(v.specifications.seats) : null);
          const yearMonth = d.year_month || v.specifications?.year_month || null;
          const trimGroups =
            d.trim_specs.length > 0
              ? d.trim_specs
              : buildTrimGroupsFromVehicle({
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

          if (v.foreign_price != null) {
            const year = v.year || new Date().getFullYear() - 3;
            const engineCc = resolveEngineCc({
              engine_cc: v.engine_cc,
              trim: v.trim,
              model: v.model,
              brand: v.brand,
            });
            const power = estimatePowerHp({
              power_hp: v.power_hp,
              engine_cc: engineCc,
              fuel_type: v.fuel_type || "бензин",
              trim: v.trim,
              brand: v.brand,
              model: v.model,
            });
            const displayHp = isTrustedPowerSource(power.source) ? power.hp : null;
            v.power_hp = displayHp;
            v.power_kw = displayHp != null ? hpToKw(displayHp) : null;

            const priced = estimateVehicleTotal(
              {
                country: "CN",
                year,
                year_month: yearMonth,
                engine_cc: engineCc,
                power_hp: power.hp,
                fuel_type: v.fuel_type || "бензин",
                foreign_price: v.foreign_price,
                foreign_currency: v.foreign_currency || "CNY",
                brand: v.brand,
                model: v.model,
                trim: v.trim,
              },
              pricingCtx
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
              ...(yearMonth ? { year_month: String(yearMonth) } : {}),
              ...(seats != null && seats > 0 ? { seats } : {}),
              ...(trimGroups.length
                ? { trim_specs_json: serializeTrimSpecs(trimGroups) }
                : {}),
            };
            changed = true;
          } else if (trimGroups.length) {
            v.specifications = {
              ...(v.specifications || {}),
              ...(yearMonth ? { year_month: String(yearMonth) } : {}),
              ...(seats != null && seats > 0 ? { seats } : {}),
              trim_specs_json: serializeTrimSpecs(trimGroups),
            };
            changed = true;
          }

          if (changed) updated += 1;
        } catch {
          /* skip */
        }
      })
    );
    if ((i / concurrency) % 8 === 0) {
      console.log(
        `progress ${Math.min(i + concurrency, rows.length)}/${rows.length} updated=${updated} power=${withPower}`
      );
      saveStore(store);
    }
    if (i + concurrency < rows.length) await new Promise((r) => setTimeout(r, 120));
  }

  saveStore(store);
  console.log(`Done. updated=${updated} with_power=${withPower}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
