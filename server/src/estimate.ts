import { loadStore } from "./db.js";
import { DEFAULT_SETTINGS, calculateTotal, foreignPriceToRub } from "./services/pricing.js";
import { personalIceCustoms, customsAgeBand } from "./services/customs.js";
import {
  calculateRecyclingFee,
  recyclingAgeGroup,
  recyclingExplain,
  recyclingCoefficient,
  PREFERENTIAL_POWER_KW,
  BASE_RECYCLING_RUB,
} from "./services/recycling.js";
import { estimatePowerHp, hpToKw, resolveEngineCc } from "./services/powerEstimate.js";
import { vehicleAgeYears, AGE_BAND_LABELS } from "./services/vehicleAge.js";
import { classifyTksFuel } from "./services/trimSpecs.js";

type Rates = { CNY: number; KRW: number; EUR: number; USD: number };
type SettingsMap = Record<string, number>;

export function commercialRateFromStore(code: string, store = loadStore()) {
  const row = store.fx_rates.find((r) => r.code === code);
  if (!row) return code === "CNY" ? 12.2 : code === "KRW" ? 0.065 : 100;
  if (row.manual_commercial_rate_rub) return row.manual_commercial_rate_rub;
  return row.official_rate_rub * (1 + row.commercial_markup_pct / 100);
}

/** CBR / official rate — used for customs valuation (как у Silver Auto). */
export function officialRateFromStore(code: string, store = loadStore()) {
  const row = store.fx_rates.find((r) => r.code === code);
  if (!row) return code === "CNY" ? 11.8 : code === "KRW" ? 0.062 : code === "EUR" ? 98.5 : 91;
  return row.official_rate_rub;
}

export function loadPricingContext() {
  const store = loadStore();
  const rates: Rates = {
    CNY: commercialRateFromStore("CNY", store),
    KRW: commercialRateFromStore("KRW", store),
    EUR: commercialRateFromStore("EUR", store),
    USD: commercialRateFromStore("USD", store),
  };
  const official_rates: Rates = {
    CNY: officialRateFromStore("CNY", store),
    KRW: officialRateFromStore("KRW", store),
    EUR: officialRateFromStore("EUR", store),
    USD: officialRateFromStore("USD", store),
  };
  const settings: SettingsMap = {};
  for (const [key, meta] of Object.entries(DEFAULT_SETTINGS)) {
    settings[key] = store.price_settings.find((s) => s.key === key)?.value ?? meta.value;
  }
  if (!store.price_settings.find((s) => s.key === "KR_FREIGHT_RUB") && settings.KR_TO_VLADIVOSTOK_RUB) {
    settings.KR_FREIGHT_RUB = settings.KR_TO_VLADIVOSTOK_RUB;
  }
  if (!store.price_settings.find((s) => s.key === "CN_FREIGHT_RUB") && settings.CN_TO_VLADIVOSTOK_RUB) {
    settings.CN_FREIGHT_RUB = settings.CN_TO_VLADIVOSTOK_RUB;
  }
  return { rates, official_rates, settings };
}

export function estimateVehicleTotal(
  car: {
    country: "KR" | "CN";
    year: number;
    engine_cc?: number | null;
    power_hp?: number | null;
    fuel_type: string;
    foreign_price: number;
    foreign_currency: string;
    brand?: string;
    model?: string;
    trim?: string;
    year_month?: string | number | null;
    registration_month?: number | null;
  },
  ctx = loadPricingContext()
) {
  const { rates, settings } = ctx;
  const official = ctx.official_rates ?? rates;
  const rate = rates[car.foreign_currency as keyof Rates] ?? rates.CNY;
  const officialFx = official[car.foreign_currency as keyof Rates] ?? official.CNY;
  // Display / client costs = commercial; customs duty base = official (CBR), like Silver Auto.
  const vehicle_rub = foreignPriceToRub(car.foreign_price, rate);
  const customsValueRub = foreignPriceToRub(car.foreign_price, officialFx);
  const eurRubOfficial = official.EUR;
  const customsValueEur = customsValueRub / eurRubOfficial;

  const ageYears = vehicleAgeYears({
    year: car.year,
    month: car.registration_month,
    yearMonth: car.year_month,
  });
  const tksFuel = classifyTksFuel(car.fuel_type);
  const engineCc = resolveEngineCc({
    engine_cc: car.engine_cc,
    trim: car.trim,
    model: car.model,
    brand: car.brand,
    fuel_type: car.fuel_type,
  });

  const powerInfo = estimatePowerHp({
    power_hp: car.power_hp,
    engine_cc: tksFuel === "electric" ? 0 : engineCc,
    fuel_type: car.fuel_type,
    trim: car.trim,
    brand: car.brand,
    model: car.model,
  });
  const powerHp = powerInfo.hp;
  const powerKw = hpToKw(powerHp);

  const customs = personalIceCustoms({
    ageYears,
    engineCc: tksFuel === "electric" ? 0 : engineCc,
    customsValueRub,
    customsValueEur,
    eurRub: eurRubOfficial,
    fuelType: car.fuel_type,
    tksFuel,
    powerHp,
  });

  const ageGroup = recyclingAgeGroup(ageYears);
  // Recycling: EV ladder vs ICE table (hybrids = ICE by engine cc / power).
  // diesel string unused by recycling except electric — kept for clarity/TKS.
  const fuelType =
    tksFuel === "electric"
      ? "electric"
      : tksFuel === "diesel" || tksFuel === "hybrid_diesel"
        ? "diesel"
        : tksFuel === "hybrid_gas"
          ? "hybrid"
          : "gasoline";

  const recycling = calculateRecyclingFee({
    ageGroup,
    fuelType,
    engineCc: tksFuel === "electric" ? 0 : engineCc,
    powerKw,
    personalUse: true,
  });

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

  const preferential =
    tksFuel === "electric"
      ? powerKw > 0 && powerKw <= 58.84
      : powerKw > 0 && powerKw <= PREFERENTIAL_POWER_KW && engineCc > 0 && engineCc <= 3000;
  const coeff = recyclingCoefficient({
    ageGroup,
    engineCc: tksFuel === "electric" ? 0 : engineCc,
    powerKw,
    fuelType,
  });
  const age_band = customsAgeBand(ageYears);

  return {
    ...priced,
    age_band,
    age_band_label: AGE_BAND_LABELS[age_band] || age_band,
    age_years: Math.round(ageYears * 10) / 10,
    recycling_age_group: ageGroup,
    engine_cc_used: tksFuel === "electric" ? 0 : engineCc,
    power_hp_used: powerHp,
    power_estimated: powerInfo.estimated,
    power_source: powerInfo.source,
    customs_value_rub: customs.customs_value_rub,
    recycling_note: preferential
      ? `Льготный утиль: ${recyclingExplain(BASE_RECYCLING_RUB, coeff, recycling)}. Возраст: ${AGE_BAND_LABELS[age_band]}. Точный расчёт зависит от мощности модификации.`
      : `${BASE_RECYCLING_RUB.toLocaleString("ru-RU")} ₽ × ${coeff}${
          powerInfo.source === "cc"
            ? " · мощность не указана в объявлении — утиль ориентировочный"
            : ` · ${powerHp} л.с.${powerInfo.source === "badge" ? " (по комплектации)" : ""}`
        } · ${AGE_BAND_LABELS[age_band]}. Точный расчёт зависит от мощности конкретной модификации.`,
    rates: { ...rates },
    official_rates: { ...official },
  };
}

export function createPricingContext() {
  return loadPricingContext();
}
