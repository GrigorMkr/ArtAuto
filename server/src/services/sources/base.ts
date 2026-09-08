export type NormalizedVehicle = {
  country: "KR" | "CN";
  source: string;
  source_listing_id: string;
  source_url?: string;
  brand: string;
  model: string;
  year?: number;
  mileage_km?: number;
  fuel_type?: string;
  transmission?: string;
  drive?: string;
  body_type?: string;
  engine_cc?: number;
  power_hp?: number;
  foreign_price?: number;
  foreign_currency?: string;
  images?: string[];
};

export interface SourceAdapter {
  name: string;
  getVehicle(id: string): Promise<NormalizedVehicle>;
  checkAvailable(id: string): Promise<boolean>;
}

/** Stub until AUTO_API_* credentials are provided */
export class StubFeedAdapter implements SourceAdapter {
  name = "stub";

  async getVehicle(_id: string): Promise<NormalizedVehicle> {
    throw new Error("Source API not configured. Set AUTO_API_ACCESS_NAME and AUTO_API_KEY later.");
  }

  async checkAvailable(_id: string): Promise<boolean> {
    return false;
  }
}
