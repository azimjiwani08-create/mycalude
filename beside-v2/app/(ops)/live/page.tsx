import { liveSessions } from "@/data/sessions";
import { LiveOps } from "@/components/ops/LiveOps";

export const metadata = { title: "Live sessions · Beside Ops" };

export default function OpsLivePage() {
  return <LiveOps rows={liveSessions} />;
}
