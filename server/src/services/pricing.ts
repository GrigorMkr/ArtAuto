export type PricingInput = {
  vehicle_rub: number;
  foreign_expenses_rub: number;
  transfer_fee_rub?: number;
  port_delivery_rub?: number;
  freight_rub?: number;
  /** @deprecated use freight_rub */
  transport_to_vladivostok_rub?: number;
  customs_fee_rub?: number;
  customs_duty_rub?: number;
  /** @deprecated use customs_fee + customs_duty */
  customs_total_rub?: number;
  excise_rub?: number;
  vat_rub?: number;
  recycling_fee_rub: number;
  broker_rub: number;
  laboratory_rub?: number;
  company_fee_rub: number;
  delivery_russia_rub: number;
  extra_rub?: number;
};

export type PricingBreakdown = {
  vehicle_rub: number;
  foreign_expenses_rub: number;
  transfer_fee_rub: number;
  port_delivery_rub: number;
  freight_rub: number;
  customs_fee_rub: number;
  customs_duty_rub: number;
  excise_rub: number;
  vat_rub: number;
  recycling_fee_rub: number;
  broker_rub: number;
  laboratory_rub: number;
  company_fee_rub: number;
  delivery_russia_rub: number;
  extra_rub: number;
  /** legacy alias kept for old UI */
  transport_to_vladivostok_rub: number;
  customs_total_rub: number;
};

export function calculateTotal(p: PricingInput) {
  const freight = round(p.freight_rub ?? p.transport_to_vladivostok_rub ?? 0);
  const customsFee = round(p.customs_fee_rub ?? 0);
  const customsDuty = round(
    p.customs_duty_rub ?? Math.max(0, (p.customs_total_rub ?? 0) - customsFee)
  );

  const breakdown: PricingBreakdown = {
    vehicle_rub: round(p.vehicle_rub),
    foreign_expenses_rub: round(p.foreign_expenses_rub),
    transfer_fee_rub: round(p.transfer_fee_rub ?? 0),
    port_delivery_rub: round(p.port_delivery_rub ?? 0),
    freight_rub: freight,
    customs_fee_rub: customsFee,
    customs_duty_rub: customsDuty,
    excise_rub: round(p.excise_rub ?? 0),
    vat_rub: round(p.vat_rub ?? 0),
    recycling_fee_rub: round(p.recycling_fee_rub),
    broker_rub: round(p.broker_rub),
    laboratory_rub: round(p.laboratory_rub ?? 0),
    company_fee_rub: round(p.company_fee_rub),
    delivery_russia_rub: round(p.delivery_russia_rub),
    extra_rub: round(p.extra_rub ?? 0),
    transport_to_vladivostok_rub: freight,
    customs_total_rub: customsFee + customsDuty,
  };

  const total_rub =
    breakdown.vehicle_rub +
    breakdown.foreign_expenses_rub +
    breakdown.transfer_fee_rub +
    breakdown.port_delivery_rub +
    breakdown.freight_rub +
    breakdown.customs_fee_rub +
    breakdown.customs_duty_rub +
    breakdown.excise_rub +
    breakdown.vat_rub +
    breakdown.recycling_fee_rub +
    breakdown.broker_rub +
    breakdown.laboratory_rub +
    breakdown.company_fee_rub +
    breakdown.delivery_russia_rub +
    breakdown.extra_rub;

  return { breakdown, total_rub };
}

export function foreignPriceToRub(price: number, commercialRatePerUnit: number) {
  return round(price * commercialRatePerUnit);
}

export function round(n: number) {
  return Math.round(n);
}

