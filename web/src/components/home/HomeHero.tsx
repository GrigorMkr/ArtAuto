import { memo } from "react";
import { Link } from "react-router-dom";
import { HeroBrand } from "../Logo";

export const HomeHero = memo(function HomeHero() {
  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden />
      <div className="hero__veil" aria-hidden />
      <div className="hero__frame hero__frame--enter">
        <div className="hero__copy">
          <HeroBrand />
          <h1 className="hero__tagline">
            Автомобили из Кореи и Китая
            <span className="hero__tagline-accent">с прозрачным расчётом</span>
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
  );
});
