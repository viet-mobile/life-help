import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { translate } from "@/messages";
const benefitKeys = ["customers", "requests", "mobile", "settlement"];
export default function TechPage() {
  const t = (key: string) => translate("ko", key);
  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <header className="mx-auto flex max-w-5xl justify-between py-4 font-extrabold">
        VIET.MOBILE TECH{" "}
        <Link href="/tech/login">
          <Button>기사 로그인</Button>
        </Link>
      </header>
      <section className="mx-auto max-w-5xl py-12">
        <p className="text-blue-300">{t("tech.title")}</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold">{t("tech.headline")}</h1>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {benefitKeys.map((key) => (
            <Card key={key} className="border-slate-700 bg-slate-900 text-white">
              ✓ {t(`tech.${key}`)}
            </Card>
          ))}
        </div>
        <Link href="/tech/register" className="mt-8 inline-block">
          <Button variant="secondary">{t("tech.register")}</Button>
        </Link>
      </section>
    </main>
  );
}
