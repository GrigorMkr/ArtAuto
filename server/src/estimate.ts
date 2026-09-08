import { loadStore } from "./db.js";
import { DEFAULT_SETTINGS, calculateTotal, foreignPriceToRub } from "./services/pricing.js";
import { personalIceCustoms } from "./services/customs.js";
import { calculateRecyclingFee } from "./services/recycling.js";

type Rates = { CNY: number; KRW: number; EUR: number; USD: number };
type SettingsMap = Record<string, number>;

function commercialRateFromStore(code: string, store = loadStore()) {
  const row = store.fx_rates.find((r) => r.code === code);
  if (!row) return code === "CNY" ? 12.2 : code === "KRW" ? 0.065 : 100;
  if (row.manual_commercial_rate_rub) return row.manual_commercial_rate_rub;
  return row.official_rate_rub * (1 + row.commercial_markup_pct / 100);
}

function loadPricingContext() {
  const store = loadStore();
  const rates: Rates = {
    CNY: commercialRateFromStore("CNY", store),
    KRW: commercialRateFromStore("KRW", store),
    EUR: commercialRateFromStore("EUR", store),
    USD: commercialRateFromStore("USD", store),
  };
  const settings: SettingsMap = {};
  for (const [key, meta] of Object.entries(DEFAULT_SETTINGS)) {
    settings[key] = store.price_settings.find((s) => s.key === key)?.value ?? meta.value;
  }
  return { rates, settings, recycling_rules: store.recycling_rules };
}

function ageGroup(year: number) {
  const age = new Date().getFullYear() - year;
  if (age <= 3) return "under_3";
  if (age <= 5) return "from_3_to_5";
  return "over_5";
}

export function estimateVehicleTotal(
  car: {
    country: "KR" | "CN";
    year: number;
    engine_cc: number;
    power_hp: number;
    fuel_type: string;
    foreign_price: number;
    foreign_currency: string;
  },
  ctx = loadPricingContext()
) {
  const { rates, settings, recycling_rules } = ctx;
  const rate = rates[car.foreign_currency as keyof Rates] ?? rates.CNY;
  const eurRub = rates.EUR;
  const vehicle_rub = foreignPriceToRub(car.foreign_price, rate);
  const customsValueEur = vehicle_rub / eurRub;
  const ageYears = new Date().getFullYear() - car.year;
  const engineCc = Math.max(car.engine_cc || 1500, 1);

  const customs = personalIceCustoms({
    ageYears,
    engineCc,
    customsValueRub: vehicle_rub,
    customsValueEur,
    eurRub,
  });

  const recycling = calculateRecyclingFee(
    {
      ageGroup: ageGroup(car.year),
      fuelType: car.fuel_type.includes("дизель")
        ? "diesel"
        : car.fuel_type.includes("электро")
          ? "electric"
          : "gasoline",
      engineCc,
      powerKw: Math.round((car.power_hp || 100) * 0.7355),
    },
    recycling_rules
  );

  const foreignExpenses =
    car.country === "CN"
      ? foreignPriceToRub(settings.CN_FOREIGN_EXPENSES_CNY, rates.CNY)
      : foreignPriceToRub(settings.KR_FOREIGN_EXPENSES_KRW, rates.KRW);

  return calculateTotal({
    vehicle_rub,
    foreign_expenses_rub: foreignExpenses,
    broker_rub: settings[car.country === "CN" ? "CN_BROKER_RUB" : "KR_BROKER_RUB"],
    transport_to_vladivostok_rub:
      settings[car.country === "CN" ? "CN_TO_VLADIVOSTOK_RUB" : "KR_TO_VLADIVOSTOK_RUB"],
    company_fee_rub: settings[car.country === "CN" ? "CN_COMPANY_FEE_RUB" : "KR_COMPANY_FEE_RUB"],
    delivery_russia_rub: settings.DELIVERY_VLADIVOSTOK_UFA_RUB,
    customs_total_rub: customs.total_rub,
    recycling_fee_rub: recycling,
  });
}

export function createPricingContext() {
  return loadPricingContext();
}
