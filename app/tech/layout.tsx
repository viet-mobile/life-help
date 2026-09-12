import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "VIET.MOBILE TECH",
  robots: { index: false, follow: false },
};
export default function TechLayout({ children }: LayoutProps<"/tech">) {
  return children;
}
