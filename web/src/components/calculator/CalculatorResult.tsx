import { memo, useMemo } from "react";
import { formatRub } from "../../api";
import { LeadForm } from "../LeadForm";
import { calcLinesFromBreakdown } from "../../lib/priceBreakdown";
import type { CalcResult } from "../../types";

const AGE_LABEL: Record<string, string> = {
  under_3: "до 3 лет",
  from_3_to_5: "3–5 лет",
  from_5_to_7: "5–7 лет",
  over_7: "старше 7 лет",
};

type Props = { result: CalcResult | null };

export const CalculatorResult = memo(function CalculatorResult({ result }: Props) {
  const lines = useMemo(
    () => (result ? calcLinesFromBreakdown(result.breakdown) : []),
    [result]
  );

  if (!result) {
    return (
      <div className="calc-empty">
        <p className="eyebrow">Результат</p>
        <h2>Здесь появится смета</h2>
        <p>
          Заполните параметры слева — покажем цену под ключ: авто, расходы, таможню, утиль, брокер и доставку.
        </p>
        <ul className="calc-empty__list">
          <li>Курсы ЦБ для таможни</li>
          <li>Возраст как на TKS</li>
          <li>Разбивка по строкам</li>
        </ul>
      </div>
    );
  }

  const age =
    result.age_band_label ||
    (result.age_band ? AGE_LABEL[result.age_band] || result.age_band : "");

  return (
    <div className="calc-ready">
      <header className="calc-ready__head">
        <p className="eyebrow">Итого{age ? ` · ${age}` : ""}</p>
        <p className="price-xl">{formatRub(result.total_rub)}</p>
        {result.rates ? (
          <p className="calc-ready__rates">
            Курсы: KRW {result.rates.KRW?.toFixed?.(4) ?? result.rates.KRW} · EUR{" "}
            {result.rates.EUR?.toFixed?.(2) ?? result.rates.EUR}
            {result.rates.CNY != null ? ` · CNY ${Number(result.rates.CNY).toFixed(2)}` : ""}
          </p>
        ) : null}
      </header>

      <details className="price-reveal" open>
        <summary>Из чего складывается цена</summary>
        <ul className="breakdown-list">
          {lines.map((l) => (
            <li key={l.key}>
              <span>{l.label}</span>
              <strong>{formatRub(l.value)}</strong>
            </li>
          ))}
        </ul>
        <div className="breakdown-total">
          <span>Итого</span>
          <strong>{formatRub(result.total_rub)}</strong>
        </div>
      </details>

      {result.recycling_note ? <p className="calc-ready__note">{result.recycling_note}</p> : null}

      <LeadForm
        title="Получить точный расчёт"
        calculationSnapshot={result as unknown as Record<string, unknown>}
      />
    </div>
  );
});
