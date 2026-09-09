/** Public contact links for АртАвто */
export const PHONE_TEL = "+79371555522";
export const PHONE_LABEL = "+7 (937) 155-55-22";
export const TELEGRAM_USER = "Artur_Sharafutdinoff";
export const TELEGRAM_URL =
  (import.meta.env.VITE_TELEGRAM_URL as string | undefined)?.trim() ||
  `https://t.me/${TELEGRAM_USER}`;

export function telegramUrlWithText(text?: string) {
  if (!text) return TELEGRAM_URL;
  return `${TELEGRAM_URL}?text=${encodeURIComponent(text)}`;
}
