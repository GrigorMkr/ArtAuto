import { memo } from "react";
import classNames from "classnames";

const TABS = [
  { id: "", label: "Все авто" },
  { id: "CN", label: "Китай" },
  { id: "KR", label: "Корея" },
] as const;

type Props = {
  country?: string;
  onChange: (country: string) => void;
};

export const CatalogCountryTabs = memo(function CatalogCountryTabs({
  country = "",
  onChange,
}: Props) {
  return (
    <div className="country-tabs">
      {TABS.map((t) => (
        <button
          key={t.id || "all"}
          type="button"
          className={classNames({ active: country === t.id })}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
});
