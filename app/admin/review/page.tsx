import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SYS_SESSION_COOKIE, verifySysSessionToken } from "@/lib/auth/sysSession";
import { ReviewConsole } from "@/components/admin/ReviewConsole";

export const dynamic = "force-dynamic";

/** Operator financial review console (SYS session only; the APIs re-check authority on every call). */
export default async function AdminReviewPage() {
  const session = await verifySysSessionToken((await cookies()).get(SYS_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  return <ReviewConsole />;
}
