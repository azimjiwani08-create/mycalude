import { z } from "zod";
import { route } from "@/lib/pipeline";
import { createBooking } from "@/lib/services/bookings";
import { id, name, phone } from "@/lib/schemas";
import { counsellorLink } from "@/lib/whatsapp";

export const POST = route({
  schema: z.object({ batch_id: id, full_name: name, phone, diagnostic_id: z.string().uuid().or(id).nullable().default(null) }),
  limit: { perIp: 5, windowMs: 10 * 60_000 },
  handler: async ({ input, db, user }) => {
    const booking = await createBooking(db, input, user);
    return {
      booking: { id: booking.id, status: booking.status, held_until: booking.held_until, office_id: booking.office_id },
      whatsapp: counsellorLink(booking.office_id, `Hi, I just booked a seat (ref ${booking.id.slice(0, 8)}). My name is ${input.full_name}.`),
    };
  },
});
