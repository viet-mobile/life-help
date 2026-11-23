import type { Metadata } from "next";
import { ThinkPilotClient } from "./ThinkPilotClient";

export const metadata: Metadata = {
  title: "Thinking tasks (review pilot)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ThinkPilotClient />;
}
