import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetVehicleQuery, useCreateDealMutation } from "../store/apiSlice";
import { countryLabel, formatRub } from "../api";
import { LeadForm } from "../components/LeadForm";
import { Reveal } from "../components/Motion";
import { DetailGallery } from "../components/DetailGallery";
import { useAuth } from "../auth";
import { useEffect, useMemo, useState } from "react";

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

  const facts = useMemo(() => {
    if (!vehicle) return [] as Array<{ label: string; value: string }>;
    const seats = Number(vehicle.specifications?.seats);
    return [
      vehicle.year != null ? { label: "Год", value: String(vehicle.year) } : null,
      vehicle.mileage_km != null
        ? {
            label: "Пробег",
            value: `${new Intl.NumberFormat("ru-RU").format(vehicle.mileage_km)} км`,
          }
        : null,
      vehicle.fuel_type ? { label: "Топливо", value: vehicle.fuel_type } : null,
      vehicle.transmission ? { label: "КПП", value: vehicle.transmission } : null,
      vehicle.drive ? { label: "Привод", value: vehicle.drive } : null,
      vehicle.body_type ? { label: "Кузов", value: vehicle.body_type } : null,
      vehicle.engine_cc != null && vehicle.engine_cc > 0
        ? { label: "Объём", value: `${vehicle.engine_cc} см³` }
        : null,
      vehicle.power_hp != null ? { label: "Мощность", value: `${vehicle.power_hp} л.с.` } : null,
      vehicle.color ? { label: "Цвет", value: vehicle.color } : null,
      vehicle.trim ? { label: "Комплектация", value: vehicle.trim } : null,
      Number.isFinite(seats) && seats > 0 ? { label: "Мест", value: String(seats) } : null,
      {
        label: "Статус",
        value: vehicle.status === "AVAILABLE" ? "Доступен" : vehicle.status,
      },
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [vehicle]);

  if (isLoading) return <p className="muted">Загрузка…</p>;
  if (isError || !vehicle) {
    return (
      <p className="empty">
        Автомобиль не найден. <Link to="/catalog">В каталог</Link>
      </p>
    );
  }

  const breakdown = Object.entries(vehicle.specifications || {}).filter(
    ([k, v]) => k !== "seats" && typeof v === "number"
  );
  const photos = vehicle.images || [];

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

      <Reveal delay={0.06}>
        <article className="detail">
          <DetailGallery
            photos={photos}
            alt={`${vehicle.brand} ${vehicle.model}`}
            active={active}
            onChange={setActive}
          />

          <div className="detail-info">
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
                {user ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={adding}
                    onClick={async () => {
                      try {
                        await createDeal({ vehicle_slug: vehicle.public_slug }).unwrap();
                        setDealMsg("Добавлено в кабинет. Откройте сделки, чтобы видеть статус.");
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

            <section className="detail-panel">
              <h3>Характеристики</h3>
              {facts.length ? (
                <dl className="specs">
                  {facts.map((f) => (
                    <div key={f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted">Подробности появятся после обновления карточки с площадки.</p>
              )}
            </section>

            {breakdown.length > 0 && (
              <section className="detail-panel breakdown">
                <h3>Из чего складывается цена</h3>
                <ul>
                  {breakdown.map(([k, v]) => (
                    <li key={k}>
                      <span>{labelBreakdown(k)}</span>
                      <strong>{formatRub(Number(v))}</strong>
                    </li>
                  ))}
                </ul>
              </section>
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
