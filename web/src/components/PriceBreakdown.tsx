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

  if (!lines.length) return null;

  return (
    <section className="detail-panel breakdown">
      <h3>Итоговая стоимость</h3>
      <p className="price-xl">{formatRub(computedTotal)}</p>
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
          Для физлица НДС и акциз не начисляются отдельно — включены в единый таможенный платёж.
        </p>
      </details>
    </section>
  );
});
