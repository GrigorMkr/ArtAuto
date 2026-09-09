import { Link } from "react-router-dom";
import { memo } from "react";
import type { Vehicle } from "../../types";
import { countryLabel, formatRub } from "../../api";
import { telegramUrlWithText } from "../../contacts";

type Props = {
  vehicle: Vehicle;
  user: { role?: string } | null;
  adding: boolean;
  dealMsg: string;
  onAddDeal: () => void;
};

export const VehicleHeroPanel = memo(function VehicleHeroPanel({
  vehicle,
  user,
  adding,
  dealMsg,
  onAddDeal,
}: Props) {
  const tgText = `Здравствуйте! Интересует ${vehicle.brand} ${vehicle.model}${
    vehicle.year ? ` ${vehicle.year}` : ""
  }. Ссылка: ${typeof window !== "undefined" ? window.location.href : vehicle.public_slug}`;

  return (
    <section className="detail-panel detail-panel--hero">
      <p className="eyebrow">
        {countryLabel(vehicle.country)}
        {vehicle.source === "encar"
          ? " · Encar"
          : vehicle.source === "dongchedi"
            ? " · Dongchedi"
            : vehicle.source
              ? ` · ${vehicle.source}`
              : ""}
      </p>
      <h1>
        {vehicle.brand} {vehicle.model}
        {vehicle.year ? ` · ${vehicle.year}` : ""}
      </h1>
      <p className="lede">
        {[
          vehicle.mileage_km != null
            ? `${new Intl.NumberFormat("ru-RU").format(vehicle.mileage_km)} км`
            : null,
          vehicle.fuel_type,
          vehicle.transmission,
          vehicle.drive,
          vehicle.color,
        ]
          .filter(Boolean)
          .join(" · ") || "Параметры уточняются по оригиналу объявления"}
      </p>
      <p className="price-xl">{formatRub(vehicle.estimated_total_rub)}</p>
      {vehicle.foreign_price != null && (
        <p className="detail-foreign">
          Цена авто: {new Intl.NumberFormat("ru-RU").format(vehicle.foreign_price)}{" "}
          {vehicle.foreign_currency}
        </p>
      )}
      <div className="detail-actions">
        <a
          className="btn btn-telegram"
          href={telegramUrlWithText(tgText)}
          target="_blank"
          rel="noreferrer"
        >
          Написать в Telegram
        </a>
        {user ? (
          <button type="button" className="btn btn-primary" disabled={adding} onClick={onAddDeal}>
            {adding ? "Добавляем…" : "В кабинет"}
          </button>
        ) : (
          <Link className="btn btn-primary" to="/register">
            Вести сделку
          </Link>
        )}
        {vehicle.source_url ? (
          <a
            className="btn btn-ghost detail-source-btn"
            href={vehicle.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {vehicle.source === "encar"
              ? "Оригинал на Encar"
              : vehicle.source === "dongchedi"
                ? "Оригинал на Dongchedi"
                : "Оригинал объявления"}
          </a>
        ) : null}
      </div>
      {dealMsg && <p className="ok">{dealMsg}</p>}
    </section>
  );
});
