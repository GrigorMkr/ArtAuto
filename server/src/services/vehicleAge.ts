/** Vehicle age for customs/recycling (TKS / EEC Decision 74 style). */

export function parseYearMonth(raw?: string | number | null): { year: number; month: number } | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    if (raw >= 190001 && raw <= 210012) {
      const year = Math.floor(raw / 100);
      const month = raw % 100;
      if (month >= 1 && month <= 12) return { year, month };
    }
    if (raw >= 1 && raw <= 12) return null;
  }
  const s = String(raw).trim();
  const m6 = s.match(/^(\d{4})(\d{2})$/);
  if (m6) {
    const year = Number(m6[1]);
    const month = Number(m6[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const mSlash = s.match(/^(\d{4})[./-](\d{1,2})$/);
  if (mSlash) {
    const year = Number(mSlash[1]);
    const month = Number(mSlash[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return null;
}

/**
 * Exact age in years from production/first-registration date.
 * Falls back to mid-year (July) when only calendar year is known.
 */
export function vehicleAgeYears(params: {
  year: number;
  month?: number | null;
  yearMonth?: string | number | null;
  asOf?: Date;
}): number {
  const asOf = params.asOf || new Date();
  const ym = parseYearMonth(params.yearMonth);
  const year = ym?.year || params.year;
  const month =
    ym?.month ||
    (params.month && params.month >= 1 && params.month <= 12 ? params.month : 7);
  const produced = new Date(year, month - 1, 15);
  const ms = asOf.getTime() - produced.getTime();
  return Math.max(0, ms / (365.25 * 24 * 60 * 60 * 1000));
}

export const AGE_BAND_LABELS: Record<string, string> = {
  under_3: "до 3 лет",
  from_3_to_5: "3–5 лет",
  from_5_to_7: "5–7 лет",
  over_7: "старше 7 лет",
};
