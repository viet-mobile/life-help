"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { getService } from "@/lib/services";

function RequestPageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("service") ?? "";

  const service = getService(slug);

  const [submitted, setSubmitted] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-4">
            <Link href="/" className="font-extrabold text-blue-700">
              VIET.MOBILE
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-5 py-10">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">✅</div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Yêu cầu dịch vụ của bạn đã được tiếp nhận. · 서비스 신청이 접수되었습니다.
            </h1>

            <p className="mt-5 text-base leading-7 font-medium text-slate-700">
              Hiện tại đây là bước tiếp nhận thử nghiệm. · 현재는 테스트 접수 단계입니다.
            </p>

            <Link
              href="/"
              className="mt-7 inline-block rounded-xl bg-blue-700 px-6 py-4 text-lg font-bold text-white"
            >
              Quay lại trang chủ · 홈으로 돌아가기
            </Link>
          </div>
        </section>

        <PrivacyNotice />
      </main>
    );
  }

  if (!service) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-xl px-5 py-10">
          <div className="rounded-2xl bg-white p-8">
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
        </div>

        <PrivacyNotice />
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

      <section className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Yêu cầu dịch vụ · 서비스 신청</h1>
        {/* Selected service */}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="text-sm font-bold text-blue-800">Dịch vụ đã chọn · 선택한 서비스</div>

          <div className="mt-4 flex items-center gap-3">
            <div className="text-4xl">{service.icon}</div>

            <div>
              <div className="text-lg font-bold text-slate-900">
                {service.vi} · {service.ko}
              </div>
            </div>
          </div>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          {/* Problem description */}
          <div>
            <label className="block text-base font-bold text-slate-900">
              Sự cố đang xảy ra là gì? · 어떤 문제가 있나요?
            </label>

            <textarea
              required
              className="mt-3 min-h-32 w-full rounded-xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-600"
              placeholder={
                "Ví dụ: Nước trong bồn cầu không thoát mà còn dâng lên.\n예: 변기 물이 내려가지 않고 올라옵니다."
              }
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-base font-bold text-slate-900">
              Vui lòng gửi ảnh nếu có. · 사진을 첨부해 주세요.
            </label>

            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={({ target }) =>
                setSelectedFileNames(Array.from(target.files ?? [], ({ name }) => name))
              }
            />

            <label
              htmlFor="photos"
              className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-300 bg-white p-3 text-base font-medium text-slate-900"
            >
              <span className="rounded-lg bg-slate-100 px-3 py-2 font-bold">
                Chọn tệp · 파일 선택
              </span>
              <span className="text-slate-500">
                {selectedFileNames.length > 0
                  ? selectedFileNames.join(", ")
                  : "Chưa chọn tệp nào · 선택된 파일 없음"}
              </span>
            </label>

            <p className="mt-2 text-sm font-medium text-slate-700">
              Ảnh sẽ giúp kỹ thuật viên hiểu rõ hơn về sự cố.
              <span className="block">사진을 보내주시면 문제를 파악하는 데 도움이 됩니다.</span>
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-base font-bold text-slate-900">Địa chỉ · 주소</label>

            <input
              required
              className="mt-3 w-full rounded-xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-600"
              placeholder="Vui lòng nhập địa chỉ. · 주소를 입력해 주세요."
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-base font-bold text-slate-900">
              Số điện thoại · 연락처
            </label>

            <input
              required
              type="tel"
              className="mt-3 w-full rounded-xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-600"
              placeholder="010-0000-0000"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-700 px-5 py-4 text-lg font-bold text-white shadow-sm hover:bg-blue-800"
          >
            Yêu cầu dịch vụ · 서비스 신청하기
          </button>
        </form>
      </section>

      <PrivacyNotice />
    </main>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <RequestPageContent />
    </Suspense>
  );
}
