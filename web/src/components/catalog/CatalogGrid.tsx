import { Link } from "react-router-dom";
import { memo } from "react";
import type { Vehicle } from "../../types";
import { VehicleCard } from "../VehicleCard";

type Props = {
  list: Vehicle[];
  total: number;
  isLoading: boolean;
  canMore: boolean;
  busy: boolean;
  onLoadMore: () => void;
};

export const CatalogGrid = memo(function CatalogGrid({
  list,
  total,
  isLoading,
  canMore,
  busy,
  onLoadMore,
}: Props) {
  return (
    <>
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
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={onLoadMore}>
                {busy ? "Загрузка…" : "Показать ещё"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
});
