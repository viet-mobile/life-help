import { ServiceDetailView } from "@/components/customer/ServiceDetailView";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service: slug } = await params;
  return <ServiceDetailView slug={slug} />;
}
// app/services/[service]/page.tsx

// 1. 빌드 시 미리 생성할 service 목록을 정의합니다.
export async function generateStaticParams() {
  return [
    { service: 'counseling' },
    { service: 'translation' },
    { service: 'education' },
    // 사이트에서 지원하는 서비스 슬러그 목록을 모두 나열하세요.
  ];
}

// 2. 기존 페이지 컴포넌트
export default function ServicePage({ params }: { params: { service: string } }) {
  return (
    <main>
      <h1>Service: {params.service}</h1>
    </main>
  );
}