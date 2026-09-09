/**
 * Backfill Encar year_month (YYYYMM) from detail API for TKS age bands.
 * Usage: npx tsx src/backfill-encar-age.ts [limit]
 */
import { loadStore, saveStore } from "./db.js";
import { repriceAllVehicles } from "./services/reprice.js";
import { fetchEncarDetail } from "./services/sources/encarPublic.js";

const limit = Number(process.argv[2] || 2000);

async function main() {
  const store = loadStore();
  const rows = store.vehicles
    .filter((v) => v.source === "encar" && v.status === "AVAILABLE" && !v.specifications?.year_month)
    .slice(0, limit);
  console.log(`Backfilling year_month for ${rows.length} Encar cars…`);
  let updated = 0;
  const concurrency = 8;

  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (v) => {
        try {
          const d = await fetchEncarDetail(v.source_listing_id);
          if (!d?.year_month) return;
          v.specifications = { ...(v.specifications || {}), year_month: d.year_month };
          if (d.engine_cc && !v.engine_cc) v.engine_cc = d.engine_cc;
          if (d.year && !v.year) v.year = d.year;
          updated += 1;
        } catch {
          /* skip */
        }
      })
    );
    if (i % 80 === 0) {
      console.log(`progress ${Math.min(i + concurrency, rows.length)}/${rows.length} updated=${updated}`);
    }
    await new Promise((r) => setTimeout(r, 40));
  }

  saveStore(store);
  console.log(`Saved year_month on ${updated} cars. Repricing…`);
  const r = repriceAllVehicles();
  console.log("reprice", r);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
