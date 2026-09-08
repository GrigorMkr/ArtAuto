export type PricingInput = {
  vehicle_rub: number;
  foreign_expenses_rub: number;
  broker_rub: number;
  transport_to_vladivostok_rub: number;
  company_fee_rub: number;
  delivery_russia_rub: number;
  customs_total_rub: number;
  recycling_fee_rub: number;
  laboratory_rub?: number;
  extra_rub?: number;
};

export function calculateTotal(p: PricingInput) {
  const breakdown = {
    vehicle_rub: round(p.vehicle_rub),
    foreign_expenses_rub: round(p.foreign_expenses_rub),
    broker_rub: round(p.broker_rub),
    transport_to_vladivostok_rub: round(p.transport_to_vladivostok_rub),
    company_fee_rub: round(p.company_fee_rub),
    delivery_russia_rub: round(p.delivery_russia_rub),
    customs_total_rub: round(p.customs_total_rub),
    recycling_fee_rub: round(p.recycling_fee_rub),
    laboratory_rub: round(p.laboratory_rub ?? 0),
    extra_rub: round(p.extra_rub ?? 0),
  };
  const total_rub = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { breakdown, total_rub };
}

export function foreignPriceToRub(price: number, commercialRatePerUnit: number) {
  return round(price * commercialRatePerUnit);
}

export function round(n: number) {
  return Math.round(n);
}

export const DEFAULT_SETTINGS: Record<string, { value: number; currency: string }> = {
  CN_FOREIGN_EXPENSES_CNY: { value: 16000, currency: "CNY" },
  CN_BROKER_RUB: { value: 70000, currency: "RUB" },
  CN_TO_VLADIVOSTOK_RUB: { value: 15000, currency: "RUB" },
  CN_COMPANY_FEE_RUB: { value: 70000, currency: "RUB" },
  KR_FOREIGN_EXPENSES_KRW: { value: 500000, currency: "KRW" },
  KR_BROKER_RUB: { value: 100000, currency: "RUB" },
  KR_TO_VLADIVOSTOK_RUB: { value: 70000, currency: "RUB" },
  KR_COMPANY_FEE_RUB: { value: 70000, currency: "RUB" },
  DELIVERY_VLADIVOSTOK_UFA_RUB: { value: 190000, currency: "RUB" },
};
