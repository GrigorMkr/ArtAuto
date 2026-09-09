import { memo, useMemo } from "react";
import { formatRub } from "../api";
import {
  BREAKDOWN_LABELS,
  BREAKDOWN_ORDER,
  SKIP_SPEC_KEYS,
  calcLinesFromBreakdown,
} from "../lib/priceBreakdown";

export { BREAKDOWN_LABELS, BREAKDOWN_ORDER, calcLinesFromBreakdown };
export { SKIP_SPEC_KEYS as SKIP };

type Props = {
  specs: Record<string, number | string>;
  totalRub?: number | null;
  defaultOpen?: boolean;
  note?: string;
};

export const PriceBreakdown = memo(function PriceBreakdown({
  specs,
  totalRub,
  defaultOpen,
  note,
}: Props) {
  const lines = useMemo(() => calcLinesFromBreakdown(specs), [specs]);

  const computedTotal = useMemo(
    () => totalRub ?? lines.reduce((a, l) => a + l.value, 0),
    [totalRub, lines]
  );

  const tip =
    note || (typeof specs.recycling_note === "string" ? specs.recycling_note : "") || "";
  const ageLabel =
    (typeof specs.age_band_label === "string" && specs.age_band_label) ||
    (typeof specs.age_band === "string" ? specs.age_band : "");
  const customsValue =
    typeof specs.customs_value_rub === "number"
      ? specs.customs_value_rub
      : Number(specs.customs_value_rub);
  const hasCustomsValue = Number.isFinite(customsValue) && customsValue > 0;

  if (!lines.length) return null;

  return (
    <section className="detail-panel breakdown">
      <h3>Итоговая стоимость</h3>
      <p className="price-xl">{formatRub(computedTotal)}</p>
      {ageLabel ? <p className="eyebrow">Таможня · возраст {ageLabel}</p> : null}
      <details className="price-reveal" open={defaultOpen}>
        <summary>Подробнее — из чего складывается цена</summary>
        <ul>
          {lines.map((l) => (
            <li key={l.key}>
              <span>{l.label}</span>
              <strong>{formatRub(l.value)}</strong>
            </li>
          ))}
        </ul>
        {hasCustomsValue ? (
          <p className="muted" style={{ marginTop: "0.65rem", fontSize: "0.85rem" }}>
            Таможенная стоимость (офиц. курс ЦБ): {formatRub(customsValue)} — база для пошлины и
            сбора, отдельно в итог не входит.
          </p>
        ) : null}
        <div className="breakdown-total">
          <span>Итого</span>
          <strong>{formatRub(computedTotal)}</strong>
        </div>
        {tip ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            {tip}
          </p>
        ) : null}
        <p className="muted" style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
          Бензин / дизель / гибрид (ДВС): единый таможенный платёж по возрасту и объёму (акциз и НДС
          внутри). Электро: СТП — пошлина 15% + акциз по мощности + НДС 22%. Возраст как на TKS: до
          3 / 3–5 / 5–7 / старше 7 лет. Мощность для утиля — из комплектации.
        </p>
      </details>
    </section>
  );
});
