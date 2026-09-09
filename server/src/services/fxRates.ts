import { loadStore, saveStore } from "../db.js";

const CBR_JSON = "https://www.cbr-xml-daily.ru/daily_json.js";
/** Silent poll — CBR usually changes once/day; we still check every minute. */
const FX_INTERVAL_MS = 60_000;

export type FxPulse = {
  fingerprint: string;
  updated_at: string;
  official: Record<string, number>;
  commercial: Record<string, number>;
};

let lastPulse: FxPulse | null = null;
let refreshRunning = false;

function commercialFromRow(row: {
  official_rate_rub: number;
  commercial_markup_pct: number;
  manual_commercial_rate_rub: number | null;
}) {
  if (row.manual_commercial_rate_rub != null) return row.manual_commercial_rate_rub;
  return row.official_rate_rub * (1 + row.commercial_markup_pct / 100);
}

export function buildFxPulse(store = loadStore()): FxPulse {
  const official: Record<string, number> = {};
  const commercial: Record<string, number> = {};
  for (const row of store.fx_rates) {
    official[row.code] = row.official_rate_rub;
    commercial[row.code] = Math.round(commercialFromRow(row) * 1e8) / 1e8;
  }
  const fingerprint = JSON.stringify({ o: official, c: commercial });
  return {
    fingerprint,
    updated_at: lastPulse?.updated_at || new Date().toISOString(),
    official,
    commercial,
  };
}

export function getFxPulse(): FxPulse {
  const pulse = buildFxPulse();
  if (lastPulse && lastPulse.fingerprint === pulse.fingerprint) {
    return { ...pulse, updated_at: lastPulse.updated_at };
  }
  return pulse;
}

/** Call after manual FX edits so /fx/pulse fingerprint flips immediately. */
export function noteFxStoreChanged() {
  const pulse = buildFxPulse();
  lastPulse = { ...pulse, updated_at: new Date().toISOString() };
  return lastPulse;
}

/**
 * Pull official FX from CBR mirror. Updates official_rate_rub; keeps markup/manual.
 */
export async function refreshOfficialFxRates() {
  const before = buildFxPulse().fingerprint;
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

  let touched = 0;
  for (const fx of store.fx_rates) {
    if (map[fx.code] != null) {
      const next = Math.round(map[fx.code] * 1e6) / 1e6;
      if (fx.official_rate_rub !== next) {
        fx.official_rate_rub = next;
        touched += 1;
      }
    }
  }
  for (const code of ["USD", "EUR", "CNY", "KRW"]) {
    if (!store.fx_rates.find((r) => r.code === code) && map[code] != null) {
      store.fx_rates.push({
        code,
        official_rate_rub: map[code],
        commercial_markup_pct: code === "KRW" ? 5 : code === "CNY" ? 3.5 : 2,
        manual_commercial_rate_rub: null,
      });
      touched += 1;
    }
  }

  const at = new Date().toISOString();
  if (touched > 0) saveStore(store);

  const pulse = buildFxPulse(loadStore());
  const changed = pulse.fingerprint !== before;
  lastPulse = { ...pulse, updated_at: changed || !lastPulse ? at : lastPulse.updated_at };

  return { updated: touched, changed, rates: map, at, pulse: lastPulse };
}

/** Refresh FX; if rates moved — reprice catalog + refresh static JSON. */
export async function refreshFxAndRepriceIfNeeded() {
  if (refreshRunning) return { skipped: true as const };
  refreshRunning = true;
  try {
    const r = await refreshOfficialFxRates();
    if (!r.changed) {
      return { skipped: false as const, ...r, changed: false as const, repriced: 0 };
    }
    const { repriceAllVehicles } = await import("./reprice.js");
    const priced = repriceAllVehicles();
    try {
      const { exportStaticCatalog } = await import("../export-static.js");
      exportStaticCatalog();
    } catch (e) {
      console.error("[fx] static export failed", e);
    }
    console.log(
      `[fx] CBR changed → repriced ${priced.updated} vehicles @ ${r.at}`,
      r.rates
    );
    return { skipped: false as const, ...r, changed: true as const, repriced: priced.updated };
  } finally {
    refreshRunning = false;
  }
}

export function startFxRefresh() {
  const run = () =>
    refreshFxAndRepriceIfNeeded().catch((e) => console.error("[fx] CBR failed", e));
  run();
  setInterval(run, FX_INTERVAL_MS);
  console.log(`[fx] silent CBR poll every ${FX_INTERVAL_MS / 1000}s`);
}
