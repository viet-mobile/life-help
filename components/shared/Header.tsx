import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function Header({ label, href = "/" }: { label?: string; href?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:py-4">
        <Link href={href} className="inline-flex items-center gap-2.5 shrink-0" title="LIFE.HELP Home">
          <BrandLogo size="md" priority />
          {label ? (
            <span className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">
              {label}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
