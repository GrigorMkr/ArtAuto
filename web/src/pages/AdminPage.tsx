import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { formatRub } from "../api";
import { CarPhoto } from "../components/CarPhoto";
import { Reveal } from "../components/Motion";
import classNames from "classnames";

type Stats = {
  total: number;
  korea: number;
  china: number;
  chinaPhotosCached: number;
  bySource: Record<string, number>;
  leads: number;
  deals: number;
};

type AdminVehicle = {
  public_slug: string;
  country: string;
  source: string;
  status: string;
  brand: string;
  model: string;
  year: number | null;
  estimated_total_rub: number | null;
  images: string[];
  photo_cached: boolean;
};

type Lead = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  city: string;
  message: string;
  vehicle_slug: string;
  status: string;
};

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("artauto_token");
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export function AdminPage() {
  const { user, ready, logout } = useAuth();
  const [tab, setTab] = useState<"sync" | "cars" | "leads">("sync");
  const [stats, setStats] = useState<Stats | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [cars, setCars] = useState<AdminVehicle[]>([]);
  const [carsTotal, setCarsTotal] = useState(0);
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);

  const refreshStats = useCallback(async () => {
    const s = await adminFetch<Stats>("/admin/stats");
    setStats(s);
  }, []);

  const refreshCars = useCallback(async () => {
    const params = new URLSearchParams({ limit: "40", offset: "0" });
    if (country) params.set("country", country);
    if (q.trim()) params.set("q", q.trim());
    const data = await adminFetch<{ items: AdminVehicle[]; total: number }>(`/admin/vehicles?${params}`);
    setCars(data.items);
    setCarsTotal(data.total);
  }, [country, q]);

  const refreshLeads = useCallback(async () => {
    const data = await adminFetch<{ items: Lead[] }>("/admin/leads");
    setLeads(data.items);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    refreshStats().catch(() => setErr("Не удалось загрузить статистику"));
  }, [user, refreshStats]);

  useEffect(() => {
    if (!user || user.role !== "admin" || tab !== "cars") return;
    refreshCars().catch(() => setErr("Не удалось загрузить авто"));
  }, [user, tab, refreshCars]);

  useEffect(() => {
    if (!user || user.role !== "admin" || tab !== "leads") return;
    refreshLeads().catch(() => setErr("Не удалось загрузить заявки"));
  }, [user, tab, refreshLeads]);

  if (!ready) return <p className="muted">Загрузка…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (user.role !== "admin") return <Navigate to="/cabinet" replace />;

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setErr("");
    setMsg("");
    try {
      const result = await fn();
      setMsg(`${label}: готово. ${typeof result === "object" ? JSON.stringify(result) : ""}`);
      await refreshStats();
      if (tab === "cars") await refreshCars();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy("");
    }
  }

  async function hideCar(slug: string) {
    await run("Скрыть", () =>
      adminFetch(`/admin/vehicles/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "HIDDEN" }),
      })
    );
  }

  async function showCar(slug: string) {
    await run("Показать", () =>
      adminFetch(`/admin/vehicles/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "AVAILABLE" }),
      })
    );
  }

  return (
    <>
      <Helmet>
        <title>Админка — АртАвто</title>
      </Helmet>

      <Reveal>
        <section className="page-intro row-head">
          <div>
            <p className="eyebrow">Админ-панель</p>
            <h1>Управление каталогом</h1>
            <p className="lede">Синхронизация лотов, фото Китая, заявки и скрытие машин.</p>
          </div>
          <div className="header-actions">
            <Link to="/cabinet" className="btn btn-ghost">
              Кабинет
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => logout()}>
              Выйти
            </button>
          </div>
        </section>
      </Reveal>

      {stats && (
        <div className="admin-stats">
          <div>
            <strong>{stats.total}</strong>
            <span>всего</span>
          </div>
          <div>
            <strong>{stats.korea}</strong>
            <span>Корея</span>
          </div>
          <div>
            <strong>{stats.china}</strong>
            <span>Китай</span>
          </div>
          <div>
            <strong>
              {stats.chinaPhotosCached}/{stats.china}
            </strong>
            <span>фото CN в кэше</span>
          </div>
          <div>
            <strong>{stats.leads}</strong>
            <span>заявки</span>
          </div>
        </div>
      )}

      <div className="country-tabs admin-tabs">
        {(
          [
            ["sync", "Обновление"],
            ["cars", "Авто"],
            ["leads", "Заявки"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={classNames({ active: tab === id })}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {err && <p className="err">{err}</p>}
      {msg && <p className="ok admin-msg">{msg}</p>}

      {tab === "sync" && (
        <section className="admin-panel">
          <h2>Синхронизация</h2>
          <p className="muted">Подтягивает свежие лоты с Encar (Корея) и Dongchedi (Китай).</p>
          <div className="admin-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!!busy}
              onClick={() =>
                run("Полный sync", () =>
                  adminFetch("/import/sync", {
                    method: "POST",
                    body: JSON.stringify({ encar: 1200, dongchedi: 500 }),
                  })
                )
              }
            >
              {busy === "Полный sync" ? "Обновляем…" : "Обновить всё"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!!busy}
              onClick={() =>
                run("Корея", () =>
                  adminFetch("/import/encar", { method: "POST", body: JSON.stringify({ limit: 1200 }) })
                )
              }
            >
              Только Корея
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!!busy}
              onClick={() =>
                run("Китай", () =>
                  adminFetch("/import/china", { method: "POST", body: JSON.stringify({ limit: 500 }) })
                )
              }
            >
              Только Китай
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!!busy}
              onClick={() =>
                run("Фото Китая", () =>
                  adminFetch("/admin/images/warm", {
                    method: "POST",
                    body: JSON.stringify({ country: "CN", limit: 80, rewrite: true }),
                  })
                )
              }
            >
              {busy === "Фото Китая" ? "Качаем фото…" : "Загрузить фото Китая"}
            </button>
          </div>
        </section>
      )}

      {tab === "cars" && (
        <section className="admin-panel">
          <div className="row-head">
            <h2>Авто · {carsTotal}</h2>
            <div className="admin-filters">
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Все страны</option>
                <option value="KR">Корея</option>
                <option value="CN">Китай</option>
              </select>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск марки/модели"
              />
              <button type="button" className="btn btn-ghost" onClick={() => refreshCars()}>
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
                      <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => hideCar(v.public_slug)}>
                        Скрыть
                      </button>
                    ) : (
                      <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => showCar(v.public_slug)}>
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
      )}

      {tab === "leads" && (
        <section className="admin-panel">
          <h2>Заявки</h2>
          <div className="admin-leads">
            {leads.length === 0 && <p className="muted">Пока нет заявок.</p>}
            {leads.map((l) => (
              <article key={l.id} className="admin-lead">
                <strong>
                  #{l.id} · {l.name} · {l.phone}
                </strong>
                <p className="muted small">
                  {new Date(l.created_at).toLocaleString("ru-RU")}
                  {l.city ? ` · ${l.city}` : ""}
                  {l.vehicle_slug ? ` · ${l.vehicle_slug}` : ""}
                </p>
                {l.message && <p>{l.message}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
