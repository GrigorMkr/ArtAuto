import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { useAuth } from "../auth";
import { Reveal } from "../components/Motion";
import {
  adminFetch,
  type AdminFxRow,
  type AdminLead,
  type AdminSetting,
  type AdminStats,
  type AdminVehicle,
} from "../lib/adminApi";
import { AdminStatsBar } from "../components/admin/AdminStatsBar";
import { AdminSyncPanel } from "../components/admin/AdminSyncPanel";
import { AdminSettingsPanel } from "../components/admin/AdminSettingsPanel";
import { AdminCarsPanel } from "../components/admin/AdminCarsPanel";
import { AdminLeadsPanel } from "../components/admin/AdminLeadsPanel";

type Tab = "sync" | "cars" | "leads" | "settings";

export function AdminPage() {
  const { user, ready, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("sync");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [cars, setCars] = useState<AdminVehicle[]>([]);
  const [carsTotal, setCarsTotal] = useState(0);
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [fx, setFx] = useState<AdminFxRow[]>([]);

  const refreshStats = useCallback(async () => {
    const s = await adminFetch<AdminStats>("/admin/stats");
    setStats(s);
  }, []);

  const refreshCars = useCallback(async () => {
    const params = new URLSearchParams({ limit: "40", offset: "0" });
    if (country) params.set("country", country);
    if (q.trim()) params.set("q", q.trim());
    const data = await adminFetch<{ items: AdminVehicle[]; total: number }>(
      `/admin/vehicles?${params}`
    );
    setCars(data.items);
    setCarsTotal(data.total);
  }, [country, q]);

  const refreshLeads = useCallback(async () => {
    const data = await adminFetch<{ items: AdminLead[] }>("/admin/leads");
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

  useEffect(() => {
    if (!user || user.role !== "admin" || tab !== "settings") return;
    Promise.all([
      adminFetch<{ settings: AdminSetting[] }>("/admin/settings"),
      adminFetch<{ items: AdminFxRow[] }>("/admin/fx"),
    ])
      .then(([s, f]) => {
        setSettings(s.settings || []);
        setFx(f.items || []);
      })
      .catch(() => setErr("Не удалось загрузить настройки"));
  }, [user, tab]);

  const run = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
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
    },
    [refreshStats, refreshCars, tab]
  );

  const hideCar = useCallback(
    (slug: string) =>
      run("Скрыть", () =>
        adminFetch(`/admin/vehicles/${encodeURIComponent(slug)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "HIDDEN" }),
        })
      ),
    [run]
  );

  const showCar = useCallback(
    (slug: string) =>
      run("Показать", () =>
        adminFetch(`/admin/vehicles/${encodeURIComponent(slug)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "AVAILABLE" }),
        })
      ),
    [run]
  );

  if (!ready) return <p className="muted">Загрузка…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (user.role !== "admin") return <Navigate to="/cabinet" replace />;

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

      {stats && <AdminStatsBar stats={stats} />}

      <div className="country-tabs admin-tabs">
        {(
          [
            ["sync", "Обновление"],
            ["settings", "Расчёт"],
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
        <AdminSyncPanel busy={busy} onRun={run} adminFetch={adminFetch} />
      )}
      {tab === "settings" && (
        <AdminSettingsPanel
          busy={busy}
          fx={fx}
          settings={settings}
          setFx={setFx}
          setSettings={setSettings}
          onRun={run}
          adminFetch={adminFetch}
        />
      )}
      {tab === "cars" && (
        <AdminCarsPanel
          cars={cars}
          carsTotal={carsTotal}
          country={country}
          q={q}
          busy={busy}
          setCountry={setCountry}
          setQ={setQ}
          onRefresh={() => refreshCars()}
          onHide={hideCar}
          onShow={showCar}
        />
      )}
      {tab === "leads" && <AdminLeadsPanel leads={leads} />}
    </>
  );
}
