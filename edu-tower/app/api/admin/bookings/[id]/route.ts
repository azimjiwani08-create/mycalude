import { z } from "zod";
import { route } from "@/lib/pipeline";
import { cancelBooking, confirmBooking } from "@/lib/services/bookings";

export const POST = route({
  roles: ["admin", "counsellor"],
  schema: z.object({ action: z.enum(["confirm", "cancel"]) }),
  handler: async ({ input, db, user, params }) =>
    input.action === "confirm" ? confirmBooking(db, user!, params.id) : { booking: await cancelBooking(db, user!, params.id) },
});
