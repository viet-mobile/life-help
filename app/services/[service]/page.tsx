import { SupportServiceView } from "@/components/support/SupportServiceView";
import { services } from "@/lib/services";

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