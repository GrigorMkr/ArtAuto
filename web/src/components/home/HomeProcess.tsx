import { memo } from "react";
import { Stagger, StaggerItem } from "../Motion";

const STEPS = [
  { n: "01", title: "Консультация", text: "Считаем бюджет и фиксируем условия — в том числе дистанционно." },
  { n: "02", title: "Подбор", text: "Ищем лоты в Корее и Китае под ваши параметры." },
  { n: "03", title: "Проверка", text: "Диагностика, фото и видеоотчёт до выкупа." },
  { n: "04", title: "Выкуп и таможня", text: "Полная смета: авто, расходы, брокер, доставка, услуги, таможня, утиль." },
  { n: "05", title: "Доставка", text: "Привозим автомобиль в ваш город с пакетом документов." },
] as const;

const ProcessCard = memo(function ProcessCard({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <article className="process-card">
      <span className="process-card__n">{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
});

export const HomeProcess = memo(function HomeProcess() {
  return (
    <section className="section section--process">
      <div className="section-head section-head--center">
        <p className="eyebrow">Как работаем</p>
        <h2>Пять шагов до вашего авто</h2>
        <p className="section-lead">От первого звонка до передачи ключей — один прозрачный маршрут.</p>
      </div>
      <Stagger className="process">
        {STEPS.map((s, i) => (
          <StaggerItem key={s.n} className={`stagger-d${(i % 8) + 1}`}>
            <ProcessCard n={s.n} title={s.title} text={s.text} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
});
