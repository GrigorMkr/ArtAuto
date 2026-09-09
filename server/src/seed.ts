import { loadStore, saveStore, migrate } from "./db.js";
import { DEFAULT_SETTINGS } from "./services/pricing.js";
import { hashPassword } from "./services/auth.js";

const ADMIN_EMAIL = "admin@artauto.ru";
const ADMIN_PASSWORD = "Admin123!";

/** Only commercial settings + FX — never mock vehicles. Recycling coeffs are code-driven (2026). */
export function seed() {
  migrate();
  const store = loadStore();

  const byKey = new Map(store.price_settings.map((s) => [s.key, s]));
  // Force-align Silver packing for CN fee lines that used to double-count.
  const FORCE_VALUE = new Set([
    "CN_TRANSFER_FEE_RUB",
    "CN_PORT_DELIVERY_RUB",
    "CN_LABORATORY_RUB",
    "CN_FOREIGN_EXPENSES_CNY",
    "CN_BROKER_RUB",
    "CN_FREIGHT_RUB",
    "CN_COMPANY_FEE_RUB",
    "KR_TRANSFER_FEE_RUB",
    "KR_PORT_DELIVERY_RUB",
    "KR_LABORATORY_RUB",
    "KR_COMPANY_FEE_RUB",
  ]);
  for (const [key, meta] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = byKey.get(key);
    if (existing) {
      existing.currency = meta.currency;
      existing.description = meta.description;
      if (FORCE_VALUE.has(key)) existing.value = meta.value;
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

  // Live calc uses services/recycling.ts (PP 1713 / 2026)
  store.recycling_rules = [];
  store.seq.rule = 1;

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
