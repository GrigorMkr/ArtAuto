import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Motion";
import { TELEGRAM_URL, PHONE_LABEL, PHONE_TEL } from "../contacts";

const steps = [
  { title: "Подбор", text: "Подбираем автомобили из Кореи и Китая под бюджет и задачи." },
  { title: "Проверка", text: "Проверяем историю, состояние и комплектность перед выкупом." },
  { title: "Покупка", text: "Выкупаем лот на площадке и сопровождаем оплату." },
  { title: "Доставка", text: "Организуем логистику до порта и морскую перевозку во Владивосток." },
  { title: "Таможня", text: "Считаем и проводим таможенное оформление, утильсбор и документы." },
  { title: "Выдача", text: "Доставляем по России и передаём автомобиль с полным пакетом бумаг." },
];

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>О нас — АртАвто</title>
      </Helmet>

      <Reveal>
        <section className="page-intro">
          <p className="eyebrow">О нас</p>
          <h1>АртАвто</h1>
          <p className="lede">
            Импорт автомобилей из Южной Кореи и Китая под ключ: от подбора до выдачи в Уфе и по всей России.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="about-panel">
          <h2>Чем занимаемся</h2>
          <p>
            АртАвто помогает купить проверенный автомобиль за рубежом без сюрпризов по цене. Мы считаем полную
            стоимость до России заранее: цена авто, расходы в стране, логистика, таможня, утильсбор, брокер и
            доставка по РФ.
          </p>
          <p>
            Работаем с площадками Encar (Корея) и Dongchedi (Китай), сопровождаем клиента на каждом этапе и держим
            связь по телефону и в Telegram.
          </p>
          <div className="detail-actions" style={{ marginTop: "1.25rem" }}>
            <Link className="btn btn-primary" to="/catalog">
              Смотреть каталог
            </Link>
            <a className="btn btn-telegram" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              Написать в Telegram
            </a>
            <a className="btn btn-ghost" href={`tel:${PHONE_TEL}`}>
              {PHONE_LABEL}
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="about-steps">
          <h2>Как устроен процесс</h2>
          <ol className="about-steps__list">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="about-steps__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>
    </>
  );
}
