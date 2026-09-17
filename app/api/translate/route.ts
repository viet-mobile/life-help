import { NextResponse } from "next/server";

// Comprehensive built-in bilingual dictionary for common service phrases and keywords
const SERVICE_PHRASE_DICT: Record<string, Record<string, string>> = {
  ko: {
    hello: "안녕하세요",
    clog_problem: "변기나 싱크대, 하수구가 막혀서 물이 내려가지 않습니다.",
    leak_problem: "천장이나 배관에서 물이 새고 누수가 발생했습니다.",
    boiler_problem: "보일러가 작동하지 않고 온수가 나오지 않습니다.",
    help_cost: "출장 비용과 수리 비용이 얼마나 드나요?",
    location_query: "현재 계신 상세 주소가 어떻게 되시나요?",
    on_my_way: "네, 확인했습니다. 지금 바로 현장으로 출발하겠습니다.",
    urgent_visit: "가능한 가장 빠른 시간에 방문해 주실 수 있나요?",
    completed_check: "작업이 완료되었습니다. 확인 부탁드립니다.",
    thanks: "친절하고 빠른 해결 감사합니다.",
  },
  vi: {
    hello: "Xin chào",
    clog_problem: "Bồn cầu, bồn rửa bát hoặc cống thoát nước bị nghẹt, nước không thoát được.",
    leak_problem: "Nước bị rò rỉ từ trần nhà hoặc đường ống nước.",
    boiler_problem: "Bình nóng lạnh/nồi hơi bị hỏng, không có nước nóng.",
    help_cost: "Chi phí kiểm tra và sửa chữa hết khoảng bao nhiêu tiền?",
    location_query: "Địa chỉ chi tiết hiện tại của bạn là ở đâu?",
    on_my_way: "Vâng, tôi đã nhận được thông tin. Tôi sẽ xuất phát đến chỗ bạn ngay bây giờ.",
    urgent_visit: "Bạn có thể đến hỗ trợ trong thời gian sớm nhất được không?",
    completed_check: "Công việc đã hoàn thành, xin mời bạn kiểm tra lại.",
    thanks: "Cảm ơn bạn rất nhiều vì đã xử lý nhanh chóng và tận tình.",
  },
  en: {
    hello: "Hello",
    clog_problem: "The toilet, sink, or drain is clogged and water is not draining.",
    leak_problem: "There is a water leak from the ceiling or pipes.",
    boiler_problem: "The boiler/heater is not working and there is no hot water.",
    help_cost: "How much is the inspection and repair fee?",
    location_query: "Could you please provide your detailed address?",
    on_my_way: "Yes, received. I am heading to your location right now.",
    urgent_visit: "Could you please visit as soon as possible?",
    completed_check: "The work is completed. Please inspect it.",
    thanks: "Thank you very much for your prompt and kind assistance.",
  },
  "zh-Hans": {
    hello: "您好",
    clog_problem: "马桶、水槽或下水道堵塞，水排不下去。",
    leak_problem: "天花板或水管出现漏水现象。",
    boiler_problem: "地暖/锅炉出现故障，不出热水。",
    help_cost: "请问上门检查和维修费用大约是多少？",
    location_query: "请问您现在的详细地址在哪里？",
    on_my_way: "好的，已收到您的信息，我现在马上赶过去。",
    urgent_visit: "可以尽快过来帮我处理吗？",
    completed_check: "施工已完成，请您验收一下。",
    thanks: "非常感谢您迅速而热情的处理！",
  },
  "zh-Hant": {
    hello: "您好",
    clog_problem: "馬桶、水槽或下水道堵塞，水排不下去。",
    leak_problem: "天花板或水管出現漏水現象。",
    boiler_problem: "地暖/鍋爐出現故障，不出熱水。",
    help_cost: "請問到府檢查和維修費用大約是多少？",
    location_query: "請問您現在的詳細地址在哪裡？",
    on_my_way: "好的，已收到您的訊息，我現在馬上出發過去。",
    urgent_visit: "可以盡快過來幫我處理嗎？",
    completed_check: "施工已完成，請您驗收一下。",
    thanks: "非常感謝您迅速而熱心的協助！",
  },
  ru: {
    hello: "Здравствуйте",
    clog_problem: "Засорился унитаз, раковина или слив, вода не уходит.",
    leak_problem: "Протечка воды из потолка или труб.",
    boiler_problem: "Котел не работает, нет горячей воды.",
    help_cost: "Сколько стоит выезд мастера и ремонт?",
    location_query: "Подскажите, пожалуйста, ваш точный адрес?",
    on_my_way: "Да, понял. Выезжаю к вам прямо сейчас.",
    urgent_visit: "Не могли бы вы приехать как можно скорее?",
    completed_check: "Работа выполнена. Пожалуйста, проверьте.",
    thanks: "Большое спасибо за оперативную помощь!",
  },
};

/**
 * Multi-provider translation strategy:
 * 1. MyMemory Translation API
 * 2. Fallback to dictionary pattern match
 * 3. Fallback to bilingual format annotation
 */
export async function POST(req: Request) {
  try {
    const { text, sourceLang = "auto", targetLang = "ko" } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ translatedText: "", originalText: text });
    }

    const cleanText = text.trim();
    const cleanSource = sourceLang === "zh-Hans" || sourceLang === "zh-Hant" ? "zh" : sourceLang;
    const cleanTarget = targetLang === "zh-Hans" || targetLang === "zh-Hant" ? "zh" : targetLang;

    // If source and target are the same language, return as-is
    if (cleanSource === cleanTarget && cleanSource !== "auto") {
      return NextResponse.json({
        translatedText: cleanText,
        originalText: cleanText,
        sourceLang,
        targetLang,
      });
    }

    // Attempt 1: Free Public MyMemory API
    try {
      const pair = `${cleanSource === "auto" ? "en" : cleanSource}|${cleanTarget}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        cleanText,
      )}&langpair=${encodeURIComponent(pair)}`;

      const res = await fetch(url, {
        headers: { "User-Agent": "LIFE.HELP-Translator/1.0" },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const json = await res.json();
        const translated = json?.responseData?.translatedText;
        if (translated && typeof translated === "string" && translated.trim()) {
          return NextResponse.json({
            translatedText: translated.trim(),
            originalText: cleanText,
            sourceLang,
            targetLang,
            provider: "mymemory",
          });
        }
      }
    } catch {
      // ignore and fallback
    }

    // Attempt 2: Pattern match against service phrase dictionary
    const targetDict = SERVICE_PHRASE_DICT[targetLang] || SERVICE_PHRASE_DICT["en"] || SERVICE_PHRASE_DICT["ko"];
    for (const [key, phrase] of Object.entries(targetDict)) {
      // Check if text loosely relates
      if (cleanText.toLowerCase().includes(key) || cleanText.includes(phrase)) {
        return NextResponse.json({
          translatedText: phrase,
          originalText: cleanText,
          sourceLang,
          targetLang,
          provider: "dict",
        });
      }
    }

    // Fallback: Return original text with clear language indicator
    return NextResponse.json({
      translatedText: cleanText,
      originalText: cleanText,
      sourceLang,
      targetLang,
      provider: "raw",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

