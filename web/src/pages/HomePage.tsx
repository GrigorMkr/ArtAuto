import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useGetCatalogQuery } from "../store/apiSlice";
import { VehicleCard } from "../components/VehicleCard";
import { Logo } from "../components/Logo";
import { Stagger, StaggerItem } from "../components/Motion";

const steps = [
  { n: "01", title: "Консультация", text: "Считаем бюджет и фиксируем условия — в том числе дистанционно." },
  { n: "02", title: "Подбор", text: "Ищем лоты в Корее и Китае под ваши параметры." },
  { n: "03", title: "Проверка", text: "Диагностика, фото и видеоотчёт до выкупа." },
  { n: "04", title: "Выкуп и таможня", text: "Полная смета: авто, расходы, брокер, доставка, услуги, таможня, утиль." },
  { n: "05", title: "Доставка", text: "Привозим автомобиль в ваш город с пакетом документов." },
];

export function HomePage() {
  const { data } = useGetCatalogQuery({ limit: 6, offset: 0 });
  const preview = data?.items || [];

  return (
    <>
      <Helmet>
        <title>АртАвто — авто из Кореи и Китая под ключ</title>
        <meta
          name="description"
          content="Каталог автомобилей из Южной Кореи и Китая с прозрачным расчётом цены до вашего города."
        />
      </Helmet>

      <section className="hero">
        <div className="hero__bg" aria-hidden />
        <div className="hero__veil" aria-hidden />
        <div className="hero__frame hero__frame--enter">
          <div className="hero__copy">
            <h1 className="hero__headline">
              <span className="hero__word">
                <span className="hero__dropcap" aria-hidden="true">
                  <Logo tone="light" markOnly />
                  <span className="hero__dropcap-sheen" />
                </span>
                <span className="visually-hidden">А</span>
                <span className="hero__rest">втомобили</span>
              </span>
              <span className="hero__line">с прозрачным</span>
              <span className="hero__line hero__line--accent">расчётом</span>
            </h1>
            <p className="hero__text">
              Подбор, проверка и доставка — от лота до передачи в вашем городе.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary btn-hero" to="/catalog">
                Смотреть каталог
              </Link>
              <Link className="btn btn-on-dark btn-hero-ghost" to="/calculator">
                Калькулятор
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--process">
        <div className="section-head section-head--center">
          <p className="eyebrow">Как работаем</p>
          <h2>Пять шагов до вашего авто</h2>
          <p className="section-lead">От первого звонка до передачи ключей — один прозрачный маршрут.</p>
        </div>
        <Stagger className="process">
          {steps.map((s, i) => (
            <StaggerItem key={s.n} className={`stagger-d${(i % 8) + 1}`}>
              <article className="process-card">
                <span className="process-card__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="section">
        <div className="section-head row">
          <div>
            <p className="eyebrow">Подборка</p>
            <h2>Свежие предложения</h2>
          </div>
          <Link className="btn btn-ghost" to="/catalog">
            Весь каталог
          </Link>
        </div>
        <Stagger className="vehicle-grid">
          {preview.map((v, i) => (
            <StaggerItem key={v.public_slug} className={`stagger-d${(i % 8) + 1}`}>
              <VehicleCard vehicle={v} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  );
}
