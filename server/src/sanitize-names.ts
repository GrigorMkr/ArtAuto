import { loadStore, saveStore } from "./db.js";
import { latinizeVehicle, stripCjk } from "./services/latinNames.js";

const store = loadStore();
for (const v of store.vehicles) {
  const names = latinizeVehicle(v.brand, v.model, v.trim || v.generation);
  v.brand = names.brand;
  v.model = names.model || stripCjk(v.model) || "Model";
  v.trim = stripCjk(v.trim);
  v.generation = stripCjk(v.generation);
  v.fuel_type = stripCjk(v.fuel_type);
  v.public_slug = `${v.source}-${v.source_listing_id}`;
}
saveStore(store);
console.log("sanitized", store.vehicles.length);
