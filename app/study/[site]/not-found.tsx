import type { Metadata } from "next";
import { NotFoundView } from "@/components/system/NotFoundView";
import { pageMetadata } from "@/lib/i18n/serverText";

export async function generateMetadata(): Promise<Metadata> {
  return { ...(await pageMetadata("system.notFoundTitle", "system.notFoundDesc")), robots: { index: false, follow: false } };
}

export default NotFoundView;
