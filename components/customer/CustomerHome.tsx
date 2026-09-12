"use client";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { translate, type Locale } from "@/messages";
const services = [
  ["🚽", "toilet", "toilet-clog"],
  ["🚰", "sink", "sink-clog"],
  ["🕳️", "drain", "drain-clog"],
  ["💧", "leak", "water-leak"],
  ["🔎", "detection", "leak-detection"],
  ["🚿", "water", "water"],
  ["🔧", "plumbing", "plumbing"],
  ["🔥", "boiler", "boiler"],
  ["🧹", "cleaning", "cleaning"],
  ["🏠", "housing", "housing"],
] as const;
const benefits = [
  ["💬", "consultation"],
  ["🛡️", "verified"],
  ["💳", "payment"],
  ["⭐", "review"],
] as const;
export function CustomerHome() {
  const [locale, setLocale] = useState<Locale>("vi");
  const t = (key: string) => translate(locale, key);
  const headingWeight = locale === "vi" ? "font-bold" : "font-extrabold";
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xl font-extrabold text-blue-800">VIET.MOBILE</p>
            <p className="text-xs text-slate-500">Iksan · Jeonbuk</p>
          </div>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </div>
      </header>
      <section className="bg-linear-to-br from-blue-800 to-blue-600 px-5 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-xl text-4xl leading-tight ${headingWeight} sm:text-5xl`}>
            {t("customer.tagline")}
          </h1>
          <Button className="mt-8 w-full sm:w-auto">🚨 {t("customer.emergency")}</Button>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className={`text-2xl ${headingWeight}`}>{t("customer.servicesTitle")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {services.map(([icon, key, slug]) => (
            <Link key={key} href={`/request?service=${slug}`} className="block">
              <Card className="min-h-30 transition hover:-translate-y-0.5 hover:border-blue-300">
                <span className="text-3xl">{icon}</span>
                <p className="mt-3 font-bold">{t(`service.${key}`)}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-3 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([icon, key]) => (
            <div key={key} className="rounded-xl bg-slate-50 p-4">
              <span className="text-2xl">{icon}</span>
              <span className="ml-3 font-bold">{t(`customer.${key}`)}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
