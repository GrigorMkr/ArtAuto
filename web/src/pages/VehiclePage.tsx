import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetVehicleQuery, useCreateDealMutation } from "../store/apiSlice";
import { LeadForm } from "../components/LeadForm";
import { Reveal } from "../components/Motion";
import { DetailGallery } from "../components/DetailGallery";
import { PriceBreakdown } from "../components/PriceBreakdown";
import { VehicleHeroPanel } from "../components/vehicle/VehicleHeroPanel";
import { VehicleSpecsPanel } from "../components/vehicle/VehicleSpecsPanel";
import { buildVehicleFacts } from "../lib/vehicleFacts";
import { useAuth } from "../auth";

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

  const facts = useMemo(() => (vehicle ? buildVehicleFacts(vehicle) : []), [vehicle]);

  const onAddDeal = useCallback(async () => {
    if (!vehicle) return;
    try {
      await createDeal({ vehicle_slug: vehicle.public_slug }).unwrap();
      setDealMsg("Добавлено в кабинет.");
    } catch {
      setDealMsg("Не удалось добавить. Попробуйте из кабинета.");
    }
  }, [createDeal, vehicle]);

  if (isLoading) return <p className="muted">Загрузка…</p>;
  if (isError || !vehicle) {
    return (
      <p className="empty">
        Автомобиль не найден. <Link to="/catalog">В каталог</Link>
      </p>
    );
  }

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
            <VehicleHeroPanel
              vehicle={vehicle}
              user={user}
              adding={adding}
              dealMsg={dealMsg}
              onAddDeal={onAddDeal}
            />
            <VehicleSpecsPanel facts={facts} />
            <PriceBreakdown
              specs={vehicle.specifications || {}}
              totalRub={vehicle.estimated_total_rub}
            />
            <LeadForm vehicleSlug={vehicle.public_slug} />
          </div>
        </article>
      </Reveal>
    </>
  );
}
