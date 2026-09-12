import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { translate } from "@/messages";
const items = [
  "customers",
  "technicians",
  "orders",
  "assignment",
  "payments",
  "settlements",
  "complaints",
  "statistics",
];
export default function AdminPage() {
  const t = (key: string) => translate("ko", key);
  return (
    <main className="min-h-screen bg-slate-100 md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-slate-950 p-6 text-white">
        <p className="text-xl font-extrabold">VIET.MOBILE ADMIN</p>
        <nav className="mt-8 grid gap-2">
          {items.map((item) => (
            <span key={item} className="rounded-lg px-3 py-2 text-slate-300">
              {t(`admin.${item}`)}
            </span>
          ))}
        </nav>
      </aside>
      <section>
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h1 className="font-extrabold">{t("admin.title")}</h1>
            <p className="text-sm text-slate-500">{t("admin.description")}</p>
          </div>
          <Link
            className="rounded-xl bg-slate-900 px-4 py-3 font-bold text-white"
            href="/admin/login"
          >
            {t("admin.login")}
          </Link>
        </header>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item) => (
            <Card key={item}>
              <p className="text-sm text-slate-500">{t(`admin.${item}`)}</p>
              <p className="mt-2 text-2xl font-extrabold">—</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
