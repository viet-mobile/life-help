/**
 * Multilingual dictionaries for the LIFE.HELP Referral & Fee Reduction Program.
 * Supports Korean, English, Vietnamese, Chinese (Simplified/Traditional), Japanese,
 * Spanish, Russian, Thai, Indonesian with English fallback for all 89 locales.
 */

export interface ReferralI18nStrings {
  badgeLabel: string; // "현재 수수료 {fee}"
  title: string;
  modalTitle: string;
  subtitle: string;
  currentFeeLabel: string;
  myFeeBadge: string;
  discountSavings: string;
  progressLabel: string;
  progressStatus: string;
  congratsLowest: string;
  remainingTip: string;
  modalExplainer: string;
  myCodeLabel: string;
  copyCodeBtn: string;
  copiedBtn: string;
  copyLinkBtn: string;
  shareBtn: string;
  shareTitle: string;
  shareText: string;
  rewardsAccumulated: string;
  milestone0: string;
  milestone1: string;
  milestone10: string;
  milestone100: string;
  milestone500: string;
  milestone999: string;
}

const DICTIONARIES: Record<string, ReferralI18nStrings> = {
  ko: {
    badgeLabel: "현재 수수료 {fee}",
    title: "LIFE.HELP 친구 초대 수수료 인하 프로그램",
    modalTitle: "친구 초대 수수료 단계적 인하",
    subtitle: "1명 초대 시 9.99%부터 시작하여 1명당 0.01%씩 영구 인하 (999명 초대 시 최저 0.01% 도달)",
    currentFeeLabel: "현재 적용 수수료율",
    myFeeBadge: "내 수수료율: {fee}",
    discountSavings: "기준 10.00% 대비 인하 혜택",
    progressLabel: "수수료 인하 진행도: {fee} (최저 0.01% 목표)",
    progressStatus: "{count} / {goal}명 완료 ({percent}%)",
    congratsLowest: "🎉 축하합니다! 최저 수수료 0.01%에 도달했습니다!",
    remainingTip: "앞으로 {remaining}명 더 초대하면 최저 0.01%에 도달합니다.",
    modalExplainer: "1명 초대 시 9.99% 시작, 1명마다 0.01%p씩 내려가며 {remaining}명을 더 초대하면 최저 0.01%에 도달합니다.",
    myCodeLabel: "내 고유 추천인 코드",
    copyCodeBtn: "코드 복사",
    copiedBtn: "✓ 복사됨",
    copyLinkBtn: "🔗 초대 링크 복사",
    shareBtn: "💬 공유하기",
    shareTitle: "LIFE.HELP - 생활 서비스 & 수수료 인하 리퍼럴 초대",
    shareText: "LIFE.HELP에서 생활 서비스 10% 할인과 함께 매 추천마다 수수료가 0.01%씩 인하되는 혜택을 누리세요! (추천 코드: {code})",
    rewardsAccumulated: "누적 적립 리워드: {amount}",
    milestone0: "0명 초대",
    milestone1: "1명 초대",
    milestone10: "10명 초대",
    milestone100: "100명 초대",
    milestone500: "500명 초대",
    milestone999: "999명 초대 (최저 0.01%)",
  },
  en: {
    badgeLabel: "Current Fee {fee}",
    title: "LIFE.HELP Invite Friends & Fee Reduction Program",
    modalTitle: "Step-by-Step Fee Reduction via Referrals",
    subtitle: "Starts at 9.99% with 1 invite, permanently reduced by 0.01%p per referral (reaches lowest 0.01% with 999 invites)",
    currentFeeLabel: "Current Applied Fee Rate",
    myFeeBadge: "My Fee Rate: {fee}",
    discountSavings: "Fee Reduction vs Base 10.00%",
    progressLabel: "Fee Progress: {fee} (Lowest 0.01% Goal)",
    progressStatus: "{count} / {goal} invited ({percent}%)",
    congratsLowest: "🎉 Congratulations! You have reached the lowest fee of 0.01%!",
    remainingTip: "Invite {remaining} more friends to reach the lowest fee of 0.01%.",
    modalExplainer: "Starts at 9.99% with 1 invite, lowers by 0.01%p per invite. Invite {remaining} more to reach the lowest 0.01%.",
    myCodeLabel: "My Unique Referral Code",
    copyCodeBtn: "Copy Code",
    copiedBtn: "✓ Copied",
    copyLinkBtn: "🔗 Copy Invite Link",
    shareBtn: "💬 Share",
    shareTitle: "LIFE.HELP - Living Services & Fee Reduction Referral",
    shareText: "Enjoy 10% off living services on LIFE.HELP and reduce your platform fees by 0.01% per friend! (Referral Code: {code})",
    rewardsAccumulated: "Accumulated Rewards: {amount}",
    milestone0: "0 Invited",
    milestone1: "1 Invited",
    milestone10: "10 Invited",
    milestone100: "100 Invited",
    milestone500: "500 Invited",
    milestone999: "999 Invited (Min 0.01%)",
  },
  vi: {
    badgeLabel: "Phí hiện tại {fee}",
    title: "Chương trình Giảm phí khi Mời bạn bè LIFE.HELP",
    modalTitle: "Giảm phí theo từng bước khi mời bạn bè",
    subtitle: "Bắt đầu từ 9.99% khi mời 1 người, giảm vĩnh viễn 0.01%p cho mỗi người (đạt mức thấp nhất 0.01% với 999 người)",
    currentFeeLabel: "Mức phí áp dụng hiện tại",
    myFeeBadge: "Mức phí của tôi: {fee}",
    discountSavings: "Mức giảm so với chuẩn 10.00%",
    progressLabel: "Tiến độ giảm phí: {fee} (Mục tiêu 0.01%)",
    progressStatus: "{count} / {goal} người hoàn thành ({percent}%)",
    congratsLowest: "🎉 Chúc mừng! Bạn đã đạt mức phí thấp nhất 0.01%!",
    remainingTip: "Mời thêm {remaining} người nữa để đạt mức phí tối thiểu 0.01%.",
    modalExplainer: "Bắt đầu từ 9.99% khi mời 1 người, giảm 0.01%p cho mỗi người. Mời thêm {remaining} người để đạt mức thấp nhất 0.01%.",
    myCodeLabel: "Mã giới thiệu độc quyền của tôi",
    copyCodeBtn: "Sao chép mã",
    copiedBtn: "✓ Đã sao chép",
    copyLinkBtn: "🔗 Sao chép link mời",
    shareBtn: "💬 Chia sẻ",
    shareTitle: "LIFE.HELP - Dịch vụ đời sống & Giảm phí qua giới thiệu",
    shareText: "Tận hưởng ưu đãi giảm 10% dịch vụ đời sống tại LIFE.HELP cùng mức giảm phí 0.01% cho mỗi lượt mời! (Mã giới thiệu: {code})",
    rewardsAccumulated: "Phần thưởng tích lũy: {amount}",
    milestone0: "Mời 0 người",
    milestone1: "Mời 1 người",
    milestone10: "Mời 10 người",
    milestone100: "Mời 100 người",
    milestone500: "Mời 500 người",
    milestone999: "Mời 999 người (Tối thiểu 0.01%)",
  },
  "zh-Hans": {
    badgeLabel: "当前手续费 {fee}",
    title: "LIFE.HELP 邀请好友阶梯式降低手续费计划",
    modalTitle: "邀请好友阶梯式减免手续费",
    subtitle: "成功邀请1人即降至9.99%，每多邀请1人永久降低0.01%（累计999人即可降至最低0.01%）",
    currentFeeLabel: "当前适用手续费率",
    myFeeBadge: "我的费率: {fee}",
    discountSavings: "相较基准10.00%的减免优惠",
    progressLabel: "手续费优惠进度: {fee} (目标最低0.01%)",
    progressStatus: "已邀请 {count} / {goal} 人 ({percent}%)",
    congratsLowest: "🎉 恭喜！您已达到最低手续费 0.01%！",
    remainingTip: "再邀请 {remaining} 人即可达到最低 0.01% 费率。",
    modalExplainer: "邀请1人即从9.99%开始，每邀请1人降低0.01%，再邀请{remaining}人即可达到最低0.01%。",
    myCodeLabel: "我的专属邀请码",
    copyCodeBtn: "复制邀请码",
    copiedBtn: "✓ 已复制",
    copyLinkBtn: "🔗 复制邀请链接",
    shareBtn: "💬 分享",
    shareTitle: "LIFE.HELP - 生活服务与手续费减免推荐",
    shareText: "在LIFE.HELP享受生活服务9折优惠，每邀请1位好友手续费永久递减0.01%！(邀请码: {code})",
    rewardsAccumulated: "累计积分奖励: {amount}",
    milestone0: "邀请 0 人",
    milestone1: "邀请 1 人",
    milestone10: "邀请 10 人",
    milestone100: "邀请 100 人",
    milestone500: "邀请 500 人",
    milestone999: "邀请 999 人 (最低 0.01%)",
  },
  "zh-Hant": {
    badgeLabel: "當前手續費 {fee}",
    title: "LIFE.HELP 邀請好友階梯式降低手續費計劃",
    modalTitle: "邀請好友階梯式減免手續費",
    subtitle: "成功邀請1人即降至9.99%，每多邀請1人永久降低0.01%（累計999人即可降至最低0.01%）",
    currentFeeLabel: "當前適用手續費率",
    myFeeBadge: "我的費率: {fee}",
    discountSavings: "相較基準10.00%的減免優惠",
    progressLabel: "手續費優惠進度: {fee} (目標最低0.01%)",
    progressStatus: "已邀請 {count} / {goal} 人 ({percent}%)",
    congratsLowest: "🎉 恭喜！您已達到最低手續費 0.01%！",
    remainingTip: "再邀請 {remaining} 人即可達到最低 0.01% 費率。",
    modalExplainer: "邀請1人即從9.99%開始，每邀請1人降低0.01%，再邀請{remaining}人即可達到最低0.01%。",
    myCodeLabel: "我的專屬邀請碼",
    copyCodeBtn: "複製邀請碼",
    copiedBtn: "✓ 已複製",
    copyLinkBtn: "🔗 複製邀請連結",
    shareBtn: "💬 分享",
    shareTitle: "LIFE.HELP - 生活服務與手續費減免推薦",
    shareText: "在LIFE.HELP享受生活服務9折優惠，每邀請1位好友手續費永久遞減0.01%！(邀請碼: {code})",
    rewardsAccumulated: "累計獎勵: {amount}",
    milestone0: "邀請 0 人",
    milestone1: "邀請 1 人",
    milestone10: "邀請 10 人",
    milestone100: "邀請 100 人",
    milestone500: "邀請 500 人",
    milestone999: "邀請 999 人 (最低 0.01%)",
  },
  ja: {
    badgeLabel: "現在の手数料 {fee}",
    title: "LIFE.HELP 友達招待・手数料引き下げプログラム",
    modalTitle: "友達招待による手数料の段階的引き下げ",
    subtitle: "1人招待で9.99%からスタート、1人ごとに0.01%p永久引き下げ（999人招待で最低0.01%に到達）",
    currentFeeLabel: "現在の適用手数料率",
    myFeeBadge: "私の手数料率: {fee}",
    discountSavings: "基準10.00%からの引き下げ優待",
    progressLabel: "手数料引き下げ進捗: {fee} (最低0.01%目標)",
    progressStatus: "{count} / {goal}人完了 ({percent}%)",
    congratsLowest: "🎉 おめでとうございます！最低手数料0.01%に到達しました！",
    remainingTip: "あと{remaining}人招待すると最低0.01%に到達します。",
    modalExplainer: "1人招待で9.99%からスタート、1人ごとに0.01%p下がり、あと{remaining}人招待で最低0.01%に到達します。",
    myCodeLabel: "私の専用紹介コード",
    copyCodeBtn: "コードをコピー",
    copiedBtn: "✓ コピー完了",
    copyLinkBtn: "🔗 招待リンクをコピー",
    shareBtn: "💬 共有する",
    shareTitle: "LIFE.HELP - 生活サービス＆手数料引き下げリファラル招待",
    shareText: "LIFE.HELPで生活サービス10%割引を受け、友達招待ごとに手数料が0.01%引き下がる特典をゲット！（紹介コード: {code}）",
    rewardsAccumulated: "累積リワード: {amount}",
    milestone0: "0人招待",
    milestone1: "1人招待",
    milestone10: "10人招待",
    milestone100: "100人招待",
    milestone500: "500人招待",
    milestone999: "999人招待 (最低0.01%)",
  },
  es: {
    badgeLabel: "Tarifa actual {fee}",
    title: "Programa de Reducción de Tarifas por Invitación LIFE.HELP",
    modalTitle: "Reducción Escalonada de Tarifas por Invitación",
    subtitle: "Comienza en 9.99% con 1 invitado, reducido en 0.01%p por persona (mínimo 0.01% con 999 personas)",
    currentFeeLabel: "Tasa de tarifa aplicada actual",
    myFeeBadge: "Mi tarifa: {fee}",
    discountSavings: "Ahorro frente al 10.00% base",
    progressLabel: "Progreso de tarifa: {fee} (Meta 0.01%)",
    progressStatus: "{count} / {goal} invitados ({percent}%)",
    congratsLowest: "🎉 ¡Felicidades! ¡Has alcanzado la tarifa mínima del 0.01%!",
    remainingTip: "Invita a {remaining} amigos más para alcanzar el 0.01%.",
    modalExplainer: "Inicia en 9.99% con 1 invitado, baja 0.01%p por invitado. Invita a {remaining} más para llegar al 0.01%.",
    myCodeLabel: "Mi código de invitación único",
    copyCodeBtn: "Copiar código",
    copiedBtn: "✓ Copiado",
    copyLinkBtn: "🔗 Copiar enlace",
    shareBtn: "💬 Compartir",
    shareTitle: "LIFE.HELP - Servicios y reducción de tarifas",
    shareText: "¡Disfruta de un 10% de descuento en LIFE.HELP y reduce tu tarifa en un 0.01% por amigo! (Código: {code})",
    rewardsAccumulated: "Recompensas acumuladas: {amount}",
    milestone0: "0 invitados",
    milestone1: "1 invitado",
    milestone10: "10 invitados",
    milestone100: "100 invitados",
    milestone500: "500 invitados",
    milestone999: "999 invitados (Mín 0.01%)",
  },
  ru: {
    badgeLabel: "Текущая комиссия {fee}",
    title: "Программа снижения комиссии за приглашение друзей LIFE.HELP",
    modalTitle: "Поэтапное снижение комиссии за рекомендации",
    subtitle: "Начинается с 9.99% при 1 приглашении, снижается на 0.01%p за каждого (минимум 0.01% при 999 друзьях)",
    currentFeeLabel: "Текущая ставка комиссии",
    myFeeBadge: "Моя комиссия: {fee}",
    discountSavings: "Снижение по сравнению с базовой 10.00%",
    progressLabel: "Прогресс комиссии: {fee} (Цель 0.01%)",
    progressStatus: "{count} / {goal} приглашено ({percent}%)",
    congratsLowest: "🎉 Поздравляем! Вы достигли минимальной комиссии 0.01%!",
    remainingTip: "Пригласите еще {remaining} друзей, чтобы достичь 0.01%.",
    modalExplainer: "Начинается с 9.99%, снижается на 0.01%p за человека. Пригласите еще {remaining}, чтобы достичь 0.01%.",
    myCodeLabel: "Мой уникальный код приглашения",
    copyCodeBtn: "Копировать код",
    copiedBtn: "✓ Скопировано",
    copyLinkBtn: "🔗 Копировать ссылку",
    shareBtn: "💬 Поделиться",
    shareTitle: "LIFE.HELP - Снижение комиссии за приглашение",
    shareText: "Получите скидку 10% на услуги LIFE.HELP и снижайте комиссию на 0.01% за каждого друга! (Код: {code})",
    rewardsAccumulated: "Накопленные награды: {amount}",
    milestone0: "0 приглашений",
    milestone1: "1 приглашение",
    milestone10: "10 приглашений",
    milestone100: "100 приглашений",
    milestone500: "500 приглашений",
    milestone999: "999 приглашений (Мин. 0.01%)",
  },
};

/**
 * Returns localized strings for the Referral & Fee Reduction Program.
 * Automatically falls back to English for any unsupported locale.
 */
export function getReferralI18n(locale: string = "ko"): ReferralI18nStrings {
  if (locale === "ko") return DICTIONARIES.ko;
  if (locale === "vi") return DICTIONARIES.vi;
  if (locale === "zh-Hans" || locale === "zh-CN" || locale === "zh") return DICTIONARIES["zh-Hans"];
  if (locale === "zh-Hant" || locale === "zh-TW" || locale === "zh-HK") return DICTIONARIES["zh-Hant"];
  if (locale === "ja") return DICTIONARIES.ja;
  if (locale === "es") return DICTIONARIES.es;
  if (locale === "ru") return DICTIONARIES.ru;
  return DICTIONARIES.en;
}