export const DEFAULT_SETTINGS: Record<string, { value: number; currency: string; description: string }> = {
  // Silver: ¥ расходы уже включают банк/доки/доставку в порт; отдельно transfer/port/lab = 0.
  CN_FOREIGN_EXPENSES_CNY: { value: 16000, currency: "CNY", description: "Расходы в Китае (банк/доки/порт)" },
  CN_TRANSFER_FEE_RUB: { value: 0, currency: "RUB", description: "Комиссия за перевод (CN, в расходах ¥)" },
  CN_PORT_DELIVERY_RUB: { value: 0, currency: "RUB", description: "Доставка до порта (CN, в расходах ¥)" },
  CN_FREIGHT_RUB: { value: 15000, currency: "RUB", description: "Фрахт / до Владивостока (CN)" },
  CN_BROKER_RUB: { value: 70000, currency: "RUB", description: "Брокер (CN, вкл. СБКТС/ЭПТС)" },
  CN_LABORATORY_RUB: { value: 0, currency: "RUB", description: "СБКТС / ЭПТС (CN, в брокере)" },
  CN_COMPANY_FEE_RUB: { value: 50000, currency: "RUB", description: "Услуги АртАвто (CN)" },
  // ₩500 000 у Silver уже включает комиссии/банк/доставку в порт — отдельные строки = 0.
  KR_FOREIGN_EXPENSES_KRW: { value: 500000, currency: "KRW", description: "Расходы в Корее" },
  KR_TRANSFER_FEE_RUB: { value: 0, currency: "RUB", description: "Комиссия за перевод (KR, в расходах ₩)" },
  KR_PORT_DELIVERY_RUB: { value: 0, currency: "RUB", description: "Доставка до порта (KR, в расходах ₩)" },
  KR_FREIGHT_RUB: { value: 70000, currency: "RUB", description: "Фрахт / до Владивостока (KR)" },
  KR_BROKER_RUB: { value: 100000, currency: "RUB", description: "Брокер (KR, вкл. СБКТС/ЭПТС)" },
  KR_LABORATORY_RUB: { value: 0, currency: "RUB", description: "СБКТС / ЭПТС (KR, в брокере)" },
  KR_COMPANY_FEE_RUB: { value: 50000, currency: "RUB", description: "Услуги АртАвто (KR)" },
  DELIVERY_VLADIVOSTOK_UFA_RUB: { value: 190000, currency: "RUB", description: "Доставка по РФ до Уфы" },
  // legacy aliases (kept for old store rows)
  CN_TO_VLADIVOSTOK_RUB: { value: 15000, currency: "RUB", description: "legacy → CN_FREIGHT_RUB" },
  KR_TO_VLADIVOSTOK_RUB: { value: 70000, currency: "RUB", description: "legacy → KR_FREIGHT_RUB" },
};

/** Display order for UI breakdown (Silver-like). */
export const BREAKDOWN_ORDER = [
  "vehicle_rub",
  "foreign_expenses_rub",
  "transfer_fee_rub",
  "port_delivery_rub",
  "freight_rub",
  "customs_fee_rub",
  "customs_duty_rub",
  "excise_rub",
  "vat_rub",
  "recycling_fee_rub",
  "broker_rub",
  "laboratory_rub",
  "company_fee_rub",
  "delivery_russia_rub",
] as const;

export const BREAKDOWN_LABELS: Record<string, string> = {
  vehicle_rub: "Цена автомобиля",
  foreign_expenses_rub: "Расходы в стране",
  transfer_fee_rub: "Комиссия за перевод денег",
  port_delivery_rub: "Доставка до порта",
  freight_rub: "Фрахт / морская доставка",
  transport_to_vladivostok_rub: "Фрахт / морская доставка",
  customs_fee_rub: "Таможенный сбор",
  customs_duty_rub: "Таможенная пошлина (единый платёж)",
  customs_total_rub: "Таможенные платежи",
  excise_rub: "Акциз",
  vat_rub: "НДС",
  recycling_fee_rub: "Утилизационный сбор",
  broker_rub: "Брокерские услуги",
  laboratory_rub: "СБКТС / ЭПТС / лаборатория",
  company_fee_rub: "Услуги АртАвто",
  delivery_russia_rub: "Доставка по России",
  extra_rub: "Дополнительно",
};
