"use client";

import dynamic from "next/dynamic";

const ThinkPilot = dynamic(
  () => import("@/components/think/ThinkPilot").then((m) => m.ThinkPilot),
  { ssr: false }
);

export function ThinkPilotClient() {
  return <ThinkPilot />;
}
