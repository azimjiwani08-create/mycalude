import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { route } from "@/lib/pipeline";
import { HttpError } from "@/lib/access";
import { env } from "@/lib/env";
import { setSession } from "@/lib/session";
import { phone } from "@/lib/schemas";

const token = z.string().regex(/^\d{6}$/);
const schema = z.union([z.object({ phone, token }), z.object({ email: z.string().email().max(120), token })]);

export const POST = route({
  schema,
  limit: { perIp: 10, windowMs: 10 * 60_000 },
  handler: async ({ input, live, db }) => {
    if (!live) throw new HttpError(400, "Demo mode: use the role picker.");
    const sb = createClient(env.supabaseUrl()!, env.supabaseAnonKey()!, { auth: { persistSession: false } });
    const { data, error } = "phone" in input
      ? await sb.auth.verifyOtp({ phone: `+${input.phone}`, token: input.token, type: "sms" })
      : await sb.auth.verifyOtp({ email: input.email, token: input.token, type: "email" });
    if (error || !data.session || !data.user) throw new HttpError(400, "That code didn't work. Please try again.");
    const [profile] = await db.select("users", { id: data.user.id });
    if (!profile) throw new HttpError(403, "Your account isn't set up yet. Please contact your counsellor.");
    await setSession(data.user.id, { at: data.session.access_token, rt: data.session.refresh_token });
    return { ok: true, role: profile.role };
  },
});
