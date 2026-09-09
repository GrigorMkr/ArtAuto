import { seed } from "./seed.js";
import { repriceAllVehicles } from "./services/reprice.js";

seed();
const r = repriceAllVehicles();
console.log("reprice", r);
