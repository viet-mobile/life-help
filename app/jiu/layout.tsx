import type { ReactNode } from "react";
import { jiuMetadata } from "@/lib/jiu/brand";
export const metadata = jiuMetadata;
export default function JiuLayout({ children }: { children: ReactNode }) { return children; }
