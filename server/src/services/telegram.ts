export async function sendTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return { skipped: true as const };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram error: ${res.status} ${body}`);
  }
  return { ok: true as const };
}

export function formatLead(lead: {
  id: number;
  name: string;
  phone: string;
  city?: string;
  message?: string;
  vehicle_slug?: string;
  vehicle_snapshot?: string;
}) {
  const snap = lead.vehicle_snapshot ? JSON.parse(lead.vehicle_snapshot) : {};
  return [
    `<b>Новая заявка АртАвто #${lead.id}</b>`,
    `${lead.name} · ${lead.phone}`,
    lead.city ? `Город: ${lead.city}` : "",
    snap.brand ? `Авто: ${snap.brand} ${snap.model} ${snap.year ?? ""}` : "",
    snap.estimated_total_rub ? `Цена: ${snap.estimated_total_rub} ₽` : "",
    lead.vehicle_slug ? `Slug: ${lead.vehicle_slug}` : "",
    lead.message ? `Комментарий: ${lead.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
