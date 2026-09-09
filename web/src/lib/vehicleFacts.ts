import type { Vehicle } from "../types";

export type VehicleFact = { label: string; value: string };

export function buildVehicleFacts(vehicle: Vehicle): VehicleFact[] {
  const seats = Number(vehicle.specifications?.seats);
  const ageLabel =
    typeof vehicle.specifications?.age_band_label === "string"
      ? vehicle.specifications.age_band_label
      : "";
  const powerUsed = Number(vehicle.specifications?.power_hp_used);
  const power =
    vehicle.power_hp != null
      ? vehicle.power_hp
      : Number.isFinite(powerUsed) && powerUsed > 0
        ? powerUsed
        : null;

  const powerEst = Number(vehicle.specifications?.power_estimated) === 1;
  const powerSrc =
    typeof vehicle.specifications?.power_source === "string"
      ? vehicle.specifications.power_source
      : "";
  const ym =
    typeof vehicle.specifications?.year_month === "string"
      ? vehicle.specifications.year_month
      : "";
  const ymLabel =
    ym.length === 6 ? `${ym.slice(4, 6)}.${ym.slice(0, 4)}` : ym ? String(ym) : "";

  return [
    vehicle.year != null ? { label: "Год", value: String(vehicle.year) } : null,
    ymLabel ? { label: "Регистрация", value: ymLabel } : null,
    ageLabel ? { label: "Возраст (таможня)", value: ageLabel } : null,
    vehicle.mileage_km != null
      ? {
          label: "Пробег",
          value: `${new Intl.NumberFormat("ru-RU").format(vehicle.mileage_km)} км`,
        }
      : null,
    vehicle.fuel_type ? { label: "Топливо", value: vehicle.fuel_type } : null,
    vehicle.transmission ? { label: "КПП", value: vehicle.transmission } : null,
    vehicle.drive ? { label: "Привод", value: vehicle.drive } : null,
    vehicle.body_type ? { label: "Кузов", value: vehicle.body_type } : null,
    vehicle.engine_cc != null && vehicle.engine_cc > 0
      ? { label: "Объём", value: `${vehicle.engine_cc} см³` }
      : null,
    power != null
      ? {
          label: "Мощность",
          value: `${power} л.с.${
            powerEst
              ? powerSrc === "badge"
                ? " (по бейджу)"
                : powerSrc === "text"
                  ? " (из описания)"
                  : " (оценка)"
              : ""
          }`,
        }
      : null,
    vehicle.color ? { label: "Цвет", value: vehicle.color } : null,
    vehicle.trim ? { label: "Комплектация", value: vehicle.trim } : null,
    Number.isFinite(seats) && seats > 0 ? { label: "Мест", value: String(seats) } : null,
    {
      label: "Статус",
      value: vehicle.status === "AVAILABLE" ? "Доступен" : vehicle.status,
    },
  ].filter(Boolean) as VehicleFact[];
}
