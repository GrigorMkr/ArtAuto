import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { artautoApi } from "../store/apiSlice";
import type { AppDispatch } from "../store/store";

const PULSE_MS = 60_000;

function liveApiBase() {
  if (import.meta.env.VITE_API_URL) return String(import.meta.env.VITE_API_URL).replace(/\/$/, "");
  if (import.meta.env.DEV) return "http://127.0.0.1:4000/api";
  return "";
}

/**
 * Hidden FX watcher: every minute polls /fx/pulse.
 * When fingerprint changes, silently invalidates catalog/vehicle/meta caches
 * so prices refresh without a visible reload.
 */
export function FxPulseWatcher() {
  const dispatch = useDispatch<AppDispatch>();
  const fpRef = useRef<string>("");

  useEffect(() => {
    const base = liveApiBase();
    if (!base) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      try {
        const res = await fetch(`${base}/fx/pulse`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { fingerprint?: string };
        const fp = String(data.fingerprint || "");
        if (!fp) return;
        if (!fpRef.current) {
          fpRef.current = fp;
          return;
        }
        if (fp !== fpRef.current) {
          fpRef.current = fp;
          dispatch(artautoApi.util.invalidateTags(["Catalog", "Vehicle", "Meta"]));
        }
      } catch {
        /* silent — offline / static */
      }
    };

    tick();
    timer = setInterval(tick, PULSE_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [dispatch]);

  return null;
}
