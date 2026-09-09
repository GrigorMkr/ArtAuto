import { Helmet } from "react-helmet-async";
import { LeadForm } from "../components/LeadForm";
import { Reveal } from "../components/Motion";
import { TelegramIcon } from "../components/BrandIcons";
import { PHONE_LABEL, PHONE_TEL, TELEGRAM_URL, TELEGRAM_USER } from "../contacts";

export function ContactsPage() {
  return (
    <>
      <Helmet>
        <title>Контакты — АртАвто</title>
        <meta
          name="description"
          content="Связаться с АртАвто: телефон, Telegram, заявка на подбор авто из Кореи и Китая."
        />
      </Helmet>

      <Reveal>
        <header className="page-hero page-hero--compact">
          <div className="page-hero__copy">
            <p className="eyebrow">Контакты</p>
            <h1>Связаться с АртАвто</h1>
            <p className="page-hero__lede">
              Подберём автомобиль и сделаем бесплатный предварительный расчёт — по телефону, в Telegram или по
              заявке.
            </p>
          </div>
        </header>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="contacts-stage">
          <div className="contacts-stack">
            <article className="contact-tile contact-tile--accent">
              <p className="contact-tile__label">Город</p>
              <h2>Уфа</h2>
              <p className="contact-tile__text">
                Консультации и договор — в том числе дистанционно. Доставка автомобилей по всей России.
              </p>
            </article>

            <article className="contact-tile">
              <p className="contact-tile__label">Телефон</p>
              <a className="contact-tile__link" href={`tel:${PHONE_TEL}`}>
                {PHONE_LABEL}
              </a>
              <p className="contact-tile__text">Ежедневно. Удобнее всего — короткий звонок или сообщение.</p>
              <a className="btn btn-primary" href={`tel:${PHONE_TEL}`}>
                Позвонить
              </a>
            </article>

            <article className="contact-tile">
              <p className="contact-tile__label">Telegram</p>
              <a
                className="contact-tile__link contact-tile__link--row"
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
              >
                <TelegramIcon className="contact-tile__icon" />
                @{TELEGRAM_USER}
              </a>
              <p className="contact-tile__text">Фото, видео и сметы по лотам — прямо в чате.</p>
              <a className="btn btn-telegram" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                <TelegramIcon className="btn__icon" />
                Написать
              </a>
            </article>
          </div>

          <div className="contacts-form-panel">
            <LeadForm title="Оставить заявку" />
            <p className="contacts-form-note">
              Обычно отвечаем в течение рабочего дня. Можно сразу указать бюджет, страну и желаемую модель.
            </p>
          </div>
        </div>
      </Reveal>
    </>
  );
}
