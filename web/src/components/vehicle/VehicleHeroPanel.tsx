import { Link } from "react-router-dom";
import { memo } from "react";
import type { Vehicle } from "../../types";
import { countryLabel, formatRub } from "../../api";
import { telegramUrlWithText } from "../../contacts";
import { TelegramIcon, sourceBrand } from "../BrandIcons";

function localizeFuelClient(raw?: string | null) {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/электро|electric|\bEV\b/i.test(v) && !/гибрид|hybrid|бензин|дизель/i.test(v)) return "Электро";
  if (/дизель.*гибрид|гибрид.*дизель/i.test(v)) return "Гибрид (дизель)";
  if (/гибрид|hybrid|DM-?i|HEV|PHEV/i.test(v)) return "Гибрид";
  if (/дизель|diesel/i.test(v)) return "Дизель";
  if (/бензин|gasoline|petrol/i.test(v)) return "Бензин";
  return v.replace(/[\u3400-\u9fff]/g, "").trim();
}

function localizeTransClient(raw?: string | null) {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/电动车单速|单速变速|Редуктор/i.test(v)) return "Редуктор (EV)";
  if (/CVT/i.test(v)) return "CVT";
  if (/робот|DCT/i.test(v)) return "Робот (DCT)";
  if (/механик/i.test(v)) return "Механика";
  if (/ступ|АКПП|автомат/i.test(v)) return /ступ|АКПП/i.test(v) ? v : "АКПП";
  return v.replace(/[\u3400-\u9fff]/g, "").trim() || v;
}

function localizeDriveClient(raw?: string | null) {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/полн|AWD|4WD/i.test(v)) return "Полный";
  if (/задн|RWD/i.test(v)) return "Задний";
  if (/передн|FF|FWD/i.test(v)) return "Передний (FF)";
  return v.replace(/[\u3400-\u9fff]/g, "").trim();
}

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
  const source = sourceBrand(vehicle.source);
  const SourceIcon = source.Icon;

  return (
    <section className="detail-panel detail-panel--hero">
      <div className="detail-hero__top">
        <p className="eyebrow">
          {countryLabel(vehicle.country)}
          {vehicle.trim ? ` · ${vehicle.trim}` : ""}
        </p>
        {vehicle.source_url && SourceIcon ? (
          <a
            className="detail-source-chip"
            href={vehicle.source_url}
            target="_blank"
            rel="noopener noreferrer"
            title={source.label}
          >
            <SourceIcon className="detail-source-chip__icon" />
            <span>{vehicle.source === "encar" ? "Encar" : "Dongchedi"}</span>
          </a>
        ) : null}
      </div>

      <h1>
        {vehicle.brand} {vehicle.model}
        {vehicle.year ? ` · ${vehicle.year}` : ""}
      </h1>

      <p className="lede">
        {[
          vehicle.mileage_km != null
            ? `${new Intl.NumberFormat("ru-RU").format(vehicle.mileage_km)} км`
            : null,
          localizeFuelClient(vehicle.fuel_type),
          localizeTransClient(vehicle.transmission),
          localizeDriveClient(vehicle.drive),
          vehicle.power_hp != null ? `${vehicle.power_hp} л.с.` : null,
          vehicle.color,
        ]
          .filter(Boolean)
          .join(" · ") || "Параметры уточняются по оригиналу объявления"}
      </p>

      <div className="detail-price-block">
        <p className="price-xl">{formatRub(vehicle.estimated_total_rub)}</p>
        <p className="detail-price-note">Под ключ во Владивостоке, ориентир</p>
        {vehicle.foreign_price != null && (
          <p className="detail-foreign">
            Цена авто: {new Intl.NumberFormat("ru-RU").format(vehicle.foreign_price)}{" "}
            {vehicle.foreign_currency}
          </p>
        )}
      </div>

      <div className="detail-actions">
        <a
          className="btn btn-telegram detail-action-btn"
          href={telegramUrlWithText(tgText)}
          target="_blank"
          rel="noreferrer"
        >
          <TelegramIcon className="detail-action-btn__icon" />
          Написать в Telegram
        </a>
        {user ? (
          <button
            type="button"
            className="btn btn-primary detail-action-btn"
            disabled={adding}
            onClick={onAddDeal}
          >
            {adding ? "Добавляем…" : "В кабинет"}
          </button>
        ) : (
          <Link className="btn btn-primary detail-action-btn" to="/register">
            Вести сделку
          </Link>
        )}
        {vehicle.source_url ? (
          <a
            className="btn btn-ghost detail-action-btn detail-source-btn"
            href={vehicle.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SourceIcon ? <SourceIcon className="detail-action-btn__icon detail-action-btn__icon--brand" /> : null}
            {source.label}
          </a>
        ) : null}
      </div>
      {dealMsg && <p className="ok">{dealMsg}</p>}
    </section>
  );
});
