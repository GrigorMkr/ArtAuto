import { Link } from "react-router-dom";
import { memo, useEffect, useMemo, useState, type MouseEvent } from "react";
import type { Vehicle } from "../types";
import { countryLabel, formatRub, mediaUrl } from "../api";
import classNames from "classnames";

function formatForeignPrice(price: number, currency: string) {
  return `${new Intl.NumberFormat("ru-RU").format(price)} ${currency}`;
}

function VehicleCardInner({ vehicle }: { vehicle: Vehicle }) {
  const photos = useMemo(() => {
    const raw = (vehicle.images || []).filter(Boolean).slice(0, 8);
    const mapped = raw.map((src) => mediaUrl(src)).filter(Boolean);
    const unique = mapped.filter((src, i, arr) => {
      const base = src.split("&a=")[0].split("&crop=")[0];
      return arr.findIndex((x) => x.split("&a=")[0].split("&crop=")[0] === base) === i;
    });
    return unique.length ? unique : mapped;
  }, [vehicle.images]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    for (const src of photos.slice(1)) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    }
  }, [photos]);

  function onScrub(e: MouseEvent<HTMLDivElement>) {
    if (photos.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (e.clientX - rect.left) / rect.width));
    setIdx(Math.min(photos.length - 1, Math.floor(ratio * photos.length)));
  }

  return (
    <Link to={`/cars/${encodeURIComponent(vehicle.public_slug)}`} className="vehicle-card">
      <div
        className={classNames("vehicle-card__media", {
          "vehicle-card__media--multi": photos.length > 1,
        })}
        onMouseMove={onScrub}
        onMouseLeave={() => setIdx(0)}
      >
        {photos[0] ? (
          <img
            src={photos[idx] || photos[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="is-active"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        ) : (
          <div className="vehicle-card__placeholder" aria-hidden>
            {(vehicle.brand || "AA").slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="vehicle-card__badge">{countryLabel(vehicle.country)}</span>
        {photos.length > 1 && (
          <div className="vehicle-card__scrub" aria-hidden>
            {photos.map((_, i) => (
              <span key={i} className={classNames({ "is-on": i === idx })} />
            ))}
          </div>
        )}
      </div>
      <div className="vehicle-card__body">
        <h3>
          {vehicle.brand} {vehicle.model}
          {vehicle.year ? ` · ${vehicle.year}` : ""}
        </h3>
        <p className="muted">
          {[
            vehicle.mileage_km != null
              ? `${new Intl.NumberFormat("ru-RU").format(vehicle.mileage_km)} км`
              : null,
            vehicle.fuel_type,
            vehicle.transmission,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="vehicle-card__price">{formatRub(vehicle.estimated_total_rub)}</p>
        {vehicle.foreign_price != null && (
          <p className="vehicle-card__foreign">
            Цена авто: {formatForeignPrice(vehicle.foreign_price, vehicle.foreign_currency || "")}
          </p>
        )}
      </div>
    </Link>
  );
}

export const VehicleCard = memo(VehicleCardInner, (prev, next) => {
  const a = prev.vehicle;
  const b = next.vehicle;
  return (
    a.public_slug === b.public_slug &&
    a.estimated_total_rub === b.estimated_total_rub &&
    a.foreign_price === b.foreign_price &&
    a.brand === b.brand &&
    a.model === b.model &&
    a.year === b.year &&
    a.mileage_km === b.mileage_km &&
    a.fuel_type === b.fuel_type &&
    a.transmission === b.transmission &&
    a.country === b.country &&
    (a.images?.length || 0) === (b.images?.length || 0) &&
    a.images?.[0] === b.images?.[0]
  );
});
