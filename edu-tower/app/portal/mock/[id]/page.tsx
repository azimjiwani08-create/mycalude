import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/page-auth";
import { withPageDb } from "@/lib/pipeline";
import { getPublicTest } from "@/lib/services/diagnostic";
import { MockRunner } from "./runner";

export const dynamic = "force-dynamic";

export default async function MockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageRole(["student"]);
  const data = await withPageDb((db) => getPublicTest(db, id).catch(() => null));
  if (!data || data.test.kind !== "mock") notFound();
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <MockRunner test={data.test} questions={data.questions} />
    </div>
  );
}
