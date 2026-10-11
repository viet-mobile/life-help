import Link from "next/link";
import { LegalDocument } from "./LegalDocument";
import type { LegalKind, LegalLang } from "@/lib/legal/documents";
import "./legal.css";

/** Standalone page shell: Korean first (the governing text) unless the reader's language is not Korean, then English first. */
export function LegalPage({ kind, primary = "ko", home = "/", other }: { kind: LegalKind; primary?: LegalLang; home?: string; other: { href: string; label: string } }) {
  const langs: LegalLang[] = primary === "ko" ? ["ko", "en"] : ["en", "ko"];
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-5 text-sm font-bold">
        <Link href={home} className="text-blue-700 hover:underline">← LIFE.HELP</Link>
        <span className="flex gap-4">
          <a href={`#${kind}-ko`} className="text-slate-600 hover:underline">한국어</a>
          <a href={`#${kind}-en`} className="text-slate-600 hover:underline">English</a>
          <Link href={other.href} className="text-slate-600 hover:underline">{other.label}</Link>
        </span>
      </nav>
      <LegalDocument kind={kind} langs={langs} />
    </main>
  );
}
