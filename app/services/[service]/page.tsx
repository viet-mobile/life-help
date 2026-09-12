import Link from "next/link";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { getService } from "@/lib/services";

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service: slug } = await params;

  const service = getService(slug);

  if (!service) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy dịch vụ. · 서비스를 찾을 수 없습니다.
          </h1>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
          >
            Quay lại trang chủ · 홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <Link href="/" className="font-extrabold text-blue-700">
            VIET.MOBILE
          </Link>
        </div>
      </header>

      <section className="bg-blue-700 px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="text-5xl">{service.icon}</div>

          <h1 className="mt-4 text-3xl font-bold">
            {service.vi} · {service.ko}
          </h1>

          <p className="mt-5 text-base leading-7 font-medium text-white">
            Nếu bạn cần dịch vụ {service.vi.toLowerCase()}, vui lòng gửi yêu cầu.
            <span className="block">{service.ko} 서비스가 필요하신 경우 신청해 주세요.</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Bạn có muốn yêu cầu dịch vụ không? · 서비스를 신청하시겠습니까?
          </h2>

          <p className="mt-4 text-base leading-7 font-medium text-slate-700">
            Vui lòng cho chúng tôi biết tình trạng sự cố và gửi ảnh nếu có. Chúng tôi sẽ kết nối bạn
            với kỹ thuật viên chuyên nghiệp gần nhất.
            <span className="mt-1 block">
              문제 상황과 사진을 알려주시면 가까운 전문 기사를 연결해 드립니다.
            </span>
          </p>

          <Link
            href={`/request?service=${service.slug}`}
            className="mt-6 block rounded-xl bg-blue-700 px-5 py-4 text-center text-lg font-bold text-white"
          >
            Yêu cầu dịch vụ · 서비스 신청하기
          </Link>
        </div>
      </section>

      <PrivacyNotice />
    </main>
  );
}
