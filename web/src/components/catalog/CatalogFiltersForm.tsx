import { memo, useState, type FormEvent } from "react";
import type { CatalogFilters } from "../../types";

type Meta = {
  brands?: string[];
  models?: Array<{ brand: string; model: string }>;
};

type Props = {
  filters: CatalogFilters;
  filterKey: string;
  meta?: Meta;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
};

export const CatalogFiltersForm = memo(function CatalogFiltersForm({
  filters,
  filterKey,
  meta,
  onSubmit,
  onBrandChange,
  onModelChange,
}: Props) {
  const [more, setMore] = useState(false);
  const models = (meta?.models || [])
    .filter((m) => !filters.brand || m.brand === filters.brand)
    .map((m) => m.model);

  return (
    <form className="filters" onSubmit={onSubmit} key={filterKey}>
      <label>
        Марка
        <select
          name="brand"
          defaultValue={filters.brand || ""}
          onChange={(e) => onBrandChange(e.target.value)}
        >
          <option value="">Все</option>
          {(meta?.brands || []).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label>
        Модель
        <select
          name="model"
          defaultValue={filters.model || ""}
          onChange={(e) => onModelChange(e.target.value)}
        >
          <option value="">Все</option>
          {[...new Set(models)].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        Цена от
        <input name="price_from" type="number" defaultValue={filters.price_from || ""} placeholder="₽" />
      </label>
      <label>
        Цена до
        <input name="price_to" type="number" defaultValue={filters.price_to || ""} placeholder="₽" />
      </label>
      <label>
        Поиск
        <input name="q" defaultValue={filters.q || ""} placeholder="Kia Sportage…" />
      </label>
      <input type="hidden" name="country" value={filters.country || ""} />

      <button type="button" className="btn btn-ghost" onClick={() => setMore((v) => !v)}>
        {more ? "Скрыть фильтры" : "Ещё фильтры"}
      </button>
      <button type="submit" className="btn btn-primary">
        Показать
      </button>

      {more && (
        <div className="filters-more">
          <label>
            Кузов
            <input name="body" defaultValue={filters.body || ""} placeholder="седан / кроссовер" />
          </label>
          <label>
            Топливо
            <input name="fuel" defaultValue={filters.fuel || ""} placeholder="бензин" />
          </label>
          <label>
            Привод
            <select name="drive" defaultValue={filters.drive || ""}>
              <option value="">Любой</option>
              <option value="передний">Передний</option>
              <option value="задний">Задний</option>
              <option value="полный">Полный</option>
            </select>
          </label>
          <label>
            КПП
            <input name="transmission" defaultValue={filters.transmission || ""} placeholder="автомат" />
          </label>
          <label>
            Год от
            <input name="year_from" type="number" defaultValue={filters.year_from || ""} />
          </label>
          <label>
            Год до
            <input name="year_to" type="number" defaultValue={filters.year_to || ""} />
          </label>
          <label>
            Пробег до, тыс. км
            <input name="mileage_to" type="number" defaultValue={filters.mileage_to || ""} />
          </label>
          <label>
            Мощность до, л.с.
            <input name="power_to" type="number" defaultValue={filters.power_to || ""} />
          </label>
        </div>
      )}
    </form>
  );
});
