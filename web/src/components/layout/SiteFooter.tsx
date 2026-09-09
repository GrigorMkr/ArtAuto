import { memo } from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "../Logo";
import { PHONE_LABEL, PHONE_TEL, TELEGRAM_URL } from "../../contacts";
import { NAV_LINKS } from "./SiteHeader";

type Props = { user: { role?: string } | null };

export const SiteFooter = memo(function SiteFooter({ user }: Props) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Logo tone="light" />
          <p>Автомобили из Южной Кореи и Китая с расчётом под ключ.</p>
        </div>
        <div>
          <h4>Разделы</h4>
          {NAV_LINKS.map((l) => (
            <NavLink key={`footer-${l.to}`} to={l.to}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/privacy">Политика конфиденциальности</NavLink>
        </div>
        <div>
          <h4>Связь</h4>
          <a href={`tel:${PHONE_TEL}`}>{PHONE_LABEL}</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">
            Telegram
          </a>
          <NavLink to={user ? "/cabinet" : "/register"}>
            {user ? "Личный кабинет" : "Регистрация"}
          </NavLink>
          <p>Уфа · доставка по РФ</p>
        </div>
      </div>
      <p className="footer-copy">
        © {new Date().getFullYear()} АртАвто · Ничего не спизжено — всё сделано самостоятельно для
        братана Артура от Григора
      </p>
    </footer>
  );
});
