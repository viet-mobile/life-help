import Link from "next/link";
export default function TechLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5 text-white">
      <section>
        <h1 className="text-3xl font-bold">VIET.MOBILE TECH</h1>
        <p className="mt-3">기사 로그인은 인증 연동 단계에서 활성화됩니다.</p>
        <Link className="mt-6 block text-blue-300" href="/tech">
          돌아가기
        </Link>
      </section>
    </main>
  );
}
