import type { ThinkLang } from "@/lib/think/lang";

/** Strings of the learning-site hub (the player itself uses labels.ts). */
export interface HubLabels { title: string; intro: string; grade: string; electives: string; empty: string; done: string; open: string; of: string; notTranslated: string; allFields: string; field: string; tryOne: string }
export const HUB: Record<ThinkLang, HubLabels> = {
  ko: { title: "사고력 도전", intro: "정답 하나를 찾는 문제가 아니라, 근거를 모아 추론하고, 비교하고, 오류를 고치고, 직접 만들어 보는 과제예요. 기본 레슨과 따로, 원할 때 도전해요.", grade: "학년·레벨", electives: "선택 과목", empty: "이 학년의 과제는 아직 없어요.", done: "해 봤어요", open: "열기", of: "/", notTranslated: "이 언어로 번역이 끝나지 않은 과제는 숨겼어요. 번역이 준비되면 열려요. 숨긴 과제 수", allFields: "모든 분야", field: "분야", tryOne: "바로 도전하기" },
  en: { title: "Thinking challenges", intro: "Not one-right-answer questions: tasks where you weigh evidence, compare, fix errors and make your own examples. Separate from the regular lessons - try them whenever you like.", grade: "Grade / level", electives: "Elective courses", empty: "There are no tasks for this level yet.", done: "Tried", open: "Open", of: "of", notTranslated: "Tasks that are not yet translated into your language are hidden and will open when their translation is ready. Hidden tasks", allFields: "All fields", field: "Field", tryOne: "Try one now" },
  "zh-Hans": { title: "思维力挑战", intro: "不是只找一个标准答案，而是收集依据进行推理、比较、纠错并亲手创造例子的任务。与常规课程分开，想做就做。", grade: "年级·水平", electives: "选修科目", empty: "该水平暂时还没有任务。", done: "已尝试", open: "打开", of: "/", notTranslated: "尚未翻译成你的语言的任务已隐藏，翻译完成后会开放。已隐藏的任务数", allFields: "全部领域", field: "领域", tryOne: "马上挑战" },
  "zh-Hant": { title: "思考力挑戰", intro: "不是只找一個標準答案，而是蒐集依據進行推理、比較、糾錯並親手創造範例的任務。與一般課程分開，想做就做。", grade: "年級·程度", electives: "選修科目", empty: "此程度暫時還沒有任務。", done: "已嘗試", open: "開啟", of: "/", notTranslated: "尚未翻譯成你的語言的任務已隱藏，翻譯完成後會開放。已隱藏的任務數", allFields: "全部領域", field: "領域", tryOne: "馬上挑戰" },
  ja: { title: "思考力チャレンジ", intro: "正解を一つ探す問題ではなく、根拠を集めて推論し、比べ、誤りを直し、自分で例を作るタスクです。通常のレッスンとは別に、好きなときに挑戦できます。", grade: "学年・レベル", electives: "選択科目", empty: "このレベルのタスクはまだありません。", done: "挑戦済み", open: "開く", of: "/", notTranslated: "まだあなたの言語に翻訳されていないタスクは非表示です。翻訳が終わると開きます。非表示のタスク数", allFields: "すべての分野", field: "分野", tryOne: "さっそく挑戦" },
  vi: { title: "Thử thách tư duy", intro: "Không phải câu hỏi chỉ có một đáp án đúng, mà là bài tập thu thập căn cứ để suy luận, so sánh, sửa lỗi và tự tạo ví dụ. Tách riêng khỏi bài học thường, em làm khi nào muốn.", grade: "Lớp / mức", electives: "Môn tự chọn", empty: "Mức này chưa có bài tập.", done: "Đã thử", open: "Mở", of: "/", notTranslated: "Các bài tập chưa được dịch sang ngôn ngữ của bạn đang bị ẩn và sẽ mở khi bản dịch sẵn sàng. Số bài đang ẩn", allFields: "Tất cả lĩnh vực", field: "Lĩnh vực", tryOne: "Thử ngay" },
};
export const ELECTIVE_NAMES: Record<string, Record<ThinkLang, string>> = {
  "EL-econ": { ko: "경제 수학", en: "Economic Mathematics", "zh-Hans": "经济数学", "zh-Hant": "經濟數學", ja: "経済数学", vi: "Toán kinh tế" },
  "EL-ai": { ko: "인공지능 수학", en: "AI Mathematics", "zh-Hans": "人工智能数学", "zh-Hant": "人工智慧數學", ja: "人工知能数学", vi: "Toán trí tuệ nhân tạo" },
  "EL-job": { ko: "직무 수학", en: "Workplace Mathematics", "zh-Hans": "职业数学", "zh-Hant": "職務數學", ja: "職務数学", vi: "Toán nghề nghiệp" },
  "EL-cul": { ko: "수학과 문화", en: "Mathematics and Culture", "zh-Hans": "数学与文化", "zh-Hant": "數學與文化", ja: "数学と文化", vi: "Toán học và văn hóa" },
  "EL-sta": { ko: "실용 통계", en: "Practical Statistics", "zh-Hans": "实用统计", "zh-Hant": "實用統計", ja: "実用統計", vi: "Thống kê thực hành" },
  "EL-res": { ko: "수학과제 탐구", en: "Mathematical Inquiry Project", "zh-Hans": "数学课题探究", "zh-Hant": "數學課題探究", ja: "数学課題探究", vi: "Nghiên cứu đề tài toán học" },
};
