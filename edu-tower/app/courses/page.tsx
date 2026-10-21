import type { Metadata } from "next";
import { BookingFlow } from "./booking";

export const metadata: Metadata = { title: "Courses & booking" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ course?: string; diagnostic?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="container section" style={{ maxWidth: 900 }}>
      <BookingFlow initialCourse={sp.course ?? null} diagnosticId={sp.diagnostic ?? null} />
    </div>
  );
}
