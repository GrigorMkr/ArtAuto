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
        const data = await calculate({
          country,
          foreign_price: Number(fd.get("foreign_price")),
          foreign_currency: country === "CN" ? "CNY" : "KRW",
          year: Number(fd.get("year")),
          engine_cc: Number(fd.get("engine_cc")),
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
      </Helmet>

      <Reveal>
        <section className="page-intro">
          <p className="eyebrow">Калькулятор</p>
          <h1>Бесплатный расчёт под ключ</h1>
          <p className="lede">
            Возрастная группа, курс, расходы, таможня (единый платёж для физлица), утильсбор по
            мощности и доставка — в одной смете.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="calc-layout">
          <CalculatorForm error={error} isLoading={isLoading} onSubmit={onSubmit} />
          <div className="calc-result">
            <CalculatorResult result={result} />
          </div>
        </div>
      </Reveal>
    </>
  );
}
