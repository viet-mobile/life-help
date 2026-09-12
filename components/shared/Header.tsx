import Link from "next/link";
export function Header({ label, href = "/" }: { label?: string; href?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href={href} className="font-extrabold tracking-tight text-blue-800">
          LIFE.HELP{label ? ` ${label}` : ""}
        </Link>
      </div>
    </header>
  );
}
