import type { Vehicle } from "../types";
import type { TrimSpecGroup, TrimSpecRow } from "../components/vehicle/VehicleTrimSpecs";

export type { TrimSpecGroup, TrimSpecRow };

const CJK = /[\u3400-\u9fff]/;

function scrubValue(value: string): string {
  let v = String(value || "").trim();
  if (!v) return "";
  v = v
    .replace(/(\d+)\s*马力/g, "$1 л.с.")
    .replace(/电动车单速变速箱|单速变速箱/g, "Редуктор (EV)")
    .replace(/纯电动/g, "электро")
    .replace(/插电式混动|油电混动|油电混合|48V轻混系统|48V轻混|轻混/g, "")
    .replace(/5门5座两厢车|5门5座掀背车/g, "Хэтчбек")
    .replace(/5门7座MPV/g, "Минивэн 7 мест")
    .replace(/中大型MPV/g, "Минивэн")
    .replace(/小型车/g, "Малый класс")
    .replace(/欧IV/gi, "Евро 4")
    .replace(/欧V(?!I)/gi, "Евро 5")
    .replace(/欧VI\s*b?/gi, "Евро 6")
    .replace(/\s+/g, " ")
    .trim();
  if (CJK.test(v)) {
    v = v.replace(CJK, "").replace(/\s+/g, " ").trim();
  }
  return v;
}

function localizeTransmission(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/电动车单速|单速变速|Редуктор/i.test(v)) return "Редуктор (EV)";
  if (/CVT|无级/i.test(v)) return "CVT";
  if (/双离合|DCT|робот/i.test(v)) return /робот/i.test(v) ? scrubValue(v) : "Робот (DCT)";
  if (/手动|механик/i.test(v)) return "Механика";
  if (/9.?ступ|9.?挡.?自动/i.test(v)) return "9-ступ. АКПП";
  if (/8.?ступ|8.?挡.?自动/i.test(v)) return "8-ступ. АКПП";
  if (/7.?ступ|7.?挡.?自动/i.test(v)) return "7-ступ. АКПП";
  if (/6.?ступ|6.?挡.?自动/i.test(v)) return "6-ступ. АКПП";
  if (/5.?ступ|5.?挡.?自动/i.test(v)) return "5-ступ. АКПП";
  if (/自动|автомат|АКПП|AT/i.test(v)) return /ступ|АКПП/i.test(v) ? scrubValue(v) : "АКПП";
  return scrubValue(v) || "АКПП";
}

function localizeFuel(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/электро|electric|\bEV\b/i.test(v) && !/гибрид|hybrid|бензин|дизель/i.test(v)) return "Электро";
  if (/дизель.*гибрид|гибрид.*дизель/i.test(v)) return "Гибрид (дизель)";
  if (/гибрид|hybrid|DM-?i|HEV|PHEV/i.test(v)) return "Гибрид";
  if (/дизель|diesel/i.test(v)) return "Дизель";
  if (/бензин|gasoline|petrol/i.test(v)) return "Бензин";
  return scrubValue(v);
}

function localizeDrive(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/полн|AWD|4WD/i.test(v)) return "Полный";
  if (/задн|RWD/i.test(v)) return "Задний";
  if (/передн|FF|FWD/i.test(v)) return "Передний (FF)";
  return scrubValue(v);
}

function isElectricVehicle(vehicle?: Vehicle | null, fuelHint?: string) {
  const blob = `${vehicle?.fuel_type || ""} ${fuelHint || ""}`;
  return /электро|electric|\bEV\b/i.test(blob) && !/гибрид|hybrid|бензин|дизель/i.test(blob);
}

function dropEvFakeVolume(label: string, value: string): boolean {
  if (/объём|объем|displacement|см³|см3/i.test(label)) {
    const n = Number(String(value).replace(/[^\d.]/g, ""));
    if (n > 0 && n <= 1200) return true;
  }
  if (/двигатель/i.test(label) && /^\s*1\.0\b/.test(value)) return true;
  return false;
}

