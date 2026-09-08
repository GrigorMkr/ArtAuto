import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetVehicleQuery, useCreateDealMutation } from "../store/apiSlice";
import { countryLabel, formatRub } from "../api";
import { LeadForm } from "../components/LeadForm";
import { Reveal } from "../components/Motion";
import { CarPhoto } from "../components/CarPhoto";
import { useAuth } from "../auth";
import { useEffect, useState } from "react";
import classNames from "classnames";

export function VehiclePage() {
  const { slug = "" } = useParams();
  const key = decodeURIComponent(slug);
  const { data: vehicle, isLoading, isError } = useGetVehicleQuery(key, { skip: !key });
  const { user } = useAuth();
  const [createDeal, { isLoading: adding }] = useCreateDealMutation();
  const [dealMsg, setDealMsg] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [vehicle?.public_slug]);

  if (isLoading) return <p className="muted">Загрузка…</p>;
  if (isError || !vehicle) {
    return (
      <p className="empty">
        Автомобиль не найден. <Link to="/catalog">В каталог</Link>
      </p>
    );
  }

  const breakdown = vehicle.specifications || {};
  const photos = vehicle.images || [];
  const main = photos[active] || photos[0];

  return (
    <>
      <Helmet>
        <title>
          {vehicle.brand} {vehicle.model} — АртАвто
        </title>
      </Helmet>

      <Reveal>
        <Link className="back-link" to="/catalog">
          ← К каталогу
        </Link>
      </Reveal>

      <Reveal delay={0.08}>
        <article className="detail">
          <div className="detail-media">
            {main ? (
              <CarPhoto
                className="detail-hero"
                src={main}
                alt={`${vehicle.brand} ${vehicle.model}`}
                eager
              />
            ) : (
              <div className="vehicle-card__placeholder large">
                {vehicle.brand} {vehicle.model}
              </div>
            )}
            {photos.length > 1 && (
              <div className="thumbs" role="listbox" aria-label="Фотографии автомобиля">
                {photos.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className={classNames("thumbs__item", { "thumbs__item--active": i === active })}
                    onClick={() => setActive(i)}
                    aria-label={`Фото ${i + 1}`}
                    aria-selected={i === active}
                  >
                    <CarPhoto src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info">
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
              {vehicle.year ? ` ${vehicle.year}` : ""}
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
                .join(" · ")}
            </p>

            <p className="price-xl">{formatRub(vehicle.estimated_total_rub)}</p>
            {user ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={adding}
                onClick={async () => {
                  try {
                    await createDeal({ vehicle_slug: vehicle.public_slug }).unwrap();
                    setDealMsg("Добавлено в кабинет. Откройте сделки, чтобы видеть статус отправки.");
                  } catch {
                    setDealMsg("Не удалось добавить. Попробуйте из кабинета.");
                  }
                }}
              >
                {adding ? "Добавляем…" : "Добавить в кабинет"}
              </button>
            ) : (
              <Link className="btn btn-primary" to="/register">
                Зарегистрироваться и вести сделку
              </Link>
            )}
            {dealMsg && <p className="ok">{dealMsg}</p>}
            {vehicle.source_url ? (
              <a
                className="detail-source"
                href={vehicle.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {vehicle.source === "encar"
                  ? "Открыть оригинал объявления на Encar"
                  : vehicle.source === "dongchedi"
                    ? "Открыть оригинал объявления на Dongchedi"
                    : "Открыть оригинал объявления"}
              </a>
            ) : null}
            {vehicle.foreign_price != null && (
              <p className="muted">
                Цена авто: {new Intl.NumberFormat("ru-RU").format(vehicle.foreign_price)}{" "}
                {vehicle.foreign_currency}
              </p>
            )}

            <dl className="specs">
              {vehicle.engine_cc != null && vehicle.engine_cc > 0 && (
                <div>
                  <dt>Объём</dt>
                  <dd>{vehicle.engine_cc} см³</dd>
                </div>
              )}
              {vehicle.power_hp != null && (
                <div>
                  <dt>Мощность</dt>
                  <dd>{vehicle.power_hp} л.с.</dd>
                </div>
              )}
              {vehicle.body_type && (
                <div>
                  <dt>Кузов</dt>
                  <dd>{vehicle.body_type}</dd>
                </div>
              )}
              <div>
                <dt>Статус</dt>
                <dd>{vehicle.status === "AVAILABLE" ? "Доступен" : vehicle.status}</dd>
              </div>
            </dl>

            {Object.keys(breakdown).length > 0 && (
              <div className="breakdown">
                <h3>Из чего складывается цена</h3>
                <ul>
                  {Object.entries(breakdown).map(([k, v]) => (
                    <li key={k}>
                      <span>{labelBreakdown(k)}</span>
                      <strong>{formatRub(Number(v))}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <LeadForm vehicleSlug={vehicle.public_slug} />
          </div>
        </article>
      </Reveal>
    </>
  );
}

function labelBreakdown(key: string) {
  const map: Record<string, string> = {
    vehicle_rub: "Авто в ₽",
    foreign_expenses_rub: "Расходы по стране",
    broker_rub: "Брокер",
    transport_to_vladivostok_rub: "До Владивостока",
    company_fee_rub: "Услуги АртАвто",
    delivery_russia_rub: "Доставка по РФ",
    customs_total_rub: "Таможня",
    recycling_fee_rub: "Утильсбор",
    laboratory_rub: "Лаборатория",
    extra_rub: "Дополнительно",
  };
  return map[key] || key;
}
