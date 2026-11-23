import { Metadata } from "next";
import { DailyInsightsCatalog } from "@/components/insights/DailyInsightsCatalog";

export const metadata: Metadata = {
  title: "매일 만나는 인생 도움 366 실천 도감 · LIFE.HELP",
  description: "한국어, 영어, 수학, 물리, 화학, 생활정보의 366일 전과목 실천 팁 전체 도감.",
};

export default function InsightsPage() {
  return <DailyInsightsCatalog initialDomain="korean" />;
}
