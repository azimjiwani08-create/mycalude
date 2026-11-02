import { companions, toFeedCompanion } from "@/data/companions";
import { BrowseFeed } from "@/components/browse/BrowseFeed";

export default function BrowsePage() {
  // Only what the feed shows crosses to the client: no fee, no rating, no venues.
  return <BrowseFeed companions={companions.map(toFeedCompanion)} />;
}
