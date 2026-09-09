import { memo } from "react";

type Props = {
  busy: string;
  onRun: (label: string, fn: () => Promise<unknown>) => void;
  adminFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
};

export const AdminSyncPanel = memo(function AdminSyncPanel({
  busy,
  onRun,
  adminFetch,
}: Props) {
  return (
    <section className="admin-panel">
      <h2>Синхронизация</h2>
      <p className="muted">Подтягивает свежие лоты с Encar (Корея) и Dongchedi (Китай).</p>
      <div className="admin-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!!busy}
          onClick={() =>
            onRun("Полный sync", () =>
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
            onRun("Корея", () =>
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
            onRun("Китай", () =>
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
            onRun("Фото Китая", () =>
              adminFetch("/admin/images/warm", {
                method: "POST",
                body: JSON.stringify({ country: "CN", limit: 80, replace: true }),
              })
            )
          }
        >
          {busy === "Фото Китая" ? "Качаем фото…" : "Загрузить фото Китая"}
        </button>
      </div>
    </section>
  );
});
