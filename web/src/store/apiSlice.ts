import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CalcResult, CatalogFilters, CatalogResponse, Deal, MetaResponse, Vehicle } from "../types";
import { getToken } from "../auth";

export const artautoApi = createApi({
  reducerPath: "artautoApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  refetchOnMountOrArgChange: 120,
  tagTypes: ["Catalog", "Vehicle", "Meta", "Deals"],
  endpoints: (builder) => ({
    getCatalog: builder.query<CatalogResponse, CatalogFilters | void>({
      query: (filters) => ({ url: "/catalog", params: filters || {} }),
      transformResponse: (response: unknown, _meta, arg): CatalogResponse => {
        const limit = Math.min(Math.max(Number((arg as CatalogFilters | void)?.limit) || 24, 1), 60);
        const offset = Math.max(Number((arg as CatalogFilters | void)?.offset) || 0, 0);
        if (Array.isArray(response)) {
          return {
            items: response as Vehicle[],
            total: response.length,
            limit,
            offset,
          };
        }
        const r = (response || {}) as Partial<CatalogResponse>;
        const items = Array.isArray(r.items) ? r.items : [];
        return {
          items,
          total: typeof r.total === "number" ? r.total : items.length,
          limit: typeof r.limit === "number" ? r.limit : limit,
          offset: typeof r.offset === "number" ? r.offset : offset,
        };
      },
      providesTags: ["Catalog"],
      keepUnusedDataFor: 300,
    }),
    getVehicle: builder.query<Vehicle, string>({
      query: (slug) => `/vehicles/${encodeURIComponent(slug)}`,
      providesTags: (_r, _e, slug) => [{ type: "Vehicle", id: slug }],
    }),
    getMeta: builder.query<MetaResponse, void>({
      query: () => "/meta",
      providesTags: ["Meta"],
      keepUnusedDataFor: 600,
    }),
    createLead: builder.mutation<
      { id: number; status: string },
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/leads", method: "POST", body }),
    }),
    calculate: builder.mutation<CalcResult, Record<string, unknown>>({
      query: (body) => ({ url: "/calculator", method: "POST", body }),
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
