import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { useDispatch } from "react-redux";
import { BrandLoader } from "./BrandLoader";
import { SiteHeader } from "./layout/SiteHeader";
import { SiteFooter } from "./layout/SiteFooter";
import { useAuth } from "../auth";
import { artautoApi } from "../store/apiSlice";
import type { AppDispatch } from "../store/store";
import { PHONE_LABEL, PHONE_TEL, TELEGRAM_URL } from "../contacts";
import { FxPulseWatcher } from "./FxPulseWatcher";

export { PHONE_TEL, PHONE_LABEL, TELEGRAM_URL };

function PageFallback() {
  return <p className="muted" style={{ padding: "2rem 1.25rem" }}>Загрузка…</p>;
}

export function Layout() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" } as ScrollToOptions);
  }, [location.pathname]);

  const onCatalogHover = useCallback(() => {
    dispatch(artautoApi.util.prefetch("getCatalog", { limit: 24, offset: 0 }, { force: false }));
  }, [dispatch]);

  return (
    <div className={classNames("app-shell", { "app-shell--home": isHome })}>
      <FxPulseWatcher />
      <BrandLoader />
      <div className="site-atmosphere" aria-hidden />
      <SiteHeader
        isHome={isHome}
        scrolled={scrolled}
        user={user}
        onCatalogHover={onCatalogHover}
      />
      <main className="site-main">
        <div key={location.pathname} className="page-enter">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <SiteFooter user={user} />
    </div>
  );
}
