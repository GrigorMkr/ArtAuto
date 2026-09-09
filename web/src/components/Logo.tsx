import classNames from "classnames";

type Props = {
  className?: string;
  compact?: boolean;
  markOnly?: boolean;
  /** Icon + wordmark (nav). Default true when not markOnly. */
  showWordmark?: boolean;
  tone?: "dark" | "light";
};

const base = () => import.meta.env.BASE_URL || "/";

export function Logo({ className, compact, markOnly, showWordmark, tone = "dark" }: Props) {
  const wordmark = showWordmark ?? !markOnly;

  return (
    <span
      className={classNames("logo", className, {
        "logo--compact": compact,
        "logo--light": tone === "light",
        "logo--dark": tone === "dark",
        "logo--with-wordmark": wordmark && !markOnly,
      })}
    >
      <img
        className="logo-mark"
        src={`${base()}brand/artauto-logo.png?v=8`}
        alt={markOnly || !wordmark ? "АртАвто" : ""}
      />
      {wordmark && !markOnly && (
        <img
          className="logo-wordmark"
          src={`${base()}brand/artauto-wordmark.png?v=1`}
          alt="АРТАВТО"
        />
      )}
    </span>
  );
}

/** Large hero brand lockup — wordmark as primary signal */
export function HeroBrand({ className }: { className?: string }) {
  return (
    <div className={classNames("hero-brand", className)}>
      <img
        className="hero-brand__wordmark"
        src={`${base()}brand/artauto-wordmark.png?v=1`}
        alt="АРТАВТО"
      />
    </div>
  );
}
