import type { Vehicle } from "../types";

export type VehicleFact = { label: string; value: string };

export function buildVehicleFacts(vehicle: Vehicle): VehicleFact[] {
  const seats = Number(vehicle.specifications?.seats);
  return [
    vehicle.year != null ? { label: "Год", value: String(vehicle.year) } : null,
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
    vehicle.power_hp != null ? { label: "Мощность", value: `${vehicle.power_hp} л.с.` } : null,
    vehicle.color ? { label: "Цвет", value: vehicle.color } : null,
    vehicle.trim ? { label: "Комплектация", value: vehicle.trim } : null,
    Number.isFinite(seats) && seats > 0 ? { label: "Мест", value: String(seats) } : null,
    {
      label: "Статус",
      value: vehicle.status === "AVAILABLE" ? "Доступен" : vehicle.status,
    },
  ].filter(Boolean) as VehicleFact[];
}
