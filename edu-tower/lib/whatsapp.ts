import "server-only";
import { env } from "@/lib/env";
import type { OfficeId } from "@/lib/types";

/** Link that opens a WhatsApp chat with the office counsellor desk. */
export function counsellorLink(office: OfficeId | null, text: string): string {
  const number = env.counsellorNumber(office ?? "mumbai");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Link a counsellor taps to message a student from their own WhatsApp. */
export function chatLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/**
 * Sends a WhatsApp Business message. Without credentials (demo, preview) it
 * logs and reports "not_sent" so the caller can fall back to a chat link.
 * Business-initiated messages need an approved template; free text works
 * inside the 24-hour customer service window.
 */
export async function sendWhatsApp(to: string, text: string): Promise<{ status: "sent" | "not_sent"; id?: string }> {
  const token = env.whatsappToken();
  const phoneId = env.whatsappPhoneId();
  if (!token || !phoneId) {
    console.info(`[edu] whatsapp (not sent, no credentials) to ${to.slice(0, 4)}…: ${text.slice(0, 60)}`);
    return { status: "not_sent" };
  }
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/\D/g, ""), type: "text", text: { body: text } }),
  });
  if (!res.ok) {
    console.error("[edu] whatsapp send failed", res.status, await res.text().catch(() => ""));
    return { status: "not_sent" };
  }
  const json = (await res.json()) as { messages?: { id: string }[] };
  return { status: "sent", id: json.messages?.[0]?.id };
}
