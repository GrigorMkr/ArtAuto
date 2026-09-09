import { memo, type FormEvent } from "react";

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
  );
});
