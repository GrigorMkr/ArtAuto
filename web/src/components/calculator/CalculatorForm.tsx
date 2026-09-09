import { memo, useMemo, useState, type FormEvent } from "react";

/** Same bands as TKS / server customsAgeBand. */
function ageBandLabel(year: number, month: number): string {
  const produced = new Date(year, Math.max(0, month - 1), 15);
  const years = Math.max(0, (Date.now() - produced.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 3) return "до 3 лет";
  if (years < 5) return "3–5 лет";
  if (years < 7) return "5–7 лет";
  return "старше 7 лет";
}

type Props = {
  error: string;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export const CalculatorForm = memo(function CalculatorForm({
  error,
  isLoading,
  onSubmit,
}: Props) {
  const [year, setYear] = useState(2022);
  const [month, setMonth] = useState(7);
  const band = useMemo(() => ageBandLabel(year, month), [year, month]);

  return (
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
        <input
          name="year"
          type="number"
          required
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || year)}
        />
      </label>
      <label>
        Месяц регистрации / выпуска
        <select
          name="month"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
      </label>
      <p className="muted" style={{ margin: "-0.35rem 0 0.5rem", fontSize: "0.9rem" }}>
        Возрастная группа (как TKS): <strong>{band}</strong>
      </p>
      <label>
        Объём двигателя, см³
        <input name="engine_cc" type="number" required defaultValue={1598} />
      </label>
      <label>
        Мощность, л.с.
        <input name="power_hp" type="number" defaultValue={150} />
      </label>
      <p className="muted" style={{ margin: "-0.35rem 0 0.5rem", fontSize: "0.85rem" }}>
        Л.с. нужны для утильсбора. На Encar часто нет — укажите вручную или по бейджу
        комплектации (40i, 2.5T…).
      </p>
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
  );
});
