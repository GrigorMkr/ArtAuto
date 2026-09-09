import { loadStore, saveStore, migrate } from "./db.js";
import { DEFAULT_SETTINGS } from "./services/pricing.js";
import { hashPassword } from "./services/auth.js";
import { PREFERENTIAL_POWER_KW } from "./services/recycling.js";

const ADMIN_EMAIL = "admin@artauto.ru";
const ADMIN_PASSWORD = "Admin123!";

function buildRecyclingRules() {
  const pref = PREFERENTIAL_POWER_KW;
  // Preferential personal (≤160 hp): 3400 / 5200
  // Commercial personal (>160 hp): high coefficients by age/cc (approx 2025–2026 bands)
  const rows: Array<{
    age_group: string;
    engine_cc_from: number;
    engine_cc_to: number | null;
    power_kw_from: number;
    power_kw_to: number | null;
    coefficient: number;
  }> = [
    { age_group: "under_3", engine_cc_from: 0, engine_cc_to: null, power_kw_from: 0, power_kw_to: pref, coefficient: 0.17 },
    { age_group: "from_3_to_5", engine_cc_from: 0, engine_cc_to: null, power_kw_from: 0, power_kw_to: pref, coefficient: 0.26 },
    { age_group: "from_5_to_7", engine_cc_from: 0, engine_cc_to: null, power_kw_from: 0, power_kw_to: pref, coefficient: 0.26 },
    { age_group: "over_7", engine_cc_from: 0, engine_cc_to: null, power_kw_from: 0, power_kw_to: pref, coefficient: 0.26 },

    { age_group: "under_3", engine_cc_from: 0, engine_cc_to: 1000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 33.37 },
    { age_group: "under_3", engine_cc_from: 1001, engine_cc_to: 2000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 53.8 },
    { age_group: "under_3", engine_cc_from: 2001, engine_cc_to: 3000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 107.25 },
    { age_group: "under_3", engine_cc_from: 3001, engine_cc_to: null, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 137.11 },

    { age_group: "from_3_to_5", engine_cc_from: 0, engine_cc_to: 1000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 58.7 },
    { age_group: "from_3_to_5", engine_cc_from: 1001, engine_cc_to: 2000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 89.73 },
    { age_group: "from_3_to_5", engine_cc_from: 2001, engine_cc_to: 3000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 138.24 },
    { age_group: "from_3_to_5", engine_cc_from: 3001, engine_cc_to: null, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 179.95 },

    { age_group: "from_5_to_7", engine_cc_from: 0, engine_cc_to: 1000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 58.7 },
    { age_group: "from_5_to_7", engine_cc_from: 1001, engine_cc_to: 2000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 89.73 },
    { age_group: "from_5_to_7", engine_cc_from: 2001, engine_cc_to: 3000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 138.24 },
    { age_group: "from_5_to_7", engine_cc_from: 3001, engine_cc_to: null, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 179.95 },

    { age_group: "over_7", engine_cc_from: 0, engine_cc_to: 1000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 58.7 },
    { age_group: "over_7", engine_cc_from: 1001, engine_cc_to: 2000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 89.73 },
    { age_group: "over_7", engine_cc_from: 2001, engine_cc_to: 3000, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 138.24 },
    { age_group: "over_7", engine_cc_from: 3001, engine_cc_to: null, power_kw_from: pref + 0.01, power_kw_to: null, coefficient: 179.95 },
  ];

  return rows.map((r, i) => ({
    id: i + 1,
    age_group: r.age_group,
    fuel_type: "",
    engine_cc_from: r.engine_cc_from,
    engine_cc_to: r.engine_cc_to,
    power_kw_from: r.power_kw_from,
    power_kw_to: r.power_kw_to,
    base_rate_rub: 20000,
    coefficient: r.coefficient,
    personal_use: 1,
  }));
}

/** Only commercial settings + FX — never mock vehicles. */
export function seed() {
  migrate();
  const store = loadStore();

  // Merge settings: keep existing values, add new keys from defaults
  const byKey = new Map(store.price_settings.map((s) => [s.key, s]));
  for (const [key, meta] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = byKey.get(key);
    if (existing) {
      existing.currency = meta.currency;
      existing.description = meta.description;
    } else {
      store.price_settings.push({
        key,
        value: meta.value,
        currency: meta.currency,
        description: meta.description,
      });
    }
  }

  if (!store.fx_rates.length) {
    store.fx_rates = [
      { code: "CNY", official_rate_rub: 11.8, commercial_markup_pct: 3.5, manual_commercial_rate_rub: null },
      { code: "KRW", official_rate_rub: 0.062, commercial_markup_pct: 4, manual_commercial_rate_rub: null },
      { code: "EUR", official_rate_rub: 98.5, commercial_markup_pct: 2, manual_commercial_rate_rub: null },
      { code: "USD", official_rate_rub: 91.2, commercial_markup_pct: 2, manual_commercial_rate_rub: null },
    ];
  }

  // Always refresh recycling rules to power-aware Silver-like bands
  store.recycling_rules = buildRecyclingRules();
  store.seq.rule = store.recycling_rules.length + 1;

  const before = store.vehicles.length;
  store.vehicles = store.vehicles.filter((v) => v.source !== "demo");

  let admin = store.users.find((u) => u.email === ADMIN_EMAIL);
  if (!admin) {
    admin = {
      id: store.seq.user++,
      created_at: new Date().toISOString(),
      name: "Админ АртАвто",
      email: ADMIN_EMAIL,
      phone: "+79371555522",
      password_hash: hashPassword(ADMIN_PASSWORD),
      token: "",
      token_expires: new Date(0).toISOString(),
      role: "admin",
    };
    store.users.push(admin);
  } else {
    admin.role = "admin";
    admin.password_hash = hashPassword(ADMIN_PASSWORD);
    admin.name = admin.name || "Админ АртАвто";
  }

  saveStore(store);
  return { vehicles: store.vehicles.length, purged: before - store.vehicles.length, admin: ADMIN_EMAIL };
}
