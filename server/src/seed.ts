import { loadStore, saveStore, migrate } from "./db.js";
import { DEFAULT_SETTINGS } from "./services/pricing.js";
import { hashPassword } from "./services/auth.js";

const ADMIN_EMAIL = "admin@artauto.ru";
const ADMIN_PASSWORD = "Admin123!";

/** Only commercial settings + FX — never mock vehicles. */
export function seed() {
  migrate();
  const store = loadStore();

  store.price_settings = Object.entries(DEFAULT_SETTINGS).map(([key, meta]) => ({
    key,
    value: meta.value,
    currency: meta.currency,
    description: key,
  }));

  store.fx_rates = [
    { code: "CNY", official_rate_rub: 11.8, commercial_markup_pct: 3.5, manual_commercial_rate_rub: null },
    { code: "KRW", official_rate_rub: 0.062, commercial_markup_pct: 4, manual_commercial_rate_rub: null },
    { code: "EUR", official_rate_rub: 98.5, commercial_markup_pct: 2, manual_commercial_rate_rub: null },
    { code: "USD", official_rate_rub: 91.2, commercial_markup_pct: 2, manual_commercial_rate_rub: null },
  ];

  if (store.recycling_rules.length === 0) {
    const rules = [
      ["under_3", 0, 1000, 0.17],
      ["under_3", 1001, 2000, 0.26],
      ["under_3", 2001, 3000, 0.48],
      ["under_3", 3001, null, 0.88],
      ["from_3_to_5", 0, 1000, 0.26],
      ["from_3_to_5", 1001, 2000, 0.26],
      ["from_3_to_5", 2001, null, 0.48],
      ["over_5", 0, null, 0.26],
    ] as const;
    store.recycling_rules = rules.map(([age_group, from, to, coefficient], i) => ({
      id: i + 1,
      age_group,
      fuel_type: "",
      engine_cc_from: from,
      engine_cc_to: to,
      power_kw_from: 0,
      power_kw_to: null,
      base_rate_rub: 20000,
      coefficient,
      personal_use: 1,
    }));
    store.seq.rule = rules.length + 1;
  }

  // purge leftover mock rows only
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
