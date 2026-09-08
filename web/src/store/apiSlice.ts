import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { CalcResult, CatalogFilters, CatalogResponse, Deal, MetaResponse, Vehicle } from "../types";
import { getToken } from "../auth";
import { staticCatalogQuery, staticMetaQuery, staticVehicleQuery } from "../staticCatalog";

/** Local: hit Express directly (Vite /api proxy is unreliable). Pages: no live API. */
function liveApiBase() {
  if (import.meta.env.VITE_API_URL) return String(import.meta.env.VITE_API_URL).replace(/\/$/, "");
  if (import.meta.env.DEV) return "http://127.0.0.1:4000/api";
  return "";
}

const rawLiveBaseQuery = fetchBaseQuery({
  baseUrl: liveApiBase() || "/api",
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const liveBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra
) => {
  if (!liveApiBase() && !import.meta.env.DEV) {
    return { error: { status: 503, data: "no_live_api" } as FetchBaseQueryError };
  }
  return rawLiveBaseQuery(args, api, extra);
};

function asCatalog(response: unknown, arg: CatalogFilters | void): CatalogResponse {
  const limit = Math.min(Math.max(Number(arg?.limit) || 24, 1), 60);
  const offset = Math.max(Number(arg?.offset) || 0, 0);
  if (Array.isArray(response)) {
    return { items: response as Vehicle[], total: response.length, limit, offset };
  }
  const r = (response || {}) as Partial<CatalogResponse>;
  const items = Array.isArray(r.items) ? r.items : [];
  return {
    items,
    total: typeof r.total === "number" ? r.total : items.length,
    limit: typeof r.limit === "number" ? r.limit : limit,
    offset: typeof r.offset === "number" ? r.offset : offset,
  };
}

export const artautoApi = createApi({
  reducerPath: "artautoApi",
  baseQuery: liveBaseQuery,
  refetchOnMountOrArgChange: 120,
  tagTypes: ["Catalog", "Vehicle", "Meta", "Deals"],
  endpoints: (builder) => ({
    getCatalog: builder.query<CatalogResponse, CatalogFilters | void>({
      async queryFn(arg) {
        const filters = arg || {};
        try {
          if (liveApiBase() || import.meta.env.DEV) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(filters)) {
              if (v != null && v !== "") params.set(k, String(v));
            }
            const url = `${liveApiBase() || "http://127.0.0.1:4000/api"}/catalog?${params}`;
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              return { data: asCatalog(json, filters) };
            }
          }
        } catch {
          /* fall through to static */
        }
        try {
          return { data: await staticCatalogQuery(filters) };
        } catch (e) {
          return { error: { status: 503, data: String(e) } as FetchBaseQueryError };
        }
      },
      providesTags: ["Catalog"],
      keepUnusedDataFor: 300,
    }),
    getVehicle: builder.query<Vehicle, string>({
      async queryFn(slug) {
        try {
          if (liveApiBase() || import.meta.env.DEV) {
            const url = `${liveApiBase() || "http://127.0.0.1:4000/api"}/vehicles/${encodeURIComponent(slug)}`;
            const res = await fetch(url);
            if (res.ok) return { data: (await res.json()) as Vehicle };
          }
        } catch {
          /* static */
        }
        try {
          const row = await staticVehicleQuery(slug);
          if (row) return { data: row };
          return { error: { status: 404, data: "not_found" } as FetchBaseQueryError };
        } catch (e) {
          return { error: { status: 503, data: String(e) } as FetchBaseQueryError };
        }
      },
      providesTags: (_r, _e, slug) => [{ type: "Vehicle", id: slug }],
    }),
    getMeta: builder.query<MetaResponse, { country?: string } | void>({
      async queryFn(arg) {
        const country = arg && "country" in arg ? arg.country : undefined;
        try {
          if (liveApiBase() || import.meta.env.DEV) {
            const q = country ? `?country=${encodeURIComponent(country)}` : "";
            const url = `${liveApiBase() || "http://127.0.0.1:4000/api"}/meta${q}`;
            const res = await fetch(url);
            if (res.ok) return { data: (await res.json()) as MetaResponse };
          }
        } catch {
          /* static */
        }
        try {
          return { data: await staticMetaQuery(country) };
        } catch (e) {
          return { error: { status: 503, data: String(e) } as FetchBaseQueryError };
        }
      },
      providesTags: ["Meta"],
      keepUnusedDataFor: 600,
    }),
    createLead: builder.mutation<{ id: number; status: string }, Record<string, unknown>>({
      query: (body) => ({ url: "/leads", method: "POST", body }),
    }),
    calculate: builder.mutation<CalcResult, Record<string, unknown>>({
      async queryFn(body) {
        try {
          if (liveApiBase() || import.meta.env.DEV) {
            const url = `${liveApiBase() || "http://127.0.0.1:4000/api"}/calculator`;
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (res.ok) return { data: (await res.json()) as CalcResult };
          }
        } catch {
          /* offline estimate unavailable */
        }
        return {
          error: {
            status: 503,
            data: "Калькулятор на статическом сайте недоступен — запустите API локально.",
          } as FetchBaseQueryError,
        };
      },
    }),
    getDeals: builder.query<Deal[], void>({
      query: () => "/cabinet/deals",
      providesTags: ["Deals"],
    }),
    createDeal: builder.mutation<Deal, Record<string, unknown>>({
      query: (body) => ({ url: "/cabinet/deals", method: "POST", body }),
      invalidatesTags: ["Deals"],
    }),
  }),
});

export const {
  useGetCatalogQuery,
  useGetVehicleQuery,
  useGetMetaQuery,
  useCreateLeadMutation,
  useCalculateMutation,
  useGetDealsQuery,
  useCreateDealMutation,
} = artautoApi;
