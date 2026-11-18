"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { verifyPassword, setAdminSession, clearAdminSession } from "@/lib/jiu/admin";
import { rateLimit } from "@/lib/learn/server/http";
export async function login(form: FormData) {
  const h = await headers();
  try { rateLimit(`jiu-login:${h.get("cf-connecting-ip") || h.get("x-forwarded-for") || "local"}`, 5, 15 * 60_000); } catch { redirect("/jiu/admin?error=limited"); }
  const username = form.get("username");
  const password = form.get("password");
  if (username !== "jiu" || typeof password !== "string" || !(await verifyPassword(password))) redirect("/jiu/admin?error=invalid");
  await setAdminSession();
  redirect("/jiu/admin");
}
export async function logout() { await clearAdminSession(); redirect("/jiu/admin"); }
