import { importChina } from "./services/importer.js";

const limit = Number(process.argv[2] || 500);
console.log(`Importing China catalog (Dongchedi + Che168), limit=${limit}…`);
importChina(limit)
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
