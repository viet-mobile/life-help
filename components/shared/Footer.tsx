import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
      © 2026{" "}
      <Link href="/" className="font-semibold text-slate-600 hover:text-blue-700 transition underline-offset-2 hover:underline" title="LIFE.HELP 메인 홈으로 이동">
        LIFE.HELP
      </Link>{" "}
      · All Rights Reserved
    </footer>
  );
}
