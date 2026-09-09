/**
 * Fix brand/model display names (e.g. "BMW BMW" → "BMW 3 Series").
 * Usage: npx tsx src/sanitize-names.ts
 */
import { loadStore, saveStore } from "./db.js";
import { latinizeVehicle, stripCjk, inferModelFromTrim } from "./services/latinNames.js";

function looksBad(brand: string, model: string) {
  const b = brand.trim();
  const m = model.trim();
  if (!m || m === "Model" || m === "Unknown") return true;
  if (m.toLowerCase() === b.toLowerCase()) return true;
  if (/^(?:\d(?:[.,]\d)?\s*[LlTt]|[\d.]+\s*L\s*\d*)$/i.test(m)) return true;
  return false;
}

const store = loadStore();
let fixed = 0;
let stillBad = 0;
const samples: Array<Record<string, string>> = [];

for (const v of store.vehicles) {
  const before = `${v.brand} ${v.model}`;
  const names = latinizeVehicle(v.brand, v.model, v.trim || v.generation || "");
  let brand = names.brand;
  let model = names.model;

  if (!model || looksBad(brand, model)) {
    const inferred = inferModelFromTrim(brand, v.trim || "", v.model || "");
    if (inferred) model = inferred;
  }

  // Keep a meaningful trim: if trim empty but model was a badge like 320Li, don't wipe
  v.brand = brand;
  v.model = model || stripCjk(v.model) || "Model";
  if (looksBad(v.brand, v.model)) {
    // last resort: use first token of trim if it looks like a name/code
    const t = stripCjk(v.trim || "");
    const token = t.split(/\s+/)[0] || "";
    if (token && !/^(?:\d(?:[.,]\d)?[LlTt]?|TFSI|TDI|quattro)$/i.test(token) && token.toLowerCase() !== brand.toLowerCase()) {
      v.model = token;
    }
  }

  v.trim = stripCjk(v.trim);
  v.generation = stripCjk(v.generation);
  v.fuel_type = stripCjk(v.fuel_type);
  v.transmission = stripCjk(v.transmission);
  v.drive = stripCjk(v.drive);
  v.color = stripCjk(v.color);
  v.body_type = stripCjk(v.body_type);
  v.public_slug = `${v.source}-${v.source_listing_id}`;

  const after = `${v.brand} ${v.model}`;
  if (after !== before) {
    fixed += 1;
    if (samples.length < 25) samples.push({ before, after, trim: v.trim || "" });
  }
  if (looksBad(v.brand, v.model)) stillBad += 1;
}

saveStore(store);
console.log(JSON.stringify({ total: store.vehicles.length, fixed, stillBad, samples }, null, 2));
