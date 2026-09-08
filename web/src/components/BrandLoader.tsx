import { useEffect, useState } from "react";
import classNames from "classnames";
import { Logo } from "./Logo";

const DURATION_MS = 5_000;

export function BrandLoader() {
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    const leaveAt = window.setTimeout(() => setPhase("leaving"), DURATION_MS);
    const doneAt = window.setTimeout(() => setPhase("done"), DURATION_MS + 700);
    document.documentElement.classList.add("is-brand-loading");
    return () => {
      window.clearTimeout(leaveAt);
      window.clearTimeout(doneAt);
      document.documentElement.classList.remove("is-brand-loading");
    };
  }, []);

  useEffect(() => {
    if (phase === "done") {
      document.documentElement.classList.remove("is-brand-loading");
    }
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={classNames("brand-loader", { "brand-loader--leave": phase === "leaving" })}
      role="status"
      aria-live="polite"
      aria-label="Загрузка АртАвто"
    >
      <div className="brand-loader__stack">
        <div className="brand-loader__mark">
          <Logo tone="light" markOnly />
          <span className="brand-loader__sheen" aria-hidden />
        </div>
        <div className="brand-loader__bar" aria-hidden>
          <span className="brand-loader__bar-fill" />
        </div>
      </div>
    </div>
  );
}
