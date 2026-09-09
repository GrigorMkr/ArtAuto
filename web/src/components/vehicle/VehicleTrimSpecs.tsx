import { memo, useState } from "react";

export type TrimSpecRow = { label: string; value: string };
export type TrimSpecGroup = { title: string; rows: TrimSpecRow[] };

type Props = { groups: TrimSpecGroup[] };

function parseGroups(raw: unknown): TrimSpecGroup[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as TrimSpecGroup[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseTrimSpecs(raw: unknown): TrimSpecGroup[] {
  return parseGroups(raw);
}

export const VehicleTrimSpecs = memo(function VehicleTrimSpecs({ groups }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.title, true]))
  );

  if (!groups.length) return null;

  return (
    <section className="trim-specs trim-specs--under-gallery">
      <header className="trim-specs__intro">
        <h3>Характеристики комплектации</h3>
        <p className="trim-specs__lede">С оригинала объявления</p>
      </header>

      <div className="trim-specs__cards">
        {groups.map((g) => {
          const isOpen = open[g.title] !== false;
          return (
            <article key={g.title} className="trim-specs__card">
              <button
                type="button"
                className="trim-specs__head"
                aria-expanded={isOpen}
                onClick={() => setOpen((s) => ({ ...s, [g.title]: !isOpen }))}
              >
                <span>{g.title}</span>
                <span className={`trim-specs__chev ${isOpen ? "is-open" : ""}`} aria-hidden>
                  ▾
                </span>
              </button>
              {isOpen ? (
                <dl className="trim-specs__rows">
                  {g.rows.map((r) => (
                    <div key={`${g.title}-${r.label}`}>
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
});
