import type { Metadata } from "next";
import Journal from "@/components/jiu/Journal";
import "./jiu.css";
export const metadata: Metadata = { title: "JIU · 나의 배움 일지", description: "매일의 배움이 나만의 이야기로", robots: { index: false, follow: false } };
export default function JiuPage() { return <Journal />; }
