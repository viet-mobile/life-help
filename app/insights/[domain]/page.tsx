import { Metadata } from "next";
import { DailyInsightsCatalog } from "@/components/learn/DailyInsightsCatalog";
import { DomainType } from "@/lib/learn/dailyInsights/types";

interface PageProps {
  params: Promise<{ domain: string }>;
}

const VALID_DOMAINS: DomainType[] = ["korean", "english", "math", "physics", "chemistry", "life"];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = await params;
  const domainNames: Record<string, string> = {
    korean: "한국어 (Korean)",
    english: "영어 (English)",
    math: "수학 (Math)",
    physics: "물리 (Physics)",
    chemistry: "화학 (Chemistry)",
    life: "생활정보 (Life Info)",
  };
  const title = domainNames[domain] || domain;

  return {
    title: `${title} 인생 도움 366 실천 도감 · LIFE.HELP`,
    description: `${title} 실생활 문제 해결과 지혜를 모은 366일 전체 실천 팁 도감.`,
  };
}

export default async function DomainInsightsPage({ params }: PageProps) {
  const { domain } = await params;
  const initialDomain: DomainType = VALID_DOMAINS.includes(domain as DomainType)
    ? (domain as DomainType)
    : "korean";

  return <DailyInsightsCatalog initialDomain={initialDomain} />;
}
