export type Vehicle = {
  public_slug: string;
  country: "KR" | "CN";
  source: string;
  source_listing_id: string;
  source_url: string;
  status: string;
  brand: string;
  model: string;
  generation: string;
  trim: string;
  year: number | null;
  mileage_km: number | null;
  fuel_type: string;
  transmission: string;
  drive: string;
  body_type: string;
  engine_cc: number | null;
  power_hp: number | null;
  power_kw: number | null;
  color: string;
  foreign_price: number | null;
  foreign_currency: string;
  estimated_total_rub: number | null;
  specifications: Record<string, number | string>;
  images: string[];
};

export type CatalogFilters = {
  country?: string;
  brand?: string;
  model?: string;
  q?: string;
  fuel?: string;
  transmission?: string;
  drive?: string;
  body?: string;
  year_from?: string;
  year_to?: string;
  mileage_to?: string;
  price_from?: string;
  price_to?: string;
  power_from?: string;
  power_to?: string;
  limit?: number | string;
  offset?: number | string;
};

export type CatalogResponse = {
  items: Vehicle[];
  total: number;
  limit: number;
  offset: number;
};

export type CalcResult = {
  breakdown: Record<string, number>;
  total_rub: number;
  rates?: Record<string, number>;
  age_band?: string;
  recycling_note?: string;
};

export type MetaResponse = {
  brands: string[];
  models: Array<{ brand: string; model: string }>;
  commercial: Record<string, number>;
};

export type DealEvent = { at: string; status: string; title: string; text: string };

export type Deal = {
  id: number;
  user_id: number;
  created_at: string;
  vehicle_slug: string;
  brand: string;
  model: string;
  year: number | null;
  country: string;
  image: string;
  estimated_total_rub: number | null;
  comment: string;
  status: string;
  events: DealEvent[];
  steps: Array<{ status: string; title: string; text: string }>;
};
