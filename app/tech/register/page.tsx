import Link from "next/link";
export default function TechRegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5 text-white">
      <section>
        <h1 className="text-3xl font-bold">기사 등록</h1>
        <p className="mt-3">등록 양식은 다음 인증 단계에서 연결됩니다.</p>
        <Link className="mt-6 block text-blue-300" href="/tech">
          돌아가기
        </Link>
      </section>
    </main>
  );
}
