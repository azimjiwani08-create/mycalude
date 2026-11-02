import { requests } from "@/data/sessions";
import { RequestsView } from "@/components/companion/RequestsView";

export default function CompanionRequestsPage() {
  return <RequestsView initial={requests} />;
}
