import { memo } from "react";
import type { VehicleFact } from "../../lib/vehicleFacts";

type Props = { facts: VehicleFact[] };

export const VehicleSpecsPanel = memo(function VehicleSpecsPanel({ facts }: Props) {
  return (
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
        <p className="muted">Подробности появятся после обновления карточки.</p>
      )}
    </section>
  );
});
