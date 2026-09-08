import classNames from "classnames";

type Props = {
  className?: string;
  compact?: boolean;
  markOnly?: boolean;
  tone?: "dark" | "light";
};

export function Logo({ className, compact, markOnly, tone = "dark" }: Props) {
  return (
    <span
      className={classNames("logo", className, {
        "logo--compact": compact,
        "logo--light": tone === "light",
        "logo--dark": tone === "dark",
      })}
    >
      <img
        className="logo-mark"
        src={`${import.meta.env.BASE_URL}brand/artauto-logo.png?v=8`}
        alt="АртАвто"
      />
      {!markOnly && (
        <span className="logo-text">
          <strong>АртАвто</strong>
          {!compact && <em>Корея и Китай</em>}
        </span>
      )}
    </span>
  );
}
