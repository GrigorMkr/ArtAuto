export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("artauto_token");
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export type AdminStats = {
  total: number;
  korea: number;
  china: number;
  chinaPhotosCached: number;
  bySource: Record<string, number>;
  leads: number;
  deals: number;
};

export type AdminVehicle = {
  public_slug: string;
  country: string;
  source: string;
  status: string;
  brand: string;
  model: string;
  year: number | null;
  estimated_total_rub: number | null;
  images: string[];
  photo_cached: boolean;
};

export type AdminLead = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  city: string;
  message: string;
  vehicle_slug: string;
  status: string;
};

export type AdminSetting = {
  key: string;
  value: number;
  currency: string;
  description: string;
};

export type AdminFxRow = {
  code: string;
  official_rate_rub: number;
  commercial_markup_pct: number;
  manual_commercial_rate_rub: number | null;
};
