import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateLeadMutation } from "../store/apiSlice";

type Props = {
  vehicleSlug?: string;
  calculationSnapshot?: Record<string, unknown>;
  title?: string;
};

export function LeadForm({ vehicleSlug, calculationSnapshot, title = "Хочу купить" }: Props) {
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await createLead({
        name: String(fd.get("name") || ""),
        phone: String(fd.get("phone") || ""),
        city: String(fd.get("city") || ""),
        message: String(fd.get("message") || ""),
        vehicle_slug: vehicleSlug || "",
        calculation_snapshot: calculationSnapshot || {},
        page_url: window.location.href,
      }).unwrap();
      setOk(true);
      e.currentTarget.reset();
    } catch {
      setError("Не удалось отправить заявку. Проверьте данные и попробуйте снова.");
    }
  }

  if (ok) {
    return (
      <div className="lead-box">
        <h3>{title}</h3>
        <p className="ok">Заявка отправлена. Мы свяжемся с вами в ближайшее время.</p>
      </div>
    );
  }

  return (
    <div className="lead-box">
      <h3>{title}</h3>
      {error && <p className="err">{error}</p>}
      <form className="lead-form" onSubmit={onSubmit}>
        <label>
          Имя
          <input name="name" required placeholder="Как к вам обращаться" />
        </label>
        <label>
          Телефон
          <input name="phone" required placeholder="+7…" />
        </label>
        <label>
          Город
          <input name="city" placeholder="Уфа" />
        </label>
        <label>
          Комментарий
          <textarea name="message" rows={3} placeholder="Модель, бюджет, сроки" />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Отправка…" : "Оставить заявку"}
        </button>
      </form>
    </div>
  );
}
