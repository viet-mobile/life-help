import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SYS_SESSION_COOKIE, verifySysSessionToken } from "@/lib/auth/sysSession";
import { EscalationQueue } from "@/components/admin/EscalationQueue";

export const dynamic = "force-dynamic";

export default async function AdminEscalationsPage() {
  const session = await verifySysSessionToken((await cookies()).get(SYS_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  return <EscalationQueue />;
}
