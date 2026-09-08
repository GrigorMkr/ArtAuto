import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { useDispatch } from "react-redux";
import { Logo } from "./Logo";
import { BrandLoader } from "./BrandLoader";
import { useAuth } from "../auth";
import { artautoApi } from "../store/apiSlice";
import type { AppDispatch } from "../store/store";

export const PHONE_TEL = "+79371555522";
export const PHONE_LABEL = "+7 (937) 155-55-22";

const links = [
  { to: "/catalog", label: "Каталог" },
  { to: "/calculator", label: "Калькулятор" },
  { to: "/contacts", label: "Контакты" },
] as const;

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
      <BrandLoader />
      <div className="site-atmosphere" aria-hidden />
      <header
        className={classNames("site-header", {
          "site-header--home": isHome,
          "site-header--scrolled": scrolled,
          "site-header--top": !scrolled,
        })}
      >
        <NavLink to="/" className="brand-link" aria-label="АртАвто — на главную">
          <Logo tone="light" compact />
        </NavLink>

        <nav className="site-nav" aria-label="Основное меню">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => classNames("nav-link", { active: isActive })}
              onMouseEnter={l.to === "/catalog" ? onCatalogHover : undefined}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <a className="header-phone" href={`tel:${PHONE_TEL}`}>
            {PHONE_LABEL}
          </a>
            {user ? (
              <>
                {user.role === "admin" && (
                  <NavLink to="/admin" className="header-cta header-cta--ghost">
                    Админ
                  </NavLink>
                )}
                <NavLink to="/cabinet" className="header-cta">
                  Кабинет
                </NavLink>
              </>
            ) : (
              <NavLink to="/login" className="header-cta">
                Войти
              </NavLink>
            )}
        </div>
      </header>

      <main className="site-main">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <Logo tone="light" />
            <p>Автомобили из Южной Кореи и Китая с расчётом под ключ.</p>
          </div>
          <div>
            <h4>Разделы</h4>
            {links.map((l) => (
              <NavLink key={`footer-${l.to}`} to={l.to}>
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/privacy">Политика конфиденциальности</NavLink>
          </div>
          <div>
            <h4>Связь</h4>
            <a href={`tel:${PHONE_TEL}`}>{PHONE_LABEL}</a>
            <NavLink to={user ? "/cabinet" : "/register"}>{user ? "Личный кабинет" : "Регистрация"}</NavLink>
            <p>Уфа · доставка по РФ</p>
          </div>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} АртАвто · Ничего не спизжено — всё сделано самостоятельно для братана Артура от Григора
        </p>
      </footer>
    </div>
  );
}
