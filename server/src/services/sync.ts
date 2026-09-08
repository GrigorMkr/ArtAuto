import { importFromEncar, importFromDongchedi, importFromChe168 } from "./importer.js";

let running = false;

export async function syncAllCatalog(opts?: { encar?: number; dongchedi?: number }) {
  if (running) return { skipped: true, reason: "sync already running" };
  running = true;
  const encarLimit = opts?.encar ?? 700;
  const dcdLimit = opts?.dongchedi ?? 500;
  try {
    console.log(`[sync] start Encar=${encarLimit} Dongchedi=${dcdLimit}`);
    const encar = await importFromEncar(encarLimit);
    const dongchedi = await importFromDongchedi(dcdLimit);
    const che168 = await importFromChe168(80);
    const result = {
      at: new Date().toISOString(),
      encar,
      dongchedi,
      che168,
    };
    console.log("[sync] done", JSON.stringify(result));
    return result;
  } finally {
    running = false;
  }
}

/** Run once at boot if catalog is thin, then every 24h. */
export function startDailySync() {
  const boot = async () => {
    const { loadStore } = await import("../db.js");
    const total = loadStore().vehicles.filter((v) => v.source === "encar" || v.source === "dongchedi").length;
    const china = loadStore().vehicles.filter((v) => v.country === "CN").length;
    if (total < 1000 || china < 450) {
      console.log(`[sync] catalog has ${total} live cars (CN=${china}) — filling`);
      await syncAllCatalog({ encar: 700, dongchedi: 500 });
    }
  };

  boot().catch((e) => console.error("[sync] boot failed", e));

  const DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    syncAllCatalog({ encar: 700, dongchedi: 500 }).catch((e) => console.error("[sync] daily failed", e));
  }, DAY_MS);

  console.log("[sync] daily updater scheduled (every 24h)");
}
