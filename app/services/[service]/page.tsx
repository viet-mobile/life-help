import { ServiceDetailView } from "@/components/customer/ServiceDetailView";
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
  return <ServiceDetailView slug={slug} />;
}