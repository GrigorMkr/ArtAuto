import { loadStore, saveStore } from "../db.js";

const CBR_JSON = "https://www.cbr-xml-daily.ru/daily_json.js";

/**
 * Pull official FX from CBR mirror. Updates official_rate_rub; keeps markup/manual.
 */
export async function refreshOfficialFxRates() {
  const res = await fetch(CBR_JSON, {
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "application/json", "User-Agent": "ArtAuto/1.0" },
  });
  if (!res.ok) throw new Error(`CBR HTTP ${res.status}`);
  const data = (await res.json()) as {
    Valute?: Record<string, { Value: number; Nominal: number }>;
  };
  const valute = data.Valute || {};
  const store = loadStore();
  const map: Record<string, number> = {};
  for (const code of ["USD", "EUR", "CNY", "KRW"] as const) {
    const row = valute[code];
    if (!row) continue;
    map[code] = row.Value / row.Nominal;
  }

  let updated = 0;
  for (const fx of store.fx_rates) {
    if (map[fx.code] != null) {
      fx.official_rate_rub = Math.round(map[fx.code] * 1e6) / 1e6;
      updated += 1;
    }
  }
  // ensure codes exist
  for (const code of ["USD", "EUR", "CNY", "KRW"]) {
    if (!store.fx_rates.find((r) => r.code === code) && map[code] != null) {
      store.fx_rates.push({
        code,
        official_rate_rub: map[code],
        commercial_markup_pct: code === "KRW" ? 4 : code === "CNY" ? 3.5 : 2,
        manual_commercial_rate_rub: null,
      });
      updated += 1;
    }
  }
  saveStore(store);
  return { updated, rates: map, at: new Date().toISOString() };
}

export function startFxRefresh() {
  const run = () =>
    refreshOfficialFxRates()
      .then((r) => console.log("[fx] CBR updated", r.updated, r.at))
      .catch((e) => console.error("[fx] CBR failed", e));
  run();
  setInterval(run, 24 * 60 * 60 * 1000);
}
