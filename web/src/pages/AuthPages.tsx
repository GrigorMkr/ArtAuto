import { Helmet } from "react-helmet-async";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { Reveal } from "../components/Motion";

export function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const from = (loc.state as { from?: string } | null)?.from || "/cabinet";

  if (user) {
    const dest = user.role === "admin" && from === "/cabinet" ? "/admin" : from;
    return <Navigate to={dest} replace />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const u = await login(String(fd.get("email")), String(fd.get("password")));
      const dest = u.role === "admin" && (from === "/cabinet" || from === "/") ? "/admin" : from;
      nav(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Вход — АртАвто</title>
      </Helmet>
      <Reveal>
        <section className="page-intro">
          <p className="eyebrow">Кабинет</p>
          <h1>Вход</h1>
          <p className="lede">Следите за сделками и статусом доставки вашего авто.</p>
        </section>
      </Reveal>
      <Reveal delay={0.08}>
        <form className="auth-form" onSubmit={onSubmit}>
          {error && <p className="err">{error}</p>}
          <label>
            Email или телефон
            <input name="email" required autoComplete="username" />
          </label>
          <label>
            Пароль
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "Входим…" : "Войти"}
          </button>
          <p className="muted">
            Нет аккаунта? <Link to="/register">Регистрация</Link>
          </p>
        </form>
      </Reveal>
    </>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/cabinet" replace />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await register({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        phone: String(fd.get("phone")),
        password: String(fd.get("password")),
      });
      nav("/cabinet", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Регистрация — АртАвто</title>
      </Helmet>
      <Reveal>
        <section className="page-intro">
          <p className="eyebrow">Кабинет</p>
          <h1>Регистрация</h1>
          <p className="lede">Личный кабинет для сделок, статусов отправки и расчётов с АртАвто.</p>
        </section>
      </Reveal>
      <Reveal delay={0.08}>
        <form className="auth-form" onSubmit={onSubmit}>
          {error && <p className="err">{error}</p>}
          <label>
            Имя
            <input name="name" required autoComplete="name" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Телефон
            <input name="phone" required autoComplete="tel" placeholder="+7…" />
          </label>
          <label>
            Пароль
            <input name="password" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "Создаём…" : "Создать кабинет"}
          </button>
          <p className="muted">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </form>
      </Reveal>
    </>
  );
}
