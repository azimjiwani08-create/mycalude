import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { route } from "@/lib/pipeline";
import { HttpError } from "@/lib/access";
import { env } from "@/lib/env";
import { phone } from "@/lib/schemas";

const schema = z.union([z.object({ phone }), z.object({ email: z.string().email().max(120) })]);

/** Sends a one-time code by SMS or email (Supabase Auth). */
export const POST = route({
  schema,
  limit: { perIp: 5, windowMs: 10 * 60_000 },
  handler: async ({ input, live }) => {
    if (!live) return { ok: true, demo: true, hint: "Demo mode: use the role picker below. Any 6-digit code works only when live." };
    const sb = createClient(env.supabaseUrl()!, env.supabaseAnonKey()!, { auth: { persistSession: false } });
    // shouldCreateUser: false — accounts are created by staff, not by strangers.
    const { error } = "phone" in input
      ? await sb.auth.signInWithOtp({ phone: `+${input.phone}`, options: { shouldCreateUser: false } })
      : await sb.auth.signInWithOtp({ email: input.email, options: { shouldCreateUser: false } });
    if (error) throw new HttpError(400, "We couldn't send a code to that number or email. Is it the one you gave us?");
    return { ok: true };
  },
});
