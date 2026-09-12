import { ChatProvider } from "@/lib/chat/ChatContext";

export const metadata = {
  title: "LIFE.HELP CHAT | 모국어 실시간 상담 센터",
  description: "한국 생활의 모든 고민을 모국어로 전문 상담원과 실시간 상담하세요.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ChatProvider>{children}</ChatProvider>;
}

