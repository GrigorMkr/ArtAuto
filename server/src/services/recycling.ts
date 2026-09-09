/**
 * Personal-use recycling (физлицо) per PP RF №1291 as amended by №1713,
 * rates from 01.01.2026 — matches Silver Auto (e.g. BMW X5 340 hp → 20 000×136,32).
 */

export const PREFERENTIAL_POWER_KW = 117.68;
export const BASE_RECYCLING_RUB = 20000;

export function recyclingAgeGroup(ageYears: number) {
  if (ageYears < 3) return "under_3";
  if (ageYears < 5) return "from_3_to_5";
  if (ageYears < 7) return "from_5_to_7";
  return "over_7";
}

function isUnder3(ageGroup: string) {
  return ageGroup === "under_3";
}

type Band = { kwTo: number; under3: number; over3: number };

/** Engine cc groups with power bands (kW upper bound inclusive). */
const ICE_TABLE: Array<{ ccTo: number | null; bands: Band[] }> = [
  {
    ccTo: 1000,
    bands: [
      { kwTo: 117.68, under3: 0.17, over3: 0.26 },
      { kwTo: 139.75, under3: 15.36, over3: 28.44 },
      { kwTo: 161.81, under3: 15.84, over3: 29.28 },
      { kwTo: 183.88, under3: 16.2, over3: 30.12 },
      { kwTo: Infinity, under3: 17.28, over3: 30.12 },
    ],
  },
  {
    ccTo: 2000,
    bands: [
      { kwTo: 117.68, under3: 0.17, over3: 0.26 },
      { kwTo: 139.75, under3: 45, over3: 74.64 },
      { kwTo: 161.81, under3: 47.64, over3: 79.2 },
      { kwTo: 183.88, under3: 50.52, over3: 83.88 },
      { kwTo: 205.94, under3: 57.12, over3: 91.92 },
      { kwTo: 228, under3: 64.56, over3: 100.56 },
      { kwTo: 250.07, under3: 72.96, over3: 110.16 },
      { kwTo: 272.13, under3: 83.16, over3: 120.6 },
      { kwTo: 294.2, under3: 94.8, over3: 132 },
      { kwTo: 316.26, under3: 108, over3: 144.6 },
      { kwTo: 338.33, under3: 123.24, over3: 158.4 },
      { kwTo: 367.75, under3: 140.4, over3: 173.4 },
      { kwTo: Infinity, under3: 160.08, over3: 189.84 },
    ],
  },
  {
    ccTo: 3000,
    bands: [
      { kwTo: 117.68, under3: 0.17, over3: 0.26 },
      { kwTo: 139.75, under3: 115.34, over3: 172.8 },
      { kwTo: 161.81, under3: 118.2, over3: 175.08 },
      { kwTo: 183.88, under3: 120.12, over3: 177.6 },
      { kwTo: 205.94, under3: 126, over3: 183 },
      { kwTo: 228, under3: 131.04, over3: 188.52 },
      { kwTo: 250.07, under3: 136.32, over3: 193.68 },
      { kwTo: 272.13, under3: 141.72, over3: 199.08 },
      { kwTo: 294.2, under3: 147.48, over3: 204.72 },
      { kwTo: 316.26, under3: 153.36, over3: 210.48 },
      { kwTo: 338.33, under3: 159.48, over3: 216.36 },
      { kwTo: 367.75, under3: 165.84, over3: 222.48 },
      { kwTo: Infinity, under3: 172.44, over3: 228.84 },
    ],
  },
  {
    ccTo: null,
    bands: [
      { kwTo: 117.68, under3: 0.17, over3: 0.26 },
      { kwTo: 139.75, under3: 131.76, over3: 200.04 },
      { kwTo: 161.81, under3: 134.88, over3: 202.8 },
      { kwTo: 183.88, under3: 137.04, over3: 205.2 },
      { kwTo: 205.94, under3: 146.28, over3: 213.6 },
      { kwTo: 228, under3: 152.16, over3: 219.36 },
      { kwTo: 250.07, under3: 158.04, over3: 225.36 },
      { kwTo: 272.13, under3: 164.4, over3: 231.6 },
      { kwTo: 294.2, under3: 171.0, over3: 238.2 },
      { kwTo: 316.26, under3: 177.84, over3: 245.04 },
      { kwTo: 338.33, under3: 184.92, over3: 252.12 },
      { kwTo: 367.75, under3: 192.24, over3: 259.44 },
      { kwTo: Infinity, under3: 199.8, over3: 267.0 },
    ],
  },
];

function pickCoefficient(engineCc: number, powerKw: number, under3: boolean) {
  const group =
    ICE_TABLE.find((g) => g.ccTo == null || engineCc <= g.ccTo) || ICE_TABLE[ICE_TABLE.length - 1];
  const band = group.bands.find((b) => powerKw <= b.kwTo) || group.bands[group.bands.length - 1];
  return under3 ? band.under3 : band.over3;
}

export function calculateRecyclingFee(params: {
  ageGroup: string;
  fuelType?: string;
  engineCc: number;
  powerKw: number;
  personalUse?: boolean;
}) {
  const under3 = isUnder3(params.ageGroup);
  const engineCc = Math.max(params.engineCc || 1500, 1);
  const powerKw = Math.max(params.powerKw || 0, 0);

  // EV / sequential hybrid: keep preferential if ≤80 hp (~58.84 kW), else use mid ICE-like band note via high coeffs
  const isEv = params.fuelType === "electric";
  if (isEv) {
    if (powerKw <= 58.84) {
      return under3 ? 3400 : 5200;
    }
    // approximate EV commercial ladder (01.01.2026 personal section 3) — mid band
    const evUnder = powerKw <= 117.68 ? 78 : powerKw <= 183.88 ? 129.96 : 182.4;
    const evOver = powerKw <= 117.68 ? 111.36 : powerKw <= 183.88 ? 176.16 : 239.04;
    return Math.round(BASE_RECYCLING_RUB * (under3 ? evUnder : evOver));
  }

  const coeff = pickCoefficient(engineCc, powerKw, under3);
  if (coeff <= 1) {
    return under3 ? 3400 : 5200;
  }
  return Math.round(BASE_RECYCLING_RUB * coeff);
}

export function recyclingCoefficient(params: {
  ageGroup: string;
  engineCc: number;
  powerKw: number;
  fuelType?: string;
}) {
  const fee = calculateRecyclingFee({ ...params, personalUse: true });
  return Math.round((fee / BASE_RECYCLING_RUB) * 100) / 100;
}

export function recyclingExplain(base: number, coefficient: number, total: number) {
  return `${base.toLocaleString("ru-RU")} ₽ × ${coefficient} = ${total.toLocaleString("ru-RU")} ₽`;
}
