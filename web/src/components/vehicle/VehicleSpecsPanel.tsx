import { memo, useState } from "react";
import type { VehicleFact } from "../../lib/vehicleFacts";
import type { TrimSpecGroup } from "../../lib/trimSpecs";

type Props = {
  facts: VehicleFact[];
  trimGroups?: TrimSpecGroup[];
};

export const VehicleSpecsPanel = memo(function VehicleSpecsPanel({
  facts,
  trimGroups = [],
}: Props) {
  const hasTrim = trimGroups.length > 0;
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(trimGroups.map((g, i) => [g.title + i, i < 3]))
  );

  return (
    <section className="detail-panel">
      <h3>{hasTrim ? "Характеристики комплектации" : "Характеристики"}</h3>

      {hasTrim ? (
        <div className="trim-groups">
          {trimGroups.map((g, i) => {
            const key = g.title + i;
            const isOpen = open[key] !== false;
            return (
              <div key={key} className="trim-group">
                <button
                  type="button"
                  className="trim-group__head"
                  aria-expanded={isOpen}
                  onClick={() => setOpen((s) => ({ ...s, [key]: !isOpen }))}
                >
                  <span>{g.title}</span>
                  <span className="trim-group__chev" aria-hidden>
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>
                {isOpen ? (
                  <dl className="trim-group__rows">
                    {g.rows.map((r: { label: string; value: string }) => (
                      <div key={`${r.label}-${r.value}`}>
                        <dt>{r.label}</dt>
                        <dd>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : facts.length ? (
        <dl className="specs">
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted">Подробности появятся после обновления карточки.</p>
      )}

      {hasTrim && facts.length ? (
        <details className="trim-extra">
          <summary>Основные данные лота</summary>
          <dl className="specs">
            {facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </section>
  );
});
