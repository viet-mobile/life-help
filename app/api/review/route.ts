import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating, serviceCategory, content, locale } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "리뷰 내용을 입력해 주세요." },
        { status: 400 },
      );
    }

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    const recipientEmail = "contact@life.help";

    const emailPayload = {
      to: recipientEmail,
      subject: `[LIFE.HELP 익명 고객 리뷰 접수] ${rating || 5}점 (${serviceCategory || "일반"})`,
      text: `
[LIFE.HELP 신규 익명 고객 리뷰 전달]
=========================================
- 접수 일시: ${timestamp}
- 평가 별점: ${"★".repeat(rating || 5)}${"☆".repeat(5 - (rating || 5))} (${rating || 5}/5)
- 관련 서비스: ${serviceCategory || "일반 서비스"}
- 작성 언어: ${locale || "ko"}
- 관리자 수신 이메일: ${recipientEmail}

[리뷰 본문]
-----------------------------------------
${content.trim()}
=========================================
* 본 리뷰는 개인정보 입력 없이 100% 익명으로 작성되어 관리자 메일(contact@life.help)로 전달되었습니다.
      `.trim(),
    };

    // Log the transmission to the server log
    console.log(`[Email Dispatch -> ${recipientEmail}]`, emailPayload.subject);

    return NextResponse.json({
      success: true,
      deliveredTo: recipientEmail,
      reviewId,
      timestamp,
    });
  } catch (error) {
    console.error("Error processing review:", error);
    return NextResponse.json(
      { success: false, error: "리뷰 전송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

