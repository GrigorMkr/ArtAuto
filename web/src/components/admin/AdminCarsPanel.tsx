import { Link } from "react-router-dom";
import { memo } from "react";
import { formatRub } from "../../api";
import { CarPhoto } from "../CarPhoto";
import type { AdminVehicle } from "../../lib/adminApi";

type Props = {
  cars: AdminVehicle[];
  carsTotal: number;
  country: string;
  q: string;
  busy: string;
  setCountry: (v: string) => void;
  setQ: (v: string) => void;
  onRefresh: () => void;
  onHide: (slug: string) => void;
  onShow: (slug: string) => void;
};

export const AdminCarsPanel = memo(function AdminCarsPanel({
  cars,
  carsTotal,
  country,
  q,
  busy,
  setCountry,
  setQ,
  onRefresh,
  onHide,
  onShow,
}: Props) {
  return (
    <section className="admin-panel">
      <div className="row-head">
        <h2>Авто · {carsTotal}</h2>
        <div className="admin-filters">
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Все страны</option>
            <option value="KR">Корея</option>
            <option value="CN">Китай</option>
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск марки/модели" />
          <button type="button" className="btn btn-ghost" onClick={onRefresh}>
            Найти
          </button>
        </div>
      </div>
      <div className="admin-cars">
        {cars.map((v) => (
          <article key={v.public_slug} className="admin-car">
            <div className="admin-car__media">
              <CarPhoto src={v.images?.[0]} alt={`${v.brand} ${v.model}`} />
            </div>
            <div>
              <h3>
                {v.brand} {v.model} {v.year || ""}
              </h3>
              <p className="muted small">
                {v.country} · {v.source} · {v.status}
                {v.photo_cached ? " · фото ✓" : " · фото ✗"}
              </p>
              <p className="vehicle-card__price">{formatRub(v.estimated_total_rub)}</p>
              <div className="admin-actions">
                {v.status === "AVAILABLE" ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={!!busy}
                    onClick={() => onHide(v.public_slug)}
                  >
                    Скрыть
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={!!busy}
                    onClick={() => onShow(v.public_slug)}
                  >
                    В каталог
                  </button>
                )}
                <Link className="btn btn-ghost" to={`/cars/${encodeURIComponent(v.public_slug)}`}>
                  Открыть
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});
