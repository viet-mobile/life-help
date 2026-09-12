import type { Metadata } from "next";
import { HelperProvider } from "@/lib/helper/HelperContext";

export const metadata: Metadata = {
  title: "LIFE.HELP HELPER | 헬퍼 포털",
  robots: { index: false, follow: false },
};

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return <HelperProvider>{children}</HelperProvider>;
}