/** Strip leftover CJK and normalize display values on the client. */
export function scrubTrimGroups(
  groups: TrimSpecGroup[],
  vehicle?: Vehicle | null
): TrimSpecGroup[] {
  const fuelRow = groups
    .flatMap((g) => g.rows)
    .find((r) => /топлив|fuel/i.test(r.label))?.value;
  const isEv = isElectricVehicle(vehicle, fuelRow);

  return groups
    .map((g) => ({
      title: scrubValue(g.title) || g.title,
      rows: g.rows
        .map((r) => {
          let value = r.value;
          if (/КПП|коробк/i.test(r.label) || /КПП/i.test(g.title)) {
            value = isEv ? "Редуктор (EV)" : localizeTransmission(value);
          } else if (/топлив|fuel/i.test(r.label)) value = localizeFuel(value);
          else if (/привод|drive/i.test(r.label)) value = localizeDrive(value);
          else value = scrubValue(value);
          return { label: scrubValue(r.label) || r.label, value };
        })
        .filter((r) => r.value)
        .filter((r) => !(isEv && dropEvFakeVolume(r.label, r.value))),
    }))
    .filter((g) => g.rows.length);
}

/** Client fallback when server trim_specs_json is missing — Silver-like groups. */
export function buildTrimGroupsFallback(vehicle: Vehicle): TrimSpecGroup[] {
  const seats = Number(vehicle.specifications?.seats);
  const powerEst = Number(vehicle.specifications?.power_estimated) === 1;
  const powerSrc =
    typeof vehicle.specifications?.power_source === "string"
      ? vehicle.specifications.power_source
      : "";
  const power =
    vehicle.power_hp != null && vehicle.power_hp > 0 && !powerEst && powerSrc !== "cc"
      ? vehicle.power_hp
      : null;
  const ym =
    typeof vehicle.specifications?.year_month === "string"
      ? vehicle.specifications.year_month
      : "";
  const ymLabel =
    ym.length === 6 ? `${ym.slice(4, 6)}.${ym.slice(0, 4)}` : ym ? String(ym) : "";
  const isEv = isElectricVehicle(vehicle);

  const engVol =
    !isEv && vehicle.trim && /\d\.\d\s*T/i.test(vehicle.trim)
      ? vehicle.trim.match(/\d\.\d\s*T(?:urbo)?/i)?.[0]
      : !isEv && vehicle.engine_cc && vehicle.engine_cc > 600
        ? `${(vehicle.engine_cc / 1000).toFixed(1)} л`
        : "";
  const engLine = [
    engVol,
    power != null ? `${power} л.с.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const groups: TrimSpecGroup[] = [];
  const push = (title: string, rows: Array<TrimSpecRow | null>) => {
    const clean = rows.filter(Boolean) as TrimSpecRow[];
    if (clean.length) groups.push({ title, rows: clean });
  };

  push("Основные", [
    vehicle.body_type ? { label: "Тип кузова", value: scrubValue(vehicle.body_type) } : null,
    vehicle.color ? { label: "Цвет", value: vehicle.color } : null,
    ymLabel ? { label: "Дата регистрации", value: ymLabel } : null,
    vehicle.year != null ? { label: "Год выпуска", value: String(vehicle.year) } : null,
  ]);

  push("Кузов", [
    Number.isFinite(seats) && seats > 0 ? { label: "Мест", value: String(seats) } : null,
    vehicle.body_type ? { label: "Тип кузова", value: scrubValue(vehicle.body_type) } : null,
  ]);

  push("Двигатель", [
    engLine ? { label: "Двигатель", value: engLine } : null,
    !isEv && vehicle.engine_cc && vehicle.engine_cc > 600
      ? { label: "Объём двигателя", value: `${vehicle.engine_cc} см³` }
      : null,
    power != null ? { label: "Макс. мощность (л.с.)", value: String(power) } : null,
    vehicle.fuel_type ? { label: "Вид топлива", value: localizeFuel(vehicle.fuel_type) } : null,
  ]);

  push("КПП", [
    vehicle.transmission || isEv
      ? {
          label: "КПП",
          value: isEv ? "Редуктор (EV)" : localizeTransmission(vehicle.transmission || ""),
        }
      : null,
  ]);

  push("Ходовая", [
    vehicle.drive ? { label: "Привод", value: localizeDrive(vehicle.drive) } : null,
  ]);

  return groups;
}
