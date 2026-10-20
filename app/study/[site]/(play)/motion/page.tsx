import { notFound } from "next/navigation";
import { MathMotion } from "@/components/learn/MathMotion";

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (site !== "math") notFound();
  return <MathMotion />;
}
