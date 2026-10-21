import type { Metadata } from "next";
import { DiagnosticRunner } from "./runner";

export const metadata: Metadata = { title: "Free diagnostic" };

export default function DiagnosticPage() {
  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <DiagnosticRunner />
    </div>
  );
}
