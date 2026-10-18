import type { ThinkLang } from "@/lib/think/lang";

/** Strings of the "10 regular questions -> 1 thinking challenge" offer. Same six languages as the tasks; AI-translated, not native-reviewed. */
export interface FlowLabels { title: (n: number) => string; body: string; now: string; later: string; laterNote: string; counting: string }
export const FLOW: Record<ThinkLang, FlowLabels> = {
  ko: { title: (n) => `일반 문제 ${n}개를 풀었어요`, body: "사고력 도전 하나를 해 볼까요? 지금 하지 않아도 괜찮아요.", now: "지금 도전", later: "나중에", laterNote: "나중에 사고력 메뉴에서 이어서 할 수 있어요.", counting: "정답을 맞히거나 해설까지 확인한 문제만 세어요. 같은 문제를 다시 풀어도 한 번만 세어요." },
  en: { title: (n) => `You finished ${n} regular questions`, body: "Want to try one thinking challenge? It is fine to do it later.", now: "Try it now", later: "Later", laterNote: "You can pick it up later in the Thinking menu.", counting: "Only questions you solved or finished by reading the explanation count. The same question counts once." },
  "zh-Hans": { title: (n) => `你已完成 ${n} 道常规题`, body: "要不要试一个思维力挑战？以后再做也可以。", now: "现在挑战", later: "稍后", laterNote: "之后可以在“思维力”菜单里继续。", counting: "只统计答对或看完解析的题目；同一道题只算一次。" },
  "zh-Hant": { title: (n) => `你已完成 ${n} 道一般題`, body: "要不要試一個思考力挑戰？之後再做也可以。", now: "現在挑戰", later: "稍後", laterNote: "之後可以在「思考力」選單裡繼續。", counting: "只統計答對或看完解析的題目；同一道題只算一次。" },
  ja: { title: (n) => `通常の問題を${n}問終えました`, body: "思考力チャレンジを一つやってみますか？後でも大丈夫です。", now: "今すぐ挑戦", later: "あとで", laterNote: "あとで「思考力」メニューから続けられます。", counting: "正解した問題、または解説まで読んだ問題だけを数えます。同じ問題は一度だけです。" },
  vi: { title: (n) => `Bạn đã làm xong ${n} câu thường`, body: "Bạn muốn thử một thử thách tư duy không? Làm sau cũng được.", now: "Thử ngay", later: "Để sau", laterNote: "Bạn có thể tiếp tục sau trong mục Tư duy.", counting: "Chỉ tính câu bạn làm đúng hoặc đã đọc xong lời giải. Cùng một câu chỉ tính một lần." },
};
