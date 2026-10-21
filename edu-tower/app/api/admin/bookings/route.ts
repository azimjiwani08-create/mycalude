import { z } from "zod";
import { route } from "@/lib/pipeline";
import { listBookingQueue } from "@/lib/services/bookings";
import { chatLink } from "@/lib/whatsapp";

export const GET = route({
  roles: ["admin", "counsellor"],
  schema: z.object({ status: z.enum(["held", "confirmed", "expired", "cancelled"]).default("held") }),
  handler: async ({ input, db, user }) => {
    const bookings = await listBookingQueue(db, user!, input.status);
    const batches = bookings.length ? await db.select("batches", { id: bookings.map((b) => b.batch_id) }) : [];
    const courses = await db.select("courses");
    const diags = await db.select("diagnostics", { id: bookings.map((b) => b.diagnostic_id).filter((x): x is string => !!x) });
    return {
      bookings: bookings.map((b) => {
        const batch = batches.find((x) => x.id === b.batch_id);
        return { ...b, batch, course: courses.find((c) => c.id === batch?.course_id) ?? null, diagnostic: diags.find((d) => d.id === b.diagnostic_id) ?? null, chat: chatLink(b.phone, `Hi ${b.full_name.split(" ")[0]}, this is Edu Tower about your seat booking.`) };
      }),
    };
  },
});
