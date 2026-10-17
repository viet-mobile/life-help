import { Suspense } from "react";
import { ThinkHub } from "@/components/think/ThinkHub";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ThinkHub />
    </Suspense>
  );
}
