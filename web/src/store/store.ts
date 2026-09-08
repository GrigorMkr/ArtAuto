import { configureStore } from "@reduxjs/toolkit";
import { artautoApi } from "./apiSlice";

export const store = configureStore({
  reducer: {
    [artautoApi.reducerPath]: artautoApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(artautoApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
