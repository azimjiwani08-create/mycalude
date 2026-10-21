/**
 * Strips personal data before an exchange is logged: phone numbers, emails,
 * and any known names passed in. Applied to ai_logs.question / answer.
 */
export function redact(text: string, names: (string | null | undefined)[] = []): string {
  let out = text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/(?:\+?\d[\s-]?){8,14}\d/g, "[phone]");
  for (const full of names) {
    if (!full) continue;
    for (const part of full.split(/\s+/).filter((p) => p.length >= 3 && /^[A-Za-z]/.test(p))) {
      const safe = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`\\b${safe}\\b`, "gi"), "[name]");
    }
  }
  return out.slice(0, 2000);
}
