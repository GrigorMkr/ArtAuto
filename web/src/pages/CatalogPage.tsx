import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import classNames from "classnames";
import { useDispatch } from "react-redux";
import { artautoApi, useGetCatalogQuery, useGetMetaQuery } from "../store/apiSlice";
import { VehicleCard } from "../components/VehicleCard";
import { Reveal } from "../components/Motion";
import type { AppDispatch } from "../store/store";
import type { CatalogFilters, Vehicle } from "../types";

const PAGE_SIZE = 24;

export function CatalogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [params, setParams] = useSearchParams();
  const [more, setMore] = useState(false);
  const [items, setItems] = useState<Vehicle[]>([]);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const seenOffsets = useRef(new Set<number>([0]));

  const filters: CatalogFilters = useMemo(
    () => ({
      country: params.get("country") || undefined,
      brand: params.get("brand") || undefined,
      model: params.get("model") || undefined,
      q: params.get("q") || undefined,
      fuel: params.get("fuel") || undefined,
      transmission: params.get("transmission") || undefined,
      drive: params.get("drive") || undefined,
      body: params.get("body") || undefined,
      year_from: params.get("year_from") || undefined,
      year_to: params.get("year_to") || undefined,
      mileage_to: params.get("mileage_to") || undefined,
      price_from: params.get("price_from") || undefined,
      price_to: params.get("price_to") || undefined,
      power_from: params.get("power_from") || undefined,
      power_to: params.get("power_to") || undefined,
    }),
    [params]
  );

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const queryArgs = useMemo(
    () => ({ ...filters, limit: PAGE_SIZE, offset }),
    [filters, offset]
  );

  const { data, isFetching, isLoading, isSuccess } = useGetCatalogQuery(queryArgs);
  const { data: meta } = useGetMetaQuery(
    filters.country ? { country: filters.country } : undefined
  );

  useEffect(() => {
    setOffset(0);
    setItems([]);
    setLoadingMore(false);
    seenOffsets.current = new Set([0]);
  }, [filterKey]);

  useEffect(() => {
    if (!data?.items || !isSuccess) return;
    const pageOffset = data.offset ?? 0;

    if (pageOffset === 0) {
      seenOffsets.current = new Set([0]);
      setItems(data.items);
      setLoadingMore(false);
      return;
    }

    if (seenOffsets.current.has(pageOffset)) {
      setLoadingMore(false);
      return;
    }

    seenOffsets.current.add(pageOffset);
    setItems((prev) => [...prev, ...data.items]);
    setLoadingMore(false);
  }, [data, isSuccess]);

  useEffect(() => {
    if (!data || isFetching) return;
    const nextOffset = (data.offset ?? 0) + (data.limit ?? PAGE_SIZE);
    if (nextOffset < (data.total ?? 0)) {
      dispatch(
        artautoApi.util.prefetch(
          "getCatalog",
          { ...filters, limit: PAGE_SIZE, offset: nextOffset },
          { force: false }
        )
      );
    }
  }, [data, isFetching, filters, dispatch]);

  const list = Array.isArray(items) ? items : [];
  const total = data?.total ?? list.length;
  const canMore = list.length < total;
  const busy = isLoading || loadingMore || (isFetching && offset > 0);

  const models = (meta?.models || [])
    .filter((m) => !filters.brand || m.brand === filters.brand)
    .map((m) => m.model);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      const val = String(v).trim();
      if (val) next.set(k, val);
    }
    setParams(next);
  }

  function setCountry(country: string) {
    const next = new URLSearchParams(params);
    if (!country) next.delete("country");
    else next.set("country", country);
    setParams(next);
  }

  function loadMore() {
    if (busy || !canMore) return;
    setLoadingMore(true);
    setOffset((o) => o + PAGE_SIZE);
  }

  return (
    <>
      <Helmet>
        <title>Каталог — АртАвто</title>
      </Helmet>

      <div className="catalog-stage">
      <Reveal>
        <section className="page-intro">
          <p className="eyebrow">Каталог</p>
          <h1>Автомобили из Кореи и Китая</h1>
          <p className="lede">Цена на карточке уже включает расчёт под ключ до Уфы.</p>
        </section>
      </Reveal>

      <div className="country-tabs">
        {[
          { id: "", label: "Все авто" },
          { id: "CN", label: "Китай" },
          { id: "KR", label: "Корея" },
        ].map((t) => (
          <button
            key={t.id || "all"}
            type="button"
            className={classNames({ active: (filters.country || "") === t.id })}
            onClick={() => setCountry(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form className="filters" onSubmit={onSubmit} key={filterKey}>
        <label>
          Марка
          <select
            name="brand"
            defaultValue={filters.brand || ""}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              const brand = e.target.value;
              if (!brand) next.delete("brand");
              else next.set("brand", brand);
              next.delete("model");
              setParams(next);
            }}
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
            onChange={(e) => {
              const next = new URLSearchParams(params);
              const model = e.target.value;
              if (!model) next.delete("model");
              else next.set("model", model);
              if (filters.brand) next.set("brand", filters.brand);
              setParams(next);
            }}
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

      <p className="count">
        Найдено: {total}
        {isLoading ? " · загружаем…" : ""}
        {list.length > 0 && list.length < total ? ` · показано ${list.length}` : ""}
      </p>

      {list.length === 0 && !isLoading ? (
        <p className="empty">
          Ничего не найдено. <Link to="/catalog">Сбросить фильтры</Link>
        </p>
      ) : (
        <>
          <div className="vehicle-grid">
            {list.map((v) => (
              <VehicleCard key={v.public_slug} vehicle={v} />
            ))}
          </div>
          {canMore && (
            <div className="catalog-more">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={loadMore}>
                {busy ? "Загрузка…" : "Показать ещё"}
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}
