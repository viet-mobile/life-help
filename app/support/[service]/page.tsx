import { SupportServiceView } from "@/components/support/SupportServiceView";

export function generateStaticParams() {
  return [
    { service: "bank-help" },
    { service: "insurance-help" },
    { service: "job-help" },
    { service: "hospital-help" },
    { service: "mobile-help" },
  ];
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service: slug } = await params;
  return <SupportServiceView slug={slug} />;
}

