import Link from "next/link";
import { headers } from "next/headers";
import { getServerText } from "@/lib/i18n/serverText";

/** Localized 404 body: message in the request's language and a link home (language prefix / learning-site base kept). Server component. */
export async function NotFoundView() {
  const { t, learnBase } = await getServerText();
  const h = await headers();
  const urlLang = h.get("x-life-url-lang");
  const home = learnBase !== null ? learnBase || "/" : urlLang ? `/${urlLang}` : "/";
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="text-5xl font-black text-slate-300" aria-hidden="true">404</p>
      <h1 className="text-2xl font-bold text-slate-900">{t("system.notFoundTitle")}</h1>
      <p className="text-slate-600">{t("system.notFoundDesc")}</p>
      <Link href={home} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-6 py-2 font-semibold text-white">
        {t("system.goHome")}
      </Link>
    </main>
  );
}
