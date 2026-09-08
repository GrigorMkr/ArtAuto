import { syncAllCatalog } from "./services/sync.js";

const encar = Number(process.argv[2] || 700);
const dongchedi = Number(process.argv[3] || 500);

console.log(`Full catalog sync: Encar=${encar}, Dongchedi=${dongchedi}`);
syncAllCatalog({ encar, dongchedi })
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
