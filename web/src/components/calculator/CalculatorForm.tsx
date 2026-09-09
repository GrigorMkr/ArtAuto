import { memo, useMemo, useState, type FormEvent } from "react";

/** Same bands as server customsAgeBand (≤3 / ≤5 / ≤7). */
function ageBandLabel(year: number, month: number): string {
  const produced = new Date(year, Math.max(0, month - 1), 15);
  const years = Math.max(0, (Date.now() - produced.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (years <= 3) return "до 3 лет";
  if (years <= 5) return "3–5 лет";
  if (years <= 7) return "5–7 лет";
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
  const [fuel, setFuel] = useState("бензин");
  const band = useMemo(() => ageBandLabel(year, month), [year, month]);
  const isEv = /электро/i.test(fuel);

  return (
    <form className="calc-form calc-form--rich" onSubmit={onSubmit}>
      <header className="calc-form__head">
        <h2>Параметры автомобиля</h2>
        <p>Данные с Encar / Dongchedi или из ПТС — для ориентира под ключ.</p>
      </header>

      <fieldset className="calc-fieldset">
        <legend>Лот</legend>
        <div className="calc-fields">
          <label>
            Страна
            <select name="country" defaultValue="KR">
              <option value="KR">Корея (₩)</option>
              <option value="CN">Китай (¥)</option>
            </select>
          </label>
          <label>
            Цена авто
            <input name="foreign_price" type="number" required defaultValue={18500000} min={1} />
          </label>
        </div>
      </fieldset>

      <fieldset className="calc-fieldset">
        <legend>Возраст</legend>
        <div className="calc-fields">
          <label>
            Год выпуска
            <input
              name="year"
              type="number"
              required
              min={1990}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || year)}
            />
          </label>
          <label>
            Месяц
            <select name="month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="calc-hint">
          Группа TKS: <strong>{band}</strong>
        </p>
      </fieldset>

      <fieldset className="calc-fieldset">
        <legend>Двигатель</legend>
        <div className="calc-fields">
          <label>
            Топливо
            <select
              name="fuel_type"
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
            >
              <option value="бензин">Бензин</option>
              <option value="дизель">Дизель</option>
              <option value="гибрид">Гибрид (бензин)</option>
              <option value="гибрид (дизель)">Гибрид (дизель)</option>
              <option value="электро">Электро</option>
            </select>
          </label>
          <label>
            Мощность, л.с.
            <input name="power_hp" type="number" defaultValue={150} min={1} required />
          </label>
          {!isEv ? (
            <label>
              Объём, см³
              <input name="engine_cc" type="number" required defaultValue={1598} min={600} />
            </label>
          ) : (
            <input type="hidden" name="engine_cc" value={0} />
          )}
        </div>
        <p className="calc-hint">
          {isEv
            ? "Для электро объём не нужен: пошлина СТП (15% + акциз + НДС), утиль — по мощности."
            : "Л.с. критичны для утильсбора. На Encar часто нет — укажите по бейджу (40i, 1.6T…)."}
        </p>
      </fieldset>

      <fieldset className="calc-fieldset">
        <legend>Доставка</legend>
        <label>
          Доставка по РФ, ₽
          <input name="delivery_city_rub" type="number" defaultValue={190000} min={0} />
        </label>
      </fieldset>

      {error ? <p className="err">{error}</p> : null}
      <button className="btn btn-primary calc-form__submit" type="submit" disabled={isLoading}>
        {isLoading ? "Считаем…" : "Рассчитать под ключ"}
      </button>
    </form>
  );
});
