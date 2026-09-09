import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useCalculateMutation } from "../store/apiSlice";
import { Reveal } from "../components/Motion";
import { CalculatorForm } from "../components/calculator/CalculatorForm";
import { CalculatorResult } from "../components/calculator/CalculatorResult";
import type { CalcResult } from "../types";

export function CalculatorPage() {
  const [calculate, { isLoading }] = useCalculateMutation();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState("");

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      const fd = new FormData(e.currentTarget);
      const country = String(fd.get("country") || "KR") as "KR" | "CN";
      try {
        const year = Number(fd.get("year"));
        const month = Number(fd.get("month") || 7);
        const year_month = `${year}${String(month).padStart(2, "0")}`;
        const data = await calculate({
          country,
          foreign_price: Number(fd.get("foreign_price")),
          foreign_currency: country === "CN" ? "CNY" : "KRW",
          year,
          year_month,
          engine_cc: Number(fd.get("engine_cc") || 0),
          power_hp: Number(fd.get("power_hp") || 150),
          fuel_type: String(fd.get("fuel_type") || "бензин"),
          delivery_city_rub: Number(fd.get("delivery_city_rub") || 190000),
        }).unwrap();
        setResult(data);
      } catch {
        setError("Не удалось посчитать. Проверьте введённые данные.");
      }
    },
    [calculate]
  );

  return (
    <>
      <Helmet>
        <title>Калькулятор — АртАвто</title>
        <meta
          name="description"
          content="Бесплатный расчёт стоимости авто из Кореи и Китая под ключ: таможня, утиль, логистика."
        />
      </Helmet>

      <Reveal>
        <header className="page-hero page-hero--compact">
          <div className="page-hero__copy">
            <p className="eyebrow">Калькулятор</p>
            <h1>Расчёт под ключ</h1>
            <p className="page-hero__lede">
              Возраст — по году и месяцу, как на TKS: до 3 / 3–5 / 5–7 / старше 7 лет. Пошлина и утиль зависят от
              топлива, объёма и мощности.
            </p>
          </div>
          <aside className="page-hero__aside page-hero__aside--slim" aria-hidden>
            <p className="page-hero__aside-label">Учитываем</p>
            <ul className="page-hero__aside-list">
              <li>Бензин · дизель · гибрид · электро</li>
              <li>Таможня и утильсбор</li>
              <li>Логистика и услуги</li>
            </ul>
          </aside>
        </header>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="calc-stage">
          <CalculatorForm error={error} isLoading={isLoading} onSubmit={onSubmit} />
          <div className={`calc-result-panel${result ? " is-ready" : ""}`}>
            <CalculatorResult result={result} />
          </div>
        </div>
      </Reveal>
    </>
  );
}
