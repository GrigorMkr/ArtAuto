/**
 * Re-fetch Dongchedi series_name for cars with broken brand/model.
 * Usage: npx tsx src/fix-cn-names.ts [limit]
 */
import { loadStore, saveStore } from "./db.js";
import { latinizeVehicle, stripCjk } from "./services/latinNames.js";

async function fetchSeries(skuId: string): Promise<{ brand: string; series: string; car: string } | null> {
  const url = `https://m.dcdapp.com/motor/sh_information/api/h5/sku_detail/full?sku_id=${encodeURIComponent(skuId)}&aid=1839`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(28000),
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        Referer: `https://m.dongchedi.com/usedcar/${skuId}`,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    let brand = "";
    let series = "";
    let car = "";
    const dig = (n: unknown, depth = 0) => {
      if (!n || depth > 18) return;
      if (Array.isArray(n)) {
        for (const x of n) dig(x, depth + 1);
        return;
      }
      if (typeof n === "object") {
        const o = n as Record<string, unknown>;
        if (!brand && o.brand_name) brand = String(o.brand_name);
        if (!series && o.series_name) series = String(o.series_name);
        if (!car && (o.car_name || o.sku_name)) car = String(o.car_name || o.sku_name);
        for (const v of Object.values(o)) dig(v, depth + 1);
      }
    };
    dig(json);
    if (!series && !brand) return null;
    return { brand, series, car };
  } catch {
    return null;
  }
}

function looksBad(brand: string, model: string) {
  const b = brand.trim();
  const m = model.trim();
  if (!m || m === "Model" || m === "Unknown") return true;
  if (m.toLowerCase() === b.toLowerCase()) return true;
  if (/^(?:\d(?:[.,]\d)?\s*[LlTt]|[\d.]+\s*L\s*\d*)$/i.test(m)) return true;
  if (/^(?:\d(?:[.,]\d)?[LlTt].*|\d+kWh|TFSI|TDI|eDrive|Sportback|quattro|xDrive)/i.test(m)) return true;
  if (/^\d{2,3}\s*(?:TFSI|TDI|TSI|eDrive)/i.test(m)) return true;
  if (/\b(?:TFSI|TDI|xDrive|Sportback)\b/i.test(m) && !/\b(?:A[1-8]|Q[2-8]|X[1-7]|[1-8]\s*Series|RS\s*\d)\b/i.test(m))
    return true;
  if (/\bquattro\b/i.test(m) && !/quattroporte/i.test(m) && !/\b(?:A[1-8]|Q[2-8])\b/i.test(m)) return true;
  if (/PRO\s*\d|620KM|390T|270T/i.test(m) && m.length < 24) return true;
  return false;
}

const limit = Number(process.argv[2] || 800);

async function main() {
  const store = loadStore();
  const rows = store.vehicles.filter(
    (v) => v.source === "dongchedi" && v.status === "AVAILABLE" && looksBad(v.brand, v.model)
  );
  const target = rows.slice(0, limit);
  console.log(`Fixing CN names for ${target.length}/${rows.length} cars…`);

  let updated = 0;
  const concurrency = 6;
  for (let i = 0; i < target.length; i += concurrency) {
    const chunk = target.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (v) => {
        const got = await fetchSeries(v.source_listing_id);
        if (!got) return;
        const names = latinizeVehicle(got.brand || v.brand, got.series || "", got.car || v.trim || "");
        let model = names.model;
        if (!model || looksBad(names.brand, model)) {
          // Fall back to Latin-stripped series from Dongchedi (e.g. "CS75 PLUS", "ES7")
          const rawSeries = stripCjk(got.series || "");
          const cleaned = rawSeries
            .replace(new RegExp(`^${names.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
            .trim();
          if (cleaned && cleaned.toLowerCase() !== names.brand.toLowerCase()) model = cleaned;
        }
        if (!model || looksBad(names.brand, model)) return;
        const before = `${v.brand} ${v.model}`;
        v.brand = names.brand;
        v.model = model;
        if (got.car) {
          const trim = stripCjk(got.car);
          if (trim) v.trim = trim;
        }
        updated += 1;
        console.log(`  ${before} → ${v.brand} ${v.model}`);
      })
    );
    if (i + concurrency < target.length) await new Promise((r) => setTimeout(r, 120));
  }

  // Second pass: local latinize for anything still left
  let local = 0;
  for (const v of store.vehicles) {
    if (v.status !== "AVAILABLE") continue;
    const names = latinizeVehicle(v.brand, v.model, v.trim || "");
    if (names.model && names.model !== v.model && !looksBad(names.brand, names.model)) {
      v.brand = names.brand;
      v.model = names.model;
      local += 1;
    } else if (names.brand !== v.brand) {
      v.brand = names.brand;
    }
  }

  const still = store.vehicles.filter(
    (v) => v.status === "AVAILABLE" && looksBad(v.brand, v.model)
  ).length;

  saveStore(store);
  console.log(JSON.stringify({ updated, local, stillBad: still }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
