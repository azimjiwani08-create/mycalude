import { z } from "zod";

export const officeId = z.enum(["mumbai", "vadodara"]);
export const skill = z.enum(["reading", "writing", "listening", "speaking"]);
export const exam = z.enum(["english", "ielts_academic", "ielts_general", "ielts_ukvi", "pte", "celpip", "coaching"]);
export const id = z.string().min(1).max(64).regex(/^[\w-]+$/);
/** Indian mobile or any 10–15 digit international number. */
export const phone = z.string().transform((s) => s.replace(/\D/g, "")).pipe(z.string().min(10).max(15)).transform((d) => (d.length === 10 ? `91${d}` : d));
export const name = z.string().trim().min(2).max(80).regex(/^[\p{L} .'-]+$/u, "Use letters only");
export const band = z.coerce.number().min(0).max(9).refine((n) => Math.round(n * 2) === n * 2, "Use half bands, e.g. 6.5");
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const answers = z.record(id, z.string().max(200)).refine((a) => Object.keys(a).length <= 100);
