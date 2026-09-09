/**
 * Scrub CJK from transmission / fuel / drive / trim_specs_json in store.
 * Usage: npx tsx src/scrub-display.ts
 */
import { loadStore, saveStore } from "./db.js";
import {
  localizeTransmission,
  localizeFuel,
  localizeDrive,
  scrubDisplayValue,
  deserializeTrimSpecs,
  serializeTrimSpecs,
} from "./services/trimSpecs.js";

const store = loadStore();
let touched = 0;
let cjkLeft = 0;

for (const v of store.vehicles) {
  let changed = false;
  const nextTrans = localizeTransmission(v.transmission || "");
  if (nextTrans && nextTrans !== v.transmission) {
    v.transmission = nextTrans;
    changed = true;
  }
  const nextFuel = localizeFuel(v.fuel_type || "");
  if (nextFuel && nextFuel !== v.fuel_type) {
    v.fuel_type = nextFuel;
    changed = true;
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
      for (const row of g.rows) {
        const label = scrubDisplayValue(row.label);
        let value = row.value;
        if (/КПП|коробк|transmission/i.test(row.label) || /КПП/.test(g.title)) {
          value = localizeTransmission(value);
        } else if (/топлив|fuel|энерг/i.test(row.label)) {
          value = localizeFuel(value);
        } else if (/привод|drive/i.test(row.label)) {
          value = localizeDrive(value);
        } else {
          value = scrubDisplayValue(value);
        }
        if (label !== row.label || value !== row.value) {
          row.label = label || row.label;
          row.value = value;
          gChanged = true;
        }
      }
    }
    if (gChanged) {
      specs.trim_specs_json = serializeTrimSpecs(groups);
      v.specifications = specs;
      changed = true;
    }
  }

  if (changed) touched += 1;
  if (/[\u3400-\u9fff]/.test(JSON.stringify(v))) cjkLeft += 1;
}

saveStore(store);
console.log(JSON.stringify({ touched, cjkLeft, total: store.vehicles.length }, null, 2));
