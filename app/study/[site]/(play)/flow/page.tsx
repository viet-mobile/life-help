import { Suspense } from "react";
import { FlowRunner } from "@/components/learn/FlowRunner";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FlowRunner />
    </Suspense>
  );
}
