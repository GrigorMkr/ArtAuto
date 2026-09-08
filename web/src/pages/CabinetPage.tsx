import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { useCreateDealMutation, useGetCatalogQuery, useGetDealsQuery } from "../store/apiSlice";
import { countryLabel, formatRub } from "../api";
import { CarPhoto } from "../components/CarPhoto";
import { Reveal } from "../components/Motion";
import classNames from "classnames";

export function CabinetPage() {
  const { user, ready, logout } = useAuth();
  const { data: deals = [], isFetching } = useGetDealsQuery(undefined, { skip: !user });
  const { data: catalogData } = useGetCatalogQuery({ limit: 80, offset: 0 }, { skip: !user });
  const catalog = catalogData?.items || [];
  const [createDeal, { isLoading }] = useCreateDealMutation();
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  if (!ready) return <p className="muted">Загрузка…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: "/cabinet" }} />;

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk("");
    const fd = new FormData(e.currentTarget);
    try {
      await createDeal({
        vehicle_slug: String(fd.get("vehicle_slug") || ""),
        brand: String(fd.get("brand") || ""),
        model: String(fd.get("model") || ""),
        year: fd.get("year") ? Number(fd.get("year")) : null,
        comment: String(fd.get("comment") || ""),
      }).unwrap();
      setOk("Авто добавлено. Статус отправки появился в сделках.");
      e.currentTarget.reset();
    } catch {
      setError("Не удалось добавить авто. Войдите снова и попробуйте.");
    }
  }

  return (
    <>
      <Helmet>
        <title>Кабинет — АртАвто</title>
      </Helmet>

      <Reveal>
        <section className="page-intro row-head">
          <div>
            <p className="eyebrow">Личный кабинет</p>
            <h1>{user.name}</h1>
            <p className="lede">Сделки, статусы отправки и добавление автомобилей в работу.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Выйти
          </button>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="cabinet-add">
          <h2>Добавить авто</h2>
          <p className="muted">Выберите лот из каталога или опишите желаемую машину — появится сделка со статусами доставки.</p>
          {ok && <p className="ok">{ok}</p>}
          {error && <p className="err">{error}</p>}
          <form className="filters" onSubmit={onAdd}>
            <label>
              Авто из каталога
              <select name="vehicle_slug" defaultValue="">
                <option value="">Свой запрос</option>
                {catalog.map((v) => (
                  <option key={v.public_slug} value={v.public_slug}>
                    {v.brand} {v.model} {v.year || ""} — {formatRub(v.estimated_total_rub)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Марка
              <input name="brand" placeholder="Tesla, Kia…" />
            </label>
            <label>
              Модель
              <input name="model" placeholder="Model Y" />
            </label>
            <label>
              Год
              <input name="year" type="number" placeholder="2024" />
            </label>
            <label className="span-2">
              Комментарий
              <input name="comment" placeholder="Цвет, бюджет, город получения" />
            </label>
            <button className="btn btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Добавляем…" : "Добавить в сделки"}
            </button>
          </form>
        </section>
      </Reveal>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Сделки</p>
          <h2>{isFetching ? "Обновляем…" : `В работе · ${deals.length}`}</h2>
        </div>
        {deals.length === 0 ? (
          <p className="empty">Пока пусто. Добавьте авто выше или выберите лот в каталоге.</p>
        ) : (
          <div className="deal-list">
            {deals.map((d) => {
              const current = d.steps.findIndex((s) => s.status === d.status);
              return (
                <article key={d.id} className="deal-card">
                  <div className="deal-card__media">
                    <CarPhoto src={d.image} alt={`${d.brand} ${d.model}`} />
                  </div>
                  <div>
                    <p className="eyebrow">{d.country ? countryLabel(d.country) : "Запрос"}</p>
                    <h3>
                      {d.brand} {d.model}
                      {d.year ? ` · ${d.year}` : ""}
                    </h3>
                    <p className="vehicle-card__price">{formatRub(d.estimated_total_rub)}</p>
                    {d.comment && <p className="muted">{d.comment}</p>}
                    {d.vehicle_slug && (
                      <Link className="back-link" to={`/cars/${encodeURIComponent(d.vehicle_slug)}`}>
                        Открыть лот
                      </Link>
                    )}
                    <ol className="deal-track">
                      {d.steps.map((s, i) => (
                        <li
                          key={s.status}
                          className={classNames({
                            done: i <= current,
                            current: i === current,
                          })}
                        >
                          <strong>{s.title}</strong>
                          <span>{s.text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
