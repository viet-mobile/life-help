import { Suspense } from "react";
import { PracticePage } from "@/components/learn/PracticePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PracticePage />
    </Suspense>
  );
}
