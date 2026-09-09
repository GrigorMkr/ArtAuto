import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Reveal, Stagger, StaggerItem } from "../components/Motion";
import { TELEGRAM_URL, PHONE_LABEL, PHONE_TEL } from "../contacts";
import { TelegramIcon } from "../components/BrandIcons";

const pillars = [
  {
    title: "Прозрачная смета",
    text: "Цена под ключ до расчёта: авто, расходы в стране, логистика, таможня, утиль, брокер и доставка по РФ.",
  },
  {
    title: "Корея и Китай",
    text: "Работаем с Encar и Dongchedi: реальные лоты, фото с площадки и сопровождение сделки до выдачи.",
  },
  {
    title: "Под ключ",
    text: "От подбора до ЭПТС и доставки в ваш город — один маршрут, без «серых» сюрпризов на границе.",
  },
];

const steps = [
  { n: "01", title: "Консультация", text: "Фиксируем бюджет, страну и сроки — можно полностью дистанционно." },
  { n: "02", title: "Подбор", text: "Ищем лоты под задачу и сравниваем варианты по полной стоимости." },
  { n: "03", title: "Проверка", text: "История, состояние, комплектность — до выкупа на площадке." },
  { n: "04", title: "Выкуп", text: "Оплата, экспортные документы и отправка в порт." },
  { n: "05", title: "Таможня", text: "Пошлина, сбор, утиль — по правилам TKS / ЕЭК, с понятной разбивкой." },
  { n: "06", title: "Выдача", text: "Доставка по России и передача автомобиля с полным пакетом бумаг." },
];

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>О нас — АртАвто</title>
        <meta
          name="description"
          content="АртАвто — импорт автомобилей из Кореи и Китая под ключ: подбор, проверка, таможня и доставка."
        />
      </Helmet>

      <Reveal>
        <header className="page-hero">
          <div className="page-hero__copy">
            <p className="eyebrow">О компании</p>
            <h1>АртАвто</h1>
            <p className="page-hero__lede">
              Импорт автомобилей из Южной Кореи и Китая под ключ — от первого звонка до выдачи в Уфе и по всей
              России.
            </p>
            <div className="page-hero__actions">
              <Link className="btn btn-primary" to="/catalog">
                Смотреть каталог
              </Link>
              <a className="btn btn-telegram" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                <TelegramIcon className="btn__icon" />
                Telegram
              </a>
              <a className="btn btn-ghost" href={`tel:${PHONE_TEL}`}>
                {PHONE_LABEL}
              </a>
            </div>
          </div>
          <aside className="page-hero__aside" aria-label="Коротко о сервисе">
            <p className="page-hero__aside-label">Под ключ</p>
            <p className="page-hero__aside-title">Корея · Китай · Россия</p>
            <ul className="page-hero__aside-list">
              <li>Encar и Dongchedi</li>
              <li>Расчёт как на TKS</li>
              <li>Таможня и утиль</li>
              <li>Доставка до вашего города</li>
            </ul>
          </aside>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="rich-section">
          <div className="section-head">
            <p className="eyebrow">Почему мы</p>
            <h2>Считаем заранее — везём без сюрпризов</h2>
            <p className="section-lead">
              Клиент видит полную стоимость до сделки: не «цена на площадке», а итоговая сумма во Владивостоке и
              дальше по России.
            </p>
          </div>
          <Stagger className="pillar-grid">
            {pillars.map((p, i) => (
              <StaggerItem key={p.title} className={`stagger-d${(i % 8) + 1}`}>
                <article className="pillar-card">
                  <span className="pillar-card__n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="rich-section">
          <div className="section-head">
            <p className="eyebrow">Процесс</p>
            <h2>Как устроена работа</h2>
            <p className="section-lead">Шесть понятных этапов — от консультации до ключей.</p>
          </div>
          <ol className="journey-grid">
            {steps.map((s) => (
              <li key={s.n} className="journey-card">
                <span className="journey-card__n">{s.n}</span>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="cta-band">
          <div className="cta-band__copy">
            <p className="eyebrow">Следующий шаг</p>
            <h2>Подберём авто или посчитаем ваш лот</h2>
            <p>Каталог с готовыми сметами или калькулятор по параметрам с площадки.</p>
          </div>
          <div className="cta-band__actions">
            <Link className="btn btn-primary" to="/catalog">
              Каталог
            </Link>
            <Link className="btn btn-ghost" to="/calculator">
              Калькулятор
            </Link>
            <Link className="btn btn-ghost" to="/contacts">
              Контакты
            </Link>
          </div>
        </section>
      </Reveal>
    </>
  );
}
