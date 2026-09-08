import { useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useCalculateMutation } from "../store/apiSlice";
import { formatRub } from "../api";
import { LeadForm } from "../components/LeadForm";
import { Reveal } from "../components/Motion";
import type { CalcResult } from "../types";

const labels: Record<string, string> = {
  vehicle_rub: "Авто в ₽",
  foreign_expenses_rub: "Расходы по стране",
  broker_rub: "Брокер",
  transport_to_vladivostok_rub: "До Владивостока",
  company_fee_rub: "Услуги АртАвто",
  delivery_russia_rub: "Доставка по РФ",
  customs_total_rub: "Таможня",
  recycling_fee_rub: "Утильсбор",
  laboratory_rub: "Лаборатория",
  extra_rub: "Дополнительно",
};

export function CalculatorPage() {
  const [calculate, { isLoading }] = useCalculateMutation();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
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
  }

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
            Курс, расходы, брокер, доставка, услуги АртАвто, таможня и утильсбор — в одной смете.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
      <div className="calc-layout">
        <form className="calc-form" onSubmit={onSubmit}>
          <label>
            Страна
            <select name="country" defaultValue="KR">
              <option value="KR">Корея</option>
              <option value="CN">Китай</option>
            </select>
          </label>
          <label>
            Цена авто (в валюте страны)
            <input name="foreign_price" type="number" required defaultValue={18500000} />
          </label>
          <label>
            Год выпуска
            <input name="year" type="number" required defaultValue={2022} />
          </label>
          <label>
            Объём двигателя, см³
            <input name="engine_cc" type="number" required defaultValue={1598} />
          </label>
          <label>
            Мощность, л.с.
            <input name="power_hp" type="number" defaultValue={150} />
          </label>
          <label>
            Топливо
            <select name="fuel_type" defaultValue="бензин">
              <option value="бензин">бензин</option>
              <option value="дизель">дизель</option>
              <option value="гибрид">гибрид</option>
              <option value="электро">электро</option>
            </select>
          </label>
          <label>
            Доставка по РФ, ₽
            <input name="delivery_city_rub" type="number" defaultValue={190000} />
          </label>
          {error && <p className="err">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Считаем…" : "Рассчитать"}
          </button>
        </form>

        <div className="calc-result">
          {result ? (
            <>
              <p className="eyebrow">Итого</p>
              <p className="price-xl">{formatRub(result.total_rub)}</p>
              <ul className="breakdown-list">
                {Object.entries(result.breakdown).map(([k, v]) => (
                  <li key={k}>
                    <span>{labels[k] || k}</span>
                    <strong>{formatRub(v)}</strong>
                  </li>
                ))}
              </ul>
              <LeadForm
                title="Получить точный расчёт"
                calculationSnapshot={result as unknown as Record<string, unknown>}
              />
            </>
          ) : (
            <p className="muted">Заполните параметры слева — покажем разбивку цены.</p>
          )}
        </div>
      </div>
      </Reveal>
    </>
  );
}
