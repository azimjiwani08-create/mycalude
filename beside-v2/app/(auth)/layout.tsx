import { MobileFrame } from "@/components/ui/Frame";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <MobileFrame>{children}</MobileFrame>;
}
