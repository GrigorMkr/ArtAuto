import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { artautoApi, useGetCatalogQuery, useGetMetaQuery } from "../store/apiSlice";
import { Reveal } from "../components/Motion";
import { CatalogCountryTabs } from "../components/catalog/CatalogCountryTabs";
import { CatalogFiltersForm } from "../components/catalog/CatalogFiltersForm";
import { CatalogGrid } from "../components/catalog/CatalogGrid";
import type { AppDispatch } from "../store/store";
import type { CatalogFilters, Vehicle } from "../types";

const PAGE_SIZE = 24;

export function CatalogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [params, setParams] = useSearchParams();
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

  const list = items;
  const total = data?.total ?? list.length;
  const canMore = list.length < total;
  const busy = isLoading || loadingMore || (isFetching && offset > 0);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const next = new URLSearchParams();
      for (const [k, v] of fd.entries()) {
        const val = String(v).trim();
        if (val) next.set(k, val);
      }
      startTransition(() => setParams(next));
    },
    [setParams]
  );

  const setCountry = useCallback(
    (country: string) => {
      const next = new URLSearchParams(params);
      if (!country) next.delete("country");
      else next.set("country", country);
      startTransition(() => setParams(next));
    },
    [params, setParams]
  );

  const onBrandChange = useCallback(
    (brand: string) => {
      const next = new URLSearchParams(params);
      if (!brand) next.delete("brand");
      else next.set("brand", brand);
      next.delete("model");
      startTransition(() => setParams(next));
    },
    [params, setParams]
  );

  const onModelChange = useCallback(
    (model: string) => {
      const next = new URLSearchParams(params);
      if (!model) next.delete("model");
      else next.set("model", model);
      if (filters.brand) next.set("brand", filters.brand);
      startTransition(() => setParams(next));
    },
    [params, setParams, filters.brand]
  );

  const loadMore = useCallback(() => {
    if (busy || !canMore) return;
    setLoadingMore(true);
    setOffset((o) => o + PAGE_SIZE);
  }, [busy, canMore]);

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

        <CatalogCountryTabs country={filters.country} onChange={setCountry} />

        <CatalogFiltersForm
          filters={filters}
          filterKey={filterKey}
          meta={meta}
          onSubmit={onSubmit}
          onBrandChange={onBrandChange}
          onModelChange={onModelChange}
        />

        <CatalogGrid
          list={list}
          total={total}
          isLoading={isLoading}
          canMore={canMore}
          busy={busy}
          onLoadMore={loadMore}
        />
      </div>
    </>
  );
}
