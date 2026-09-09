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

export type BreakdownKey = (typeof BREAKDOWN_ORDER)[number];

export const BREAKDOWN_LABELS: Record<string, string> = {
  vehicle_rub: "Цена автомобиля",
  foreign_expenses_rub: "Расходы в стране",
  transfer_fee_rub: "Комиссия за перевод денег",
  port_delivery_rub: "Доставка до порта",
  freight_rub: "Фрахт / морская доставка",
  transport_to_vladivostok_rub: "Фрахт / морская доставка",
  customs_fee_rub: "Таможенный сбор",
  customs_duty_rub: "Таможенная пошлина",
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

export const SKIP_SPEC_KEYS = new Set([
  "seats",
  "recycling_note",
  "age_band",
  "age_band_label",
  "age_years",
  "year_month",
  "power_hp_used",
  "power_source",
  "power_estimated",
  "customs_total_rub",
  "customs_value_rub",
  "transport_to_vladivostok_rub",
  "extra_rub",
]);

export type BreakdownLine = { key: string; label: string; value: number };

export function calcLinesFromBreakdown(
  breakdown: Record<string, number | string>
): BreakdownLine[] {
  const lines = BREAKDOWN_ORDER.map((key) => {
    const raw = breakdown[key];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) return null;
    if ((key === "excise_rub" || key === "vat_rub") && n === 0) return null;
    // Hide empty fee rows (KR packs bank/port/lab into ₩500k + broker).
    if (
      (key === "transfer_fee_rub" ||
        key === "port_delivery_rub" ||
        key === "laboratory_rub") &&
      n === 0
    ) {
      return null;
    }
    return { key, label: BREAKDOWN_LABELS[key] || key, value: n };
  }).filter(Boolean) as BreakdownLine[];

  if (!lines.some((l) => l.key === "freight_rub") && breakdown.transport_to_vladivostok_rub != null) {
    const n = Number(breakdown.transport_to_vladivostok_rub);
    if (Number.isFinite(n)) {
      lines.splice(4, 0, {
        key: "freight_rub",
        label: BREAKDOWN_LABELS.freight_rub,
        value: n,
      });
    }
  }

  if (
    !lines.some((l) => l.key === "customs_duty_rub") &&
    breakdown.customs_total_rub != null &&
    !lines.some((l) => l.key === "customs_fee_rub")
  ) {
    const n = Number(breakdown.customs_total_rub);
    if (Number.isFinite(n)) {
      lines.push({
        key: "customs_total_rub",
        label: BREAKDOWN_LABELS.customs_total_rub,
        value: n,
      });
    }
  }

  return lines;
}
