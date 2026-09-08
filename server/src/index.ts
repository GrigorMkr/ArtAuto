import "dotenv/config";
import express from "express";
import cors from "cors";
import { migrate, loadStore } from "./db.js";
import { seed } from "./seed.js";
import { api } from "./routes.js";
import { startDailySync } from "./services/sync.js";

migrate();
const seeded = seed();
console.log(`Settings ready, vehicles=${seeded.vehicles}, purgedMocks=${seeded.purged}, admin=${seeded.admin}`);

startDailySync();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", api);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`ArtAuto API http://127.0.0.1:${port}`);
  console.log(`Live cars: ${loadStore().vehicles.length}`);
});
