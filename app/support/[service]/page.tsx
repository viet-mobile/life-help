import type { Metadata } from "next";
import { SupportServiceView } from "@/components/support/SupportServiceView";
import { serviceMetadata } from "@/lib/i18n/serviceMetadata";

export function generateStaticParams() {
  return [
    { service: "bank-help" },
    { service: "insurance-help" },
    { service: "job-help" },
    { service: "hospital-help" },
    { service: "mobile-help" },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  return serviceMetadata((await params).service);
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service: slug } = await params;
  return <SupportServiceView slug={slug} />;
}

