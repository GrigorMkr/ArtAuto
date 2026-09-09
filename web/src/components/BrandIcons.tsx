/** Compact brand marks for source / messenger links on vehicle cards. */

type IconProps = { className?: string; title?: string };

export function TelegramIcon({ className, title = "Telegram" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role="img">
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.695.06-1.219-.46-1.89-.902-1.049-.693-1.641-1.124-2.658-1.8-1.175-.781-.413-1.21.258-1.91.176-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}

/** Encar-inspired green mark (not trademark-exact — for attribution button). */
export function EncarIcon({ className, title = "Encar" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden={title ? undefined : true} role="img">
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="8" fill="#00A651" />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="14"
      >
        E
      </text>
    </svg>
  );
}

/** Dongchedi-inspired mark for attribution button. */
export function DongchediIcon({ className, title = "Dongchedi" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden={title ? undefined : true} role="img">
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="8" fill="#FF6A00" />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="14"
      >
        D
      </text>
    </svg>
  );
}

export function sourceBrand(source: string) {
  if (source === "encar") {
    return { label: "Оригинал на Encar", Icon: EncarIcon, host: "encar.com" };
  }
  if (source === "dongchedi") {
    return { label: "Оригинал на Dongchedi", Icon: DongchediIcon, host: "dongchedi.com" };
  }
  return { label: "Оригинал объявления", Icon: null, host: "" };
}
