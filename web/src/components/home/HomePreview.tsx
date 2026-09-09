import { memo } from "react";
import { Link } from "react-router-dom";
import type { Vehicle } from "../../types";
import { VehicleCard } from "../VehicleCard";
import { Stagger, StaggerItem } from "../Motion";

type Props = { vehicles: Vehicle[] };

export const HomePreview = memo(function HomePreview({ vehicles }: Props) {
  return (
    <section className="section">
      <div className="section-head row">
        <div>
          <p className="eyebrow">Подборка</p>
          <h2>Свежие предложения</h2>
        </div>
        <Link className="btn btn-ghost" to="/catalog">
          Весь каталог
        </Link>
      </div>
      <Stagger className="vehicle-grid">
        {vehicles.map((v, i) => (
          <StaggerItem key={v.public_slug} className={`stagger-d${(i % 8) + 1}`}>
            <VehicleCard vehicle={v} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
});
