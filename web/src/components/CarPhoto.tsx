import { useEffect, useState } from "react";
import classNames from "classnames";
import { mediaUrl } from "../api";

type Props = {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
};

function chinaFallbacks(src?: string) {
  if (!src) return [] as string[];
  const list = [
    mediaUrl(src),
    src.startsWith("http") ? `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=jpg&w=900&q=80` : "",
    src.startsWith("http") ? src : "",
  ];
  return [...new Set(list.filter(Boolean))];
}

export function CarPhoto({ src, alt, className, eager }: Props) {
  const [idx, setIdx] = useState(0);
  const candidates = chinaFallbacks(src);
  const url = candidates[idx] || "";

  useEffect(() => {
    setIdx(0);
  }, [src]);

  if (!url || idx >= candidates.length) {
    return (
      <div className={classNames("vehicle-card__placeholder", className)} aria-hidden>
        {(alt || "AA").slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setIdx((v) => v + 1)}
    />
  );
}
