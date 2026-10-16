import { notFound } from "next/navigation";
import { ModesPage } from "@/components/learn/ModesPage";

/** Korean-only: the Math and English sites keep their existing pages (this route is a 404 there, as before). */
export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  if ((await params).site !== "korean") notFound();
  return <ModesPage />;
}
