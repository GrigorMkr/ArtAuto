/**
 * Hide Encar lease/rent listings already in the store.
 * 1) Collect Ids from SellType 리스 / 렌트 search feeds
 * 2) Detail-check remaining AVAILABLE encar cars for OPERATING_LEASE
 * Usage: npx tsx src/hide-encar-lease.ts
 */
import { loadStore, saveStore } from "./db.js";
import { fetchEncarDetail } from "./services/sources/encarPublic.js";

async function fetchSellTypeIds(sellType: string): Promise<Set<string>> {
  const ids = new Set<string>();
  const pageSize = 50;
  for (let offset = 0; offset < 20000; offset += pageSize) {
    const q = `(And.Hidden.N._.CarType.A._.SellType.${sellType}.)`;
    const params = new URLSearchParams({
      count: "true",
      q,
      sr: `|ModifiedDate|${offset}|${pageSize}`,
    });
    const url = `https://api.encar.com/search/car/list/general?${params}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Referer: "https://www.encar.com/",
      },
    });
    if (!res.ok) break;
    const data = (await res.json()) as { SearchResults?: Array<{ Id: string }> };
    const page = data.SearchResults || [];
    if (!page.length) break;
    for (const r of page) ids.add(String(r.Id));
    if (page.length < pageSize) break;
    if (offset % 500 === 0) console.log(`[lease-ids] ${sellType} offset=${offset} have=${ids.size}`);
    await new Promise((r) => setTimeout(r, 40));
  }
  return ids;
}

async function main() {
  console.log("Collecting Encar lease/rent listing ids…");
  const [lease, rent] = await Promise.all([fetchSellTypeIds("리스"), fetchSellTypeIds("렌트")]);
  const leaseIds = new Set([...lease, ...rent]);
  console.log(`Lease/rent ids: 리스=${lease.size} 렌트=${rent.size} union=${leaseIds.size}`);

  const store = loadStore();
  let hiddenBySellType = 0;
  for (const v of store.vehicles) {
    if (v.source !== "encar" || v.status !== "AVAILABLE") continue;
    if (leaseIds.has(String(v.source_listing_id))) {
      v.status = "HIDDEN";
      hiddenBySellType += 1;
    }
  }
  console.log(`Hidden by SellType match: ${hiddenBySellType}`);

  const remaining = store.vehicles.filter(
    (v) => v.source === "encar" && v.status === "AVAILABLE"
  );
  console.log(`Detail-checking ${remaining.length} remaining Encar cars for OPERATING_LEASE…`);
  let hiddenByDetail = 0;
  const concurrency = 8;
  for (let i = 0; i < remaining.length; i += concurrency) {
    const chunk = remaining.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (v) => {
        try {
          const d = await fetchEncarDetail(v.source_listing_id);
          if (d?.is_lease) {
            v.status = "HIDDEN";
            hiddenByDetail += 1;
          }
        } catch {
          /* skip */
        }
      })
    );
    if (i % 80 === 0) {
      console.log(
        `detail progress ${Math.min(i + concurrency, remaining.length)}/${remaining.length} hidden=${hiddenByDetail}`
      );
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  saveStore(store);
  console.log(
    `Done. hidden_sellType=${hiddenBySellType} hidden_detail=${hiddenByDetail} total_hidden=${hiddenBySellType + hiddenByDetail}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
