import { loadStore } from "./db.js";
import { DEFAULT_SETTINGS, calculateTotal, foreignPriceToRub } from "./services/pricing.js";
import { personalIceCustoms, customsAgeBand } from "./services/customs.js";
import {
  calculateRecyclingFee,
  recyclingAgeGroup,
  recyclingExplain,
  PREFERENTIAL_POWER_KW,
} from "./services/recycling.js";

type Rates = { CNY: number; KRW: number; EUR: number; USD: number };
type SettingsMap = Record<string, number>;

export function commercialRateFromStore(code: string, store = loadStore()) {
  const row = store.fx_rates.find((r) => r.code === code);
  if (!row) return code === "CNY" ? 12.2 : code === "KRW" ? 0.065 : 100;
  if (row.manual_commercial_rate_rub) return row.manual_commercial_rate_rub;
  return row.official_rate_rub * (1 + row.commercial_markup_pct / 100);
}

export function loadPricingContext() {
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
  // legacy freight fallbacks
  if (!store.price_settings.find((s) => s.key === "KR_FREIGHT_RUB") && settings.KR_TO_VLADIVOSTOK_RUB) {
    settings.KR_FREIGHT_RUB = settings.KR_TO_VLADIVOSTOK_RUB;
  }
  if (!store.price_settings.find((s) => s.key === "CN_FREIGHT_RUB") && settings.CN_TO_VLADIVOSTOK_RUB) {
    settings.CN_FREIGHT_RUB = settings.CN_TO_VLADIVOSTOK_RUB;
  }
  return { rates, settings, recycling_rules: store.recycling_rules };
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
  const ageYears = Math.max(0, new Date().getFullYear() - car.year);
  const engineCc = Math.max(car.engine_cc || 1500, 1);
  const powerHp = car.power_hp || 150;
  const powerKw = Math.round(powerHp * 0.7355 * 100) / 100;

  const customs = personalIceCustoms({
    ageYears,
    engineCc,
    customsValueRub: vehicle_rub,
    customsValueEur,
    eurRub,
  });

  const ageGroup = recyclingAgeGroup(ageYears);
  const fuelType = car.fuel_type.includes("дизель")
    ? "diesel"
    : car.fuel_type.includes("электро")
      ? "electric"
      : car.fuel_type.includes("гибрид")
        ? "hybrid"
        : "gasoline";

  const recycling = calculateRecyclingFee(
    {
      ageGroup,
      fuelType,
      engineCc,
      powerKw,
      personalUse: true,
    },
    recycling_rules
  );

  const isCn = car.country === "CN";
  const foreignExpenses = isCn
    ? foreignPriceToRub(settings.CN_FOREIGN_EXPENSES_CNY, rates.CNY)
    : foreignPriceToRub(settings.KR_FOREIGN_EXPENSES_KRW, rates.KRW);

  const priced = calculateTotal({
    vehicle_rub,
    foreign_expenses_rub: foreignExpenses,
    transfer_fee_rub: settings[isCn ? "CN_TRANSFER_FEE_RUB" : "KR_TRANSFER_FEE_RUB"] || 0,
    port_delivery_rub: settings[isCn ? "CN_PORT_DELIVERY_RUB" : "KR_PORT_DELIVERY_RUB"] || 0,
    freight_rub:
      settings[isCn ? "CN_FREIGHT_RUB" : "KR_FREIGHT_RUB"] ||
      settings[isCn ? "CN_TO_VLADIVOSTOK_RUB" : "KR_TO_VLADIVOSTOK_RUB"] ||
      0,
    customs_fee_rub: customs.clearance_fee_rub,
    customs_duty_rub: customs.duty_rub,
    excise_rub: customs.excise_rub,
    vat_rub: customs.vat_rub,
    recycling_fee_rub: recycling,
    broker_rub: settings[isCn ? "CN_BROKER_RUB" : "KR_BROKER_RUB"],
    laboratory_rub: settings[isCn ? "CN_LABORATORY_RUB" : "KR_LABORATORY_RUB"] || 0,
    company_fee_rub: settings[isCn ? "CN_COMPANY_FEE_RUB" : "KR_COMPANY_FEE_RUB"],
    delivery_russia_rub: settings.DELIVERY_VLADIVOSTOK_UFA_RUB,
  });

  const preferential = powerKw <= PREFERENTIAL_POWER_KW;
  const coeff = preferential ? (ageGroup === "under_3" ? 0.17 : 0.26) : recycling / 20000;

  return {
    ...priced,
    age_band: customsAgeBand(ageYears),
    recycling_age_group: ageGroup,
    recycling_note: preferential
      ? `Льготный утиль (до 160 л.с.): ${recyclingExplain(20000, coeff, recycling)}. Точный расчёт зависит от мощности модификации.`
      : `Коммерческий утиль: ${recyclingExplain(20000, Math.round(coeff * 100) / 100, recycling)}.`,
    rates: { ...rates },
  };
}

export function createPricingContext() {
  return loadPricingContext();
}
