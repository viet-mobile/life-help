import { notFound, permanentRedirect } from "next/navigation";
import { isKnownServiceSlug } from "@/lib/support/knownService";
import type { Metadata } from "next";
import { serviceMetadata } from "@/lib/i18n/serviceMetadata";

/** /support/<slug> was a duplicate of /services/<slug>; it now redirects there (the single canonical service page). */
export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  return serviceMetadata((await params).service);
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service: slug } = await params;
  if (!isKnownServiceSlug(slug)) notFound();
  permanentRedirect(`/services/${slug}`);
}
