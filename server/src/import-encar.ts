import { importFromEncar } from "./services/importer.js";

const limit = Number(process.argv[2] || 1200);
console.log(`Importing up to ${limit} cars from Encar…`);
importFromEncar(limit)
  .then((r) => {
    console.log(r);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
