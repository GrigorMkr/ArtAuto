/**
 * Enrich existing Encar cars with full photo galleries from detail API.
 * Usage: npx tsx src/enrich-encar-photos.ts [limit]
 */
import { loadStore, saveStore } from "./db.js";
import { fetchEncarGallery } from "./services/sources/encarPublic.js";

const limit = Number(process.argv[2] || 1200);

async function main() {
  const store = loadStore();
  const rows = store.vehicles.filter((v) => v.source === "encar" && v.status === "AVAILABLE").slice(0, limit);
  console.log(`Enriching photos for ${rows.length} Encar cars…`);
  let updated = 0;
  const concurrency = 8;
  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (v) => {
        try {
          const gallery = await fetchEncarGallery(v.source_listing_id);
          if (gallery.length > (v.images?.length || 0)) {
            v.images = [...new Set([...gallery, ...(v.images || [])])].slice(0, 16);
            updated += 1;
          }
        } catch {
          /* skip */
        }
      })
    );
    if ((i / concurrency) % 10 === 0) {
      console.log(`progress ${Math.min(i + concurrency, rows.length)}/${rows.length} updated=${updated}`);
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  saveStore(store);
  console.log(`Done. updated=${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
