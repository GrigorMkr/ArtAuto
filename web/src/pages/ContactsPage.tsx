import { Helmet } from "react-helmet-async";
import { LeadForm } from "../components/LeadForm";
import { Reveal } from "../components/Motion";
import { PHONE_LABEL, PHONE_TEL, TELEGRAM_URL, TELEGRAM_USER } from "../contacts";

export function ContactsPage() {
  return (
    <>
      <Helmet>
        <title>Контакты — АртАвто</title>
      </Helmet>

      <Reveal>
        <section className="page-intro">
          <p className="eyebrow">Контакты</p>
          <h1>Связаться с АртАвто</h1>
          <p className="lede">Подберём авто и сделаем бесплатный предварительный расчёт.</p>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="contacts-layout">
          <div className="contacts-card">
            <h2>Офис и связь</h2>
            <p>г. Уфа</p>
            <p>
              Телефон:{" "}
              <a href={`tel:${PHONE_TEL}`} className="contacts-phone">
                {PHONE_LABEL}
              </a>
            </p>
            <p>
              Telegram:{" "}
              <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                @{TELEGRAM_USER}
              </a>
            </p>
            <div className="contacts-cta">
              <a className="btn btn-telegram" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                Написать в Telegram
              </a>
              <a className="btn btn-primary" href={`tel:${PHONE_TEL}`}>
                Позвонить
              </a>
            </div>
            <p className="muted">Работаем ежедневно, консультации и договор — в том числе дистанционно.</p>
          </div>
          <LeadForm title="Оставить заявку" />
        </div>
      </Reveal>
    </>
  );
}
