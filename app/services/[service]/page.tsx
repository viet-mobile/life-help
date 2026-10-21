import { SupportServiceView } from "@/components/support/SupportServiceView";
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { serviceMetadata } from "@/lib/i18n/serviceMetadata";

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  return serviceMetadata((await params).service);
}

export function generateStaticParams() {
  return services.map((service) => ({
    service: service.slug,
  }));
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service: slug } = await params;
  return <SupportServiceView slug={slug} />;
}