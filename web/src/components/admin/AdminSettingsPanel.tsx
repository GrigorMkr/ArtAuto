import { memo } from "react";
import type { AdminFxRow, AdminSetting } from "../../lib/adminApi";

type Props = {
  busy: string;
  fx: AdminFxRow[];
  settings: AdminSetting[];
  setFx: (next: AdminFxRow[]) => void;
  setSettings: (next: AdminSetting[]) => void;
  onRun: (label: string, fn: () => Promise<unknown>) => void;
  adminFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
};

export const AdminSettingsPanel = memo(function AdminSettingsPanel({
  busy,
  fx,
  settings,
  setFx,
  setSettings,
  onRun,
  adminFetch,
}: Props) {
  return (
    <section className="admin-panel">
      <h2>Курсы и постоянные расходы</h2>
      <p className="muted">
        Коммерческий курс = ручной (если задан) или официальный × (1 + наценка%). После изменений
        нажмите «Пересчитать каталог».
      </p>
      <div className="admin-actions" style={{ marginBottom: "1.25rem" }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!!busy}
          onClick={() =>
            onRun("Курсы ЦБ", async () => {
              const r = await adminFetch("/admin/fx/refresh", { method: "POST" });
              const f = await adminFetch<{ items: AdminFxRow[] }>("/admin/fx");
              setFx(f.items || []);
              return r;
            })
          }
        >
          Обновить курсы ЦБ
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!!busy}
          onClick={() => onRun("Пересчёт", () => adminFetch("/admin/reprice", { method: "POST" }))}
        >
          Пересчитать каталог
        </button>
      </div>

      <h3>Курсы валют</h3>
      <div className="admin-settings-grid">
        {fx.map((row, i) => (
          <div key={row.code} className="admin-setting-card">
            <strong>{row.code}</strong>
            <label>
              Официальный
              <input
                type="number"
                step="any"
                value={row.official_rate_rub}
                onChange={(e) => {
                  const next = [...fx];
                  next[i] = { ...row, official_rate_rub: Number(e.target.value) };
                  setFx(next);
                }}
              />
            </label>
            <label>
              Наценка %
              <input
                type="number"
                step="any"
                value={row.commercial_markup_pct}
                onChange={(e) => {
                  const next = [...fx];
                  next[i] = { ...row, commercial_markup_pct: Number(e.target.value) };
                  setFx(next);
                }}
              />
            </label>
            <label>
              Ручной коммерческий (пусто = авто)
              <input
                type="number"
                step="any"
                value={row.manual_commercial_rate_rub ?? ""}
                onChange={(e) => {
                  const next = [...fx];
                  const v = e.target.value.trim();
                  next[i] = {
                    ...row,
                    manual_commercial_rate_rub: v === "" ? null : Number(v),
                  };
                  setFx(next);
                }}
              />
            </label>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={!!busy}
        onClick={() =>
          onRun("Сохранить курсы", () =>
            adminFetch("/admin/fx", {
              method: "PATCH",
              body: JSON.stringify({ items: fx }),
            })
          )
        }
      >
        Сохранить курсы
      </button>

      <h3 style={{ marginTop: "1.5rem" }}>Постоянные расходы</h3>
      <div className="admin-settings-grid">
        {settings
          .filter((s) => !s.key.includes("TO_VLADIVOSTOK"))
          .map((row) => (
            <label key={row.key} className="admin-setting-card">
              <strong>{row.description || row.key}</strong>
              <span className="muted">
                {row.key} · {row.currency}
              </span>
              <input
                type="number"
                step="any"
                value={row.value}
                onChange={(e) => {
                  const next = [...settings];
                  const idx = settings.findIndex((s) => s.key === row.key);
                  if (idx < 0) return;
                  next[idx] = { ...row, value: Number(e.target.value) };
                  setSettings(next);
                }}
              />
            </label>
          ))}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!!busy}
        onClick={() =>
          onRun("Сохранить расходы", () =>
            adminFetch("/admin/settings", {
              method: "PATCH",
              body: JSON.stringify({ settings }),
            })
          )
        }
      >
        Сохранить расходы
      </button>
    </section>
  );
});
