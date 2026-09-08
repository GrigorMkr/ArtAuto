import { Helmet } from "react-helmet-async";
import { LeadForm } from "../components/LeadForm";
import { Reveal } from "../components/Motion";
import { PHONE_LABEL, PHONE_TEL } from "../components/Layout";

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
            <h2>Офис</h2>
            <p>г. Уфа</p>
            <p>
              Телефон: <a href={`tel:${PHONE_TEL}`}>{PHONE_LABEL}</a>
            </p>
            <p>
              Telegram:{" "}
              <a href="https://t.me/" target="_blank" rel="noreferrer">
                написать менеджеру
              </a>
            </p>
            <p className="muted">Работаем ежедневно, консультации и договор — в том числе дистанционно.</p>
          </div>
          <LeadForm title="Оставить заявку" />
        </div>
      </Reveal>
    </>
  );
}
