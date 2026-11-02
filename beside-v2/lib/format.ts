/** Minutes since midnight to "10:33 am". */
export function formatMinutes(total: number) {
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Only call from event handlers or effects, never during render. */
export function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const PHONE = /(?:\+?\d[\s().-]*){8,}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const LINK =
  /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|in|net|org|io|co|me|app|ly|gg|xyz|link)\b/i;

/** True when text looks like it carries a phone number, email or link. */
export function containsContact(text: string) {
  return PHONE.test(text) || EMAIL.test(text) || LINK.test(text);
}

export function formatPhone(digits: string) {
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function maskPhone(digits: string) {
  return `+91 ${digits.slice(0, 2)}xxx xx${digits.slice(7)}`;
}

export function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}
