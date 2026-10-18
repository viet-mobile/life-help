import type { Metadata } from "next";
import { ThinkPilot } from "@/components/think/ThinkPilot";

export const metadata: Metadata = {
  title: "Thinking tasks (review pilot)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ThinkPilot />;
}
