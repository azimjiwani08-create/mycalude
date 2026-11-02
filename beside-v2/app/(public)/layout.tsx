import { MobileFrame } from "@/components/ui/Frame";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <MobileFrame>{children}</MobileFrame>;
}
