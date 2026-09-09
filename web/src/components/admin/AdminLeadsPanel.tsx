import { memo } from "react";
import type { AdminLead } from "../../lib/adminApi";

type Props = { leads: AdminLead[] };

export const AdminLeadsPanel = memo(function AdminLeadsPanel({ leads }: Props) {
  return (
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
  );
});
