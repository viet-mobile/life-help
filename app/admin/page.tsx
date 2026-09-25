import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";
import {
  SYS_SESSION_COOKIE,
  verifySysSessionToken,
} from "@/lib/auth/sysSession";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SYS_SESSION_COOKIE)?.value;

  const session = await verifySysSessionToken(token);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminDashboardClient
      initialSession={{
        email: session.id,
        role: session.role,
      }}
    />
  );
}
