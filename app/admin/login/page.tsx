import Link from "next/link";
export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold">VIET.MOBILE ADMIN</h1>
        <p className="mt-3 text-slate-600">관리자 로그인은 역할 기반 인증 단계에서 활성화됩니다.</p>
        <Link className="mt-6 block font-bold text-blue-700" href="/admin">
          돌아가기
        </Link>
      </section>
    </main>
  );
}
