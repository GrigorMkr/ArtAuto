/**
 * Clear fake EV engine_cc, normalize fuel/KPP, reprice all vehicles.
 * Usage: npx tsx src/fix-customs-data.ts
 */
import { loadStore, saveStore } from "./db.js";
import { repriceAllVehicles } from "./services/reprice.js";
import {
  classifyTksFuel,
  localizeTransmission,
  localizeFuel,
  localizeDrive,
  scrubDisplayValue,
  deserializeTrimSpecs,
  serializeTrimSpecs,
} from "./services/trimSpecs.js";

const store = loadStore();
let clearedEvCc = 0;
let scrubbed = 0;

for (const v of store.vehicles) {
  let changed = false;
  const fuel = localizeFuel(v.fuel_type || "") || v.fuel_type;
  if (fuel && fuel !== v.fuel_type) {
    v.fuel_type = fuel;
    changed = true;
  }
  const tks = classifyTksFuel(v.fuel_type || "");
  if (tks === "electric") {
    if (v.engine_cc != null && v.engine_cc > 0) {
      v.engine_cc = null;
      clearedEvCc += 1;
      changed = true;
    }
    const nextTrans = localizeTransmission(v.transmission || "") || "Редуктор (EV)";
    if (nextTrans !== v.transmission) {
      v.transmission = nextTrans;
      changed = true;
    }
  } else {
    const nextTrans = localizeTransmission(v.transmission || "");
    if (nextTrans && nextTrans !== v.transmission) {
      v.transmission = nextTrans;
      changed = true;
    }
  }
  const nextDrive = localizeDrive(v.drive || "");
  if (nextDrive && nextDrive !== v.drive) {
    v.drive = nextDrive;
    changed = true;
  }

  const specs = v.specifications || {};
  const groups = deserializeTrimSpecs(specs.trim_specs_json);
  if (groups.length) {
    let gChanged = false;
    for (const g of groups) {
      g.rows = g.rows
        .map((row) => {
          let value = row.value;
          if (/КПП|коробк/i.test(row.label) || /КПП/.test(g.title)) {
            value =
              tks === "electric"
                ? "Редуктор (EV)"
                : localizeTransmission(value);
          } else if (/топлив|fuel/i.test(row.label)) value = localizeFuel(value);
          else if (/привод|drive/i.test(row.label)) value = localizeDrive(value);
          else value = scrubDisplayValue(value);
          return { ...row, value };
        })
        .filter((row) => {
          if (tks !== "electric") return Boolean(row.value);
          if (/объём|объем|см³|см3/i.test(row.label)) return false;
          if (/двигатель/i.test(row.label) && /^\s*1\.0\b/.test(row.value)) return false;
          return Boolean(row.value);
        });
      gChanged = true;
    }
    if (gChanged) {
      specs.trim_specs_json = serializeTrimSpecs(groups.filter((g) => g.rows.length));
      v.specifications = specs;
      changed = true;
    }
  }

  if (changed) scrubbed += 1;
}

saveStore(store);
const priced = repriceAllVehicles();
console.log(
  JSON.stringify(
    {
      scrubbed,
      clearedEvCc,
      repriced: priced.updated,
      total: priced.total,
    },
    null,
    2
  )
);
