import { memo } from "react";
import { NavLink } from "react-router-dom";
import classNames from "classnames";
import { Logo } from "../Logo";
import { PHONE_LABEL, PHONE_TEL } from "../../contacts";

export const NAV_LINKS = [
  { to: "/catalog", label: "Каталог" },
  { to: "/about", label: "О нас" },
  { to: "/calculator", label: "Калькулятор" },
  { to: "/contacts", label: "Контакты" },
] as const;

type User = { role?: string } | null;

type Props = {
  isHome: boolean;
  scrolled: boolean;
  user: User;
  onCatalogHover: () => void;
};

export const SiteHeader = memo(function SiteHeader({
  isHome,
  scrolled,
  user,
  onCatalogHover,
}: Props) {
  return (
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
        {NAV_LINKS.map((l) => (
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
  );
});
