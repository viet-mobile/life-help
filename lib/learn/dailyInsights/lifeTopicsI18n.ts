import raw89Data from "./lifeTopics89.json";

/**
 * Master Multilingual Knowledge Base for All Practical Life Topics
 * Supports all 88 foreign languages with fallback to English.
 */

export interface TopicI18nEntry {
  title: Record<string, string>;
  summary: Record<string, string>;
  principle: Record<string, string>;
  example: Record<string, string>;
  actionItem: Record<string, string>;
}

const LIFE_DATA_89: Record<string, TopicI18nEntry> = raw89Data as unknown as Record<string, TopicI18nEntry>;

export const LIFE_TOPICS_I18N: Record<string, TopicI18nEntry> = {
  "연말정산 환급 극대화 ISA + IRP 세액공제": {
    title: {"en": "Year-End Tax Settlement: Maximize Refunds with ISA + IRP Deductions", "vi": "Tối đa hóa tiền hoàn thuế cuối năm qua khấu trừ thuế ISA + IRP", "zh-Hans": "年末清算退税最大化：ISA与IRP税额扣除实操"},
    summary: {"en": "Optimize annual income tax savings by strategically combining ISA and IRP retirement pension accounts.", "vi": "Tối ưu hóa số tiền hoàn thuế thu nhập cá nhân hàng năm bằng cách kết hợp thông minh tài khoản ISA và quỹ hưu trí IRP.", "zh-Hans": "通过组合个人综合资产管理账户(ISA)与个人退休年金(IRP)，实现年度个人所得税退税最大化。"},
    principle: {"en": "Contribute up to 9 million KRW annually to Pension Savings + IRP for up to 16.5% tax credit (up to 1,485,000 KRW refund).", "vi": "Đóng tối đa 9 triệu won/năm vào Quỹ hưu trí cá nhân (IRP) để hưởng khấu trừ thuế lên tới 16,5% (hoàn tối đa 1.485.000 won).", "zh-Hans": "向年金储蓄及IRP账户年累计缴纳最高900万韩元，可享受高达16.5%的税额扣除（最高退税148.5万韩元）。"},
    example: {"en": "Transferring matured ISA funds into a retirement pension account unlocks an additional 3 million KRW deduction limit (10% credit).", "vi": "Chuyển tiền khi đáo hạn ISA sang tài khoản hưu trí sẽ được mở thêm hạn mức khấu trừ thuế 3 triệu won (giảm thêm 10%).", "zh-Hans": "ISA到期资金转入个人退休年金账户时，可额外追加300万韩元税额扣除额度（10%税额抵扣）。"},
    actionItem: {"en": "Log into your banking app before December 31 to check your remaining annual contribution limit for IRP/pension accounts.", "vi": "Kiểm tra hạn mức nộp tiền quỹ hưu trí IRP năm nay trong ứng dụng ngân hàng trước ngày 31 tháng 12.", "zh-Hans": "在12月31日之前登录银行App，核对今年IRP/年金账户的剩余可缴额度并及时缴存。"},
  },
  "알뜰폰(MVNO) 셀프 개통으로 연 60만 원 절감": {
    title: {"en": "Save 600,000 KRW Annually with Self-Activated Budget Telecom (MVNO)", "vi": "Tiết kiệm 600.000 won mỗi năm bằng cách tự mở mạng viễn thông giá rẻ (MVNO)", "zh-Hans": "自助开通平价手机卡(MVNO)每年节省60万韩元通信费"},
    summary: {"en": "Drastically reduce fixed living expenses by switching to contract-free unlimited budget mobile plans using the same top-tier telecom networks.", "vi": "Cắt giảm mạnh chi phí cố định hằng tháng bằng cách chuyển sang các gói cước viễn thông giá rẻ không hợp đồng ràng buộc với cùng chất lượng sóng mạng lớn.", "zh-Hans": "利用三大电信公司完全相同的基站网络，切换至无违约金的平价无限流量套餐，大幅削减每月通信固定支出。"},
    principle: {"en": "MVNOs lease network infrastructure from major carriers (SKT/KT/LGU+), delivering identical coverage at roughly one-third of the retail price without long commitments.", "vi": "Các nhà mạng MVNO thuê chung hạ tầng sóng của SKT/KT/LGU+, cho chất lượng sóng tương đương với mức giá chỉ bằng 1/3 và không bị ràng buộc cam kết dài hạn.", "zh-Hans": "平价通信商租用三大通信商基站，通话与网络覆盖完全相同，月费仅为传统套餐的三分之一且无长期合约约束。"},
    example: {"en": "Switching from a 69,000 KRW carrier plan to an 18,000 KRW MVNO plan saves 51,000 KRW each month (612,000 KRW saved per year).", "vi": "Đổi từ gói 69.000 won của nhà mạng lớn sang gói 18.000 won của mạng giá rẻ giúp tiết kiệm 51.000 won/tháng (tiết kiệm 612.000 won/năm).", "zh-Hans": "从三大运营商每月6.9万韩元套餐转换至平价运营商每月1.8万韩元套餐，每月可净省5.1万韩元（全年累计节省61.2万韩元）。"},
    actionItem: {"en": "Check your current carrier contract expiration status in your telecom customer service app, then pick an eSIM/USIM plan online.", "vi": "Kiểm tra thời hạn cam kết trong ứng dụng nhà mạng hiện tại, sau đó tự chọn mua eSIM/USIM mạng giá rẻ qua mạng.", "zh-Hans": "打开当前电信公司客服App核对合约是否已到期，随后在比价网站选购支持自主开通的USIM或eSIM套餐。"},
  },
  "국민취업지원제도 구직촉진수당 월 50만 원": {
    title: {"en": "국민취업지원제도 구직촉진수당 월 50만 원 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 국민취업지원제도 구직촉진수당 월 50만 원 to optimize everyday decisions and reduce costs."},
    principle: {"en": "구직 청년 및 취업준비생에게 매월 50만 원씩 6개월간 최대 300만 원 지원"},
    example: {"en": "1:1 취업 컨설팅, 이력서 첨삭, 직업훈련 연계 프로그램 제공"},
    actionItem: {"en": "고용24 사이트에서 국민취업지원제도 1유형 신청 자격을 조회하세요."},
  },
  "만성 피로 잡는 카페인 반감기와 수면 위생": {
    title: {"en": "만성 피로 잡는 카페인 반감기와 수면 위생 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 만성 피로 잡는 카페인 반감기와 수면 위생 to optimize everyday decisions and reduce costs."},
    principle: {"en": "카페인의 혈중 반감기는 5~7시간; 뇌의 아데노신 수용체 차단 지속"},
    example: {"en": "취침 최소 8시간 전(오후 2시) 카페인 섭취를 마감하여 숙면 보장"},
    actionItem: {"en": "오후 2시 이후에는 커피 대신 따뜻한 보리차나 루이보스티를 드세요."},
  },
  "K-패스 vs 기후동행카드 가성비 선택 기준": {
    title: {"en": "K-Pass vs Climate Card: Which Commuter Transit Pass Saves You More?", "vi": "K-Pass và Thẻ Khí hậu (Climate Card): Chọn thẻ giao thông nào tiết kiệm hơn?", "zh-Hans": "K-Pass与气候同行卡：哪款交通优惠卡更划算？"},
    summary: {"en": "Compare your monthly public transit spending and commuting boundaries to choose between fixed-rate unlimited passes and percentage cashbacks.", "vi": "So sánh chi phí đi lại hàng tháng và khu vực di chuyển để chọn giữa thẻ vé tháng không giới hạn hay thẻ hoàn tiền theo tỷ lệ.", "zh-Hans": "根据每月交通开支金额与跨区域通勤路线，精准选择定额无限次畅行卡或百分比返现卡。"},
    principle: {"en": "If monthly transit exceeds 77,500 KRW strictly within Seoul, Climate Card wins (62,000 KRW); if commuting across Gyeonggi/Incheon or spending less, K-Pass offers 20–53% cashback nationwide.", "vi": "Nếu đi lại trong nội thành Seoul trên 77.500 won/tháng, Thẻ Khí hậu có lợi hơn (vé tháng 62.000 won); nếu đi liên tỉnh Gyeonggi/Incheon, K-Pass hoàn tiền 20-53% trên toàn quốc.", "zh-Hans": "首尔市内月交通费超7.75万韩元，选6.2万韩元气候卡划算；往返京畿道/仁川或消费较低者，选全国返现20%~53%的K-Pass更优。"},
    example: {"en": "Commuting from Suwon to Gangnam with red express buses saves approx. 35,000 KRW per month using K-Pass (30% youth refund).", "vi": "Đi xe buýt đỏ liên tỉnh từ Suwon đến Gangnam giúp tiết kiệm khoảng 35.000 won mỗi tháng khi dùng thẻ K-Pass (hoàn 30% cho giới trẻ).", "zh-Hans": "从京畿道水原乘坐广域红色巴士通勤至江南站，使用K-Pass每月可获约3.5万韩元青年返现补贴（30%返现）。"},
    actionItem: {"en": "Review your transportation card history in your banking app for the past month, then apply for K-Pass or Climate Card accordingly.", "vi": "Mở ứng dụng ngân hàng xem lại tổng chi phí giao thông tháng trước để quyết định đăng ký thẻ K-Pass hay Thẻ Khí hậu.", "zh-Hans": "在银行卡App中查询上月交通费总支出与路线明细，根据阈值即刻在线申领K-Pass或购买气候卡。"},
  },
  "임차권등기명령 전세금 미반환 즉시 대처": {
    title: {"en": "Leasehold Registration Order: Safeguard Deposit When Landlord Fails to Refund", "vi": "Lệnh đăng ký quyền thuê nhà: Bảo vệ tiền đặt cọc khi chủ nhà không hoàn trả", "zh-Hans": "申请租售权登记命令：房东拖欠全税保证金时的法定应对"},
    summary: {"en": "Protect your legal priority rights and full refund entitlement even after moving out if your rental deposit (Jeonse/Wolse) is withheld.", "vi": "Bảo toàn quyền ưu tiên nhận lại toàn bộ tiền cọc ngay cả khi chuyển chỗ ở nếu chủ nhà không chịu trả tiền đặt cọc (Jeonse/Wolse).", "zh-Hans": "租房到期房东未返还押金/全税金时，确保在搬迁后依然享有优先受偿权与全额追偿权的法律武器。"},
    principle: {"en": "Filing a Leasehold Registration Order (임차권등기명령) at the district court preserves your preferential repayment right even after changing address.", "vi": "Nộp đơn xin Lệnh đăng ký quyền thuê nhà tại Tòa án khu vực giúp duy trì hiệu lực đối kháng pháp lý ngay cả khi bạn đã chuyển hộ khẩu đi nơi khác.", "zh-Hans": "向法院申请'租借权登记命令'后，即使迁出原房屋并将户籍转移，原房屋上的对抗力与优先受偿权依然完全保留。"},
    example: {"en": "Completing registration forces legal pressure on the landlord and earns statutory delay interest until the entire deposit is recovered.", "vi": "Sau khi đăng ký thành công, chủ nhà không thể cho người mới thuê và phải chịu thêm tiền lãi chậm trả theo luật định.", "zh-Hans": "登记完成后房东无法将房屋再出租给他人，且依法须自到期日起向租客支付法定延迟利息。"},
    actionItem: {"en": "If your deposit is not returned on lease expiration, immediately apply for registration online via the Court Electronic Litigation site.", "vi": "Nếu hết hạn hợp đồng mà chủ nhà chưa trả cọc, nộp đơn trực tuyến ngay tại Cổng tố tụng điện tử Tòa án Tối cao Hàn Quốc.", "zh-Hans": "租期届满后若保证金未到账，立即通过法院电子诉讼系统或管辖法院在线提交租借权登记命令申请。"},
  },
  "청년도약계좌 정부기여금과 비과세 혜택": {
    title: {"en": "Youth Leap Account: Government Contribution & Tax-Exempt Wealth Growth", "vi": "Tài khoản Thanh niên Bứt phá (Youth Leap): Trợ cấp chính phủ và miễn thuế lãi", "zh-Hans": "青年跳跃储蓄账户：政府补贴金与利息全额免税"},
    summary: {"en": "Build up to 50 million KRW in asset foundation over 5 years through monthly savings matched by Korean government contributions and tax-free interest.", "vi": "Tích lũy khối tài sản lên tới 50 triệu won sau 5 năm nhờ tiền tiết kiệm hàng tháng được chính phủ Hàn Quốc cấp vốn đối ứng và miễn 100% thuế lãi.", "zh-Hans": "5年期每月定投，结合韩国政府对等补贴金及利息全额免税，稳步积蓄5000万韩元初期资产。"},
    principle: {"en": "Deposit up to 700,000 KRW monthly to receive up to 6.0% bank interest plus up to 33,000 KRW monthly government matching funds and 0% tax on interest.", "vi": "Gửi tối đa 700.000 won/tháng để nhận lãi suất ngân hàng lên tới 6,0% kèm tối đa 33.000 won trợ cấp chính phủ mỗi tháng và miễn thuế thu nhập từ lãi.", "zh-Hans": "每月最高存入70万韩元，享受最高6.0%银行利息，同时每月获发最高3.3万韩元政府补贴，利息收益100%免税。"},
    example: {"en": "Contributing 700,000 KRW monthly for 5 years yields approx. 50 million KRW maturity payout (including approx. 8 million KRW in interest and matching funds).", "vi": "Gửi đều đặn 700.000 won/tháng trong 5 năm nhận về xấp xỉ 50 triệu won khi đáo hạn (trong đó có khoảng 8 triệu won tiền lãi và trợ cấp chính phủ).", "zh-Hans": "连续5年每月缴存70万韩元，到期本息及补贴金总计可领取约5000万韩元（包含约800万韩元纯收益）。"},
    actionItem: {"en": "Check your personal income eligibility and youth age criteria (19–34) on the Korea Inclusive Finance Agency app.", "vi": "Kiểm tra điều kiện thu nhập cá nhân và độ tuổi thanh niên (19-34) trên ứng dụng Cơ quan Tài chính Hòa nhập Hàn Quốc.", "zh-Hans": "在韩国庶民金融振兴院App中查询个人上一年度所得证明及青年年龄（19~34岁）申请资格。"},
  },
  "도시가스 캐시백 동절기 난방비 환급 신청": {
    title: {"en": "도시가스 캐시백 동절기 난방비 환급 신청 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 도시가스 캐시백 동절기 난방비 환급 신청 to optimize everyday decisions and reduce costs."},
    principle: {"en": "전년 동기 대비 3% 이상 절감 시 절감량에 따라 현금 캐시백 지급"},
    example: {"en": "K-가스캐시백 사이트(k-gascashback.or.kr)에서 겨울철 신청 접수"},
    actionItem: {"en": "도시가스 캐시백 홈페이지에 접속해 회원가입 및 환급 계좌를 등록하세요."},
  },
  "청년 일자리 도약장려금 중소기업 취업 혜택": {
    title: {"en": "청년 일자리 도약장려금 중소기업 취업 혜택 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 청년 일자리 도약장려금 중소기업 취업 혜택 to optimize everyday decisions and reduce costs."},
    principle: {"en": "청년 취업자 장기근속 유도를 위한 정부 지원 인센티브"},
    example: {"en": "정규직 채용 후 2년간 고용 유지 시 청년과 기업 모두에게 혜택 부여"},
    actionItem: {"en": "워크넷에서 청년 일자리 도약장려금 참여 기업 공고를 확인하세요."},
  },
  "스마트폰 블루라이트 차단과 멜라토닌 분비": {
    title: {"en": "스마트폰 블루라이트 차단과 멜라토닌 분비 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 스마트폰 블루라이트 차단과 멜라토닌 분비 to optimize everyday decisions and reduce costs."},
    principle: {"en": "취침 1시간 전 스마트폰 화면의 청색광이 멜라토닌 생성을 억제"},
    example: {"en": "취침 전 독서나 스트레칭으로 뇌의 각성도를 낮추고 수면 유도"},
    actionItem: {"en": "스마트폰에서 '야간 편안하게 보기(블루라이트 필터)' 자동 예약을 켜세요."},
  },
  "인천공항 스마트패스 사전 등록으로 출국 단축": {
    title: {"en": "인천공항 스마트패스 사전 등록으로 출국 단축 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 인천공항 스마트패스 사전 등록으로 출국 단축 to optimize everyday decisions and reduce costs."},
    principle: {"en": "얼굴 인식으로 여권/탑승권 없이 전용 출국장을 3초 만에 통과"},
    example: {"en": "공항 출국장 대기 시간을 최대 70% 단축"},
    actionItem: {"en": "인천공항 스마트패스 앱을 설치하고 여권과 얼굴을 사전 등록하세요."},
  },
  "1372 소비자상담센터와 피해구제 신청": {
    title: {"en": "1372 소비자상담센터와 피해구제 신청 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 1372 소비자상담센터와 피해구제 신청 to optimize everyday decisions and reduce costs."},
    principle: {"en": "물품 하자, 환불 거부 시 한국소비자원의 전문 합의 권고 및 분쟁 조정"},
    example: {"en": "판매자가 정당한 환불을 거부할 때 법적 효력 있는 분쟁 해결 절차"},
    actionItem: {"en": "소비자 분쟁 발생 시 1372 번호로 상담을 접수하세요."},
  },
  "주거래은행 대출금리인하요구권 행사 요령": {
    title: {"en": "Loan Interest Reduction Right: How to Lower Your Interest Rate as Your Credit Improves", "vi": "Quyền yêu cầu giảm lãi suất vay ngân hàng: Cách hạ lãi suất khi hồ sơ tín dụng cải thiện", "zh-Hans": "行使贷款利率下调要求权：信用提升时主动降低贷款利息"},
    summary: {"en": "Exercise your statutory right to request a lower interest rate on existing bank loans when your salary rises or credit score improves.", "vi": "Thực hiện quyền pháp lý yêu cầu ngân hàng giảm lãi suất khoản vay hiện có khi bạn được tăng lương, thăng chức hoặc điểm tín dụng tăng.", "zh-Hans": "当升职加薪或个人信用评分提升时，依法向主办银行行使权利要求调低现有贷款利息。"},
    principle: {"en": "Under financial consumer protection laws, borrowers can legally demand a rate cut if their credit profile improves significantly (promotions, income hikes, debt repayment).", "vi": "Theo luật bảo vệ người tiêu dùng tài chính, người vay có quyền yêu cầu giảm lãi suất nếu tình trạng tài chính được cải thiện rõ rệt.", "zh-Hans": "根据金融消费者保护法规，借款人在收入提升、职位晋升或信用评分显著上涨时，有权要求金融机构下调贷款利息。"},
    example: {"en": "A 0.5% rate cut on a 100 million KRW mortgage reduces annual interest burden by 500,000 KRW instantly.", "vi": "Giảm 0,5% lãi suất trên khoản vay 100 triệu won sẽ giúp tiết kiệm 500.000 won tiền lãi mỗi năm ngay lập tức.", "zh-Hans": "在1亿韩元房贷上争取到0.5%的利率下调，每年可直接减少50万韩元的利息支出。"},
    actionItem: {"en": "Open your mobile banking app, navigate to your active loan menu, and submit a 1-minute digital interest reduction request.", "vi": "Vào ứng dụng ngân hàng, chọn khoản vay đang có và nhấn gửi yêu cầu giảm lãi suất trực tuyến chỉ trong 1 phút.", "zh-Hans": "打开手机银行App，进入当前贷款详情页面，提交'利率下调要求申请'（通常1分钟即可完成系统审核）。"},
  },
  "자동차보험 마일리지 특약과 티맵 안전운전 할인": {
    title: {"en": "자동차보험 마일리지 특약과 티맵 안전운전 할인 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 자동차보험 마일리지 특약과 티맵 안전운전 할인 to optimize everyday decisions and reduce costs."},
    principle: {"en": "주행거리 연 1.5만km 이하 시 최대 35% 환급 + 티맵 안전점수 10% 추가 할인"},
    example: {"en": "계약 만기 시 주행거리 계기판 사진 등록으로 보험료 사후 환급"},
    actionItem: {"en": "자동차보험 갱신 시 주행거리 특약과 안전운전 특약을 모두 챙기세요."},
  },
  "이직 시 연봉 협상에서 원천징수영수증 제출법": {
    title: {"en": "이직 시 연봉 협상에서 원천징수영수증 제출법 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 이직 시 연봉 협상에서 원천징수영수증 제출법 to optimize everyday decisions and reduce costs."},
    principle: {"en": "전 직장 근로소득원천징수영수증 상의 '총급여'를 기준으로 협상 시작"},
    example: {"en": "기본급 외 상여금, 성과급, 복지포인트를 모두 합산한 총보상(Total Comp) 제시"},
    actionItem: {"en": "홈택스에서 전년도 근로소득원천징수영수증을 미리 발급받아 두세요."},
  },
  "목 디스크 예방 모니터 높이와 시선 각도": {
    title: {"en": "목 디스크 예방 모니터 높이와 시선 각도 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 목 디스크 예방 모니터 높이와 시선 각도 to optimize everyday decisions and reduce costs."},
    principle: {"en": "모니터 상단 1/3 지점이 눈높이와 수평을 이루도록 높이 조절"},
    example: {"en": "거북목 자세는 목 경추에 최대 27kg의 하중을 부과"},
    actionItem: {"en": "모니터 받침대나 책을 받쳐 모니터 높이를 눈높이로 올리세요."},
  },
  "해외 여행자보험 휴대품 손해 보상 청구 요령": {
    title: {"en": "해외 여행자보험 휴대품 손해 보상 청구 요령 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 해외 여행자보험 휴대품 손해 보상 청구 요령 to optimize everyday decisions and reduce costs."},
    principle: {"en": "휴대폰 파손/도난 시 경찰서 폴리스 리포트(도난) 또는 수리견적서(파손) 구비"},
    example: {"en": "자기부담금 1~2만 원 제외하고 수리비 전액 보험금 수령 가능"},
    actionItem: {"en": "해외 출발 전 휴대품 손해 보장 한도가 100만 원 이상인지 확인하세요."},
  },
  "전기요금 누진제 구간 관리와 스마트한전 앱": {
    title: {"en": "전기요금 누진제 구간 관리와 스마트한전 앱 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 전기요금 누진제 구간 관리와 스마트한전 앱 to optimize everyday decisions and reduce costs."},
    principle: {"en": "하계 300kWh 초과, 기타 계절 200kWh 초과 시 누진 요율 급증"},
    example: {"en": "스마트한전 앱에서 실시간 전력 사용량과 예상 요금 실시간 조회"},
    actionItem: {"en": "스마트한전 앱을 설치하고 계량기 고객번호를 연동하세요."},
  },
  "파킹통장(CMA) 매일 복리 이자 챙기기": {
    title: {"en": "CMA & Parking Accounts: Earn Daily Compounding Interest on Idle Cash", "vi": "Tài khoản Parking (CMA): Nhận lãi kép hàng ngày trên dòng tiền nhàn rỗi", "zh-Hans": "活期理财账户(CMA/Parking)：闲置资金享每日复利计息"},
    summary: {"en": "Never leave emergency cash or living expenses idle—maximize daily compound returns with high-yield parking accounts.", "vi": "Đừng để tiền sinh hoạt hay quỹ khẩn cấp nằm yên ở tài khoản thanh toán—hãy tối ưu lãi suất kép hàng ngày qua tài khoản Parking có lãi suất cao.", "zh-Hans": "勿让应急备用金与月度生活费闲置在0.1%普通活期账户中，利用高息活期理财账户实现按日计息与复利增值。"},
    principle: {"en": "Unlike standard checking accounts earning 0.1%, parking/CMA accounts calculate and pay 3.0–3.5% annualized interest daily with instant withdrawals.", "vi": "Khác với tài khoản thanh toán thông thường chỉ có lãi 0,1%, tài khoản Parking/CMA tính và trả lãi 3,0-3,5%/năm hàng ngày mà vẫn rút tiền tự do 24/7.", "zh-Hans": "不同于普通活期0.1%年利率，高息Parking/CMA账户提供年化3.0%~3.5%利息，每日结算且支持随时无手续费支取。"},
    example: {"en": "Parking 10 million KRW of emergency funds earns approx. 25,000 KRW in monthly interest without locking up liquidity.", "vi": "Để 10 triệu won tiền dự phòng trong tài khoản Parking sẽ sinh lời khoảng 25.000 won mỗi tháng mà không hề bị giữ vốn.", "zh-Hans": "存入1000万韩元应急备用金，每月无需锁定本金即可额外获得约2.5万韩元纯利息收入。"},
    actionItem: {"en": "Open a non-face-to-face parking account with a top-tier digital bank or securities brokerage and link it to your salary debit card.", "vi": "Mở tài khoản Parking trực tuyến tại các ngân hàng số lớn hoặc công ty chứng khoán để liên kết dòng tiền sinh hoạt.", "zh-Hans": "在大型互联网银行或证券公司App中在线开设高息Parking账户，将备用金与工资卡自动关联。"},
  },
  "온누리상품권 디지털 앱 10% 상시 할인": {
    title: {"en": "온누리상품권 디지털 앱 10% 상시 할인 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 온누리상품권 디지털 앱 10% 상시 할인 to optimize everyday decisions and reduce costs."},
    principle: {"en": "충전식 카드형 온누리상품권 앱에서 매월 최대 200만 원까지 10% 할인 구매"},
    example: {"en": "전통시장 및 주변 골목상점가 식당, 병원, 학원에서도 결제 가능"},
    actionItem: {"en": "디지털 온누리상품권 앱을 설치하고 평소 쓰는 체크카드를 등록하세요."},
  },
  "퇴직연금 IRP 계좌 이전 시 절세 혜택": {
    title: {"en": "퇴직연금 IRP 계좌 이전 시 절세 혜택 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 퇴직연금 IRP 계좌 이전 시 절세 혜택 to optimize everyday decisions and reduce costs."},
    principle: {"en": "퇴직금을 일반 통장 대신 IRP로 받으면 퇴직소득세 30~40% 감면"},
    example: {"en": "만 55세 이후 연금 수령 시 세금 부담을 최소화하며 자산 운용 가능"},
    actionItem: {"en": "퇴사 전 퇴직금 수령 전용 IRP 계좌를 주거래 증권사에서 개설하세요."},
  },
  "장 건강을 위한 프리바이오틱스 식단 구성": {
    title: {"en": "장 건강을 위한 프리바이오틱스 식단 구성 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 장 건강을 위한 프리바이오틱스 식단 구성 to optimize everyday decisions and reduce costs."},
    principle: {"en": "유익균의 먹이가 되는 수용성 식이섬유(귀리, 사과, 바나나, 양파)"},
    example: {"en": "장내 마이크로바이옴 건강이 면역력의 70%를 결정"},
    actionItem: {"en": "오늘 식단에 수용성 식이섬유가 풍부한 채소나 과일을 1가지 추가하세요."},
  },
  "여권 만료일 6개월 규정과 긴급여권 발급": {
    title: {"en": "여권 만료일 6개월 규정과 긴급여권 발급 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 여권 만료일 6개월 규정과 긴급여권 발급 to optimize everyday decisions and reduce costs."},
    principle: {"en": "대다수 국가에서 입국 시 여권 잔여 유효기간 6개월 이상 요구"},
    example: {"en": "공항 여권민원센터에서 당일 1시간 만에 긴급 단수여권 발급 가능"},
    actionItem: {"en": "내 여권 만료일을 확인하고 6개월 미만이라면 갱신 신청하세요."},
  },
  "층간소음 이웃사이서비스 현장 진단 신청": {
    title: {"en": "층간소음 이웃사이서비스 현장 진단 신청 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 층간소음 이웃사이서비스 현장 진단 신청 to optimize everyday decisions and reduce costs."},
    principle: {"en": "환경부 산하 전문 기관이 방문하여 소음 측정 및 갈등 중재 지원"},
    example: {"en": "갈등이 심할 때 국가 공인 무료 중재 서비스 활용"},
    actionItem: {"en": "국가소음정보시스템(floor.noiseinfo.or.kr)에서 상담을 신청하세요."},
  },
  "비과세 종합저축 가입 대상 확인": {
    title: {"en": "비과세 종합저축 가입 대상 확인 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 비과세 종합저축 가입 대상 확인 to optimize everyday decisions and reduce costs."},
    principle: {"en": "만 65세 이상, 장애인, 국가유공자 대상 1인당 5,000만 원까지 이자소득세(15.4%) 전액 면제"},
    example: {"en": "시중은행 정기예금 가입 시 비과세 종합저축으로 지정 신청"},
    actionItem: {"en": "부모님의 비과세 종합저축 한도(5,000만 원) 활용 여부를 점검하세요."},
  },
  "정부 보조금24로 놓친 정부 지원금 원클릭 조회": {
    title: {"en": "정부 보조금24로 놓친 정부 지원금 원클릭 조회 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 정부 보조금24로 놓친 정부 지원금 원클릭 조회 to optimize everyday decisions and reduce costs."},
    principle: {"en": "중앙부처, 지자체, 공공기관이 제공하는 1만여 개 혜택을 맞춤형 안내"},
    example: {"en": "정부24 앱 로그인 후 '보조금24' 탭에서 나에게 맞는 지원금 확인"},
    actionItem: {"en": "정부24 앱에서 '보조금24 맞춤 안내'를 조회해 보세요."},
  },
  "고용보험 실업급여(구직급여) 1일 상한액 확인": {
    title: {"en": "고용보험 실업급여(구직급여) 1일 상한액 확인 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 고용보험 실업급여(구직급여) 1일 상한액 확인 to optimize everyday decisions and reduce costs."},
    principle: {"en": "이직 전 평균임금의 60% 지급 (2026년 1일 상한액 66,000원)"},
    example: {"en": "소정급여일수 120~270일간 안정적인 구직 활동 생계비 보장"},
    actionItem: {"en": "고용보험 사이트에서 나의 예상 실업급여 일수와 수급액을 모의계산하세요."},
  },
  "허리 통증 완화 맥켄지 신전 운동": {
    title: {"en": "허리 통증 완화 맥켄지 신전 운동 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 허리 통증 완화 맥켄지 신전 운동 to optimize everyday decisions and reduce costs."},
    principle: {"en": "요추 전만을 회복시켜 디스크 내부 압력을 줄여주는 등 젖히기 운동"},
    example: {"en": "엎드린 자세에서 팔꿈치로 상체를 천천히 들어 올려 15초간 유지"},
    actionItem: {"en": "의자에 앉아 일하는 중간중간 허리를 뒤로 젖혀 스트레칭하세요."},
  },
  "공항 라운지 무료 이용 PP카드/더라운지 혜택": {
    title: {"en": "Free Airport Lounge Access: Priority Pass & The Lounge Perks", "vi": "Ưu đãi phòng chờ sân bay miễn phí qua thẻ Priority Pass / The Lounge", "zh-Hans": "机场贵宾厅免费使用：PP卡与The Lounge专属权益"},
    summary: {"en": "Maximize partnered credit card benefits before departure to access premium airport lounges for free and recharge while traveling.", "vi": "Tận dụng đặc quyền thẻ tín dụng/ghi nợ liên kết trước khi xuất cảnh để sử dụng phòng chờ sân bay miễn phí, giảm mệt mỏi trong chuyến bay.", "zh-Hans": "出境前利用合作银行卡权益免费享用机场贵宾厅，消除长途旅途劳顿并节省餐饮开支。"},
    principle: {"en": "Meet the previous month's minimum spending on eligible cards to receive complimentary lounge passes (2–6 times per year).", "vi": "Đạt chi tiêu tối thiểu tháng trước trên thẻ liên kết để nhận lượt vào phòng chờ miễn phí (2-6 lần/năm).", "zh-Hans": "满足合作信用卡/借记卡上月指定消费业绩，即可每年享受2至6次免费机场贵宾厅服务。"},
    example: {"en": "Spending 300,000 KRW last month grants 2 free entries per year to Matina/Sky Hub Lounges at Incheon Airport (approx. 55,000 KRW value each).", "vi": "Chi tiêu từ 300.000 won tháng trước được miễn phí vào phòng chờ Matina/Sky Hub tại sân bay Incheon (giá gốc ~55.000 won/lần) 2 lần/năm.", "zh-Hans": "上月消费满30万韩元时，可免费使用仁川机场Matina或Sky Hub贵宾厅（单次原价约5.5万韩元）每年2次。"},
    actionItem: {"en": "Check your card issuer app before departing to confirm your available digital lounge voucher or Priority Pass barcode.", "vi": "Kiểm tra ứng dụng ngân hàng/thẻ trước khi đến sân bay để lấy mã voucher The Lounge hoặc thẻ Priority Pass kỹ thuật số.", "zh-Hans": "前往机场前，先在银行卡App中查询是否已满足条件并生成电子贵宾厅凭证或二维码。"},
  },
  "스팸 전화 차단 두낫콜(Do Not Call) 등록": {
    title: {"en": "Block Telemarketing Spam: Register with Korea's Official Do-Not-Call Registry", "vi": "Chặn cuộc gọi rác và quảng cáo: Đăng ký dịch vụ Do-Not-Call quốc gia Hàn Quốc", "zh-Hans": "一键屏蔽骚扰推销电话：登记韩国官方Do-Not-Call系统"},
    summary: {"en": "Block unsolicited marketing calls and financial solicitation at once with the government-backed Do-Not-Call service.", "vi": "Chặn dứt điểm các cuộc gọi tiếp thị, chào mời tài chính và vay vốn không mong muốn thông qua hệ thống bảo vệ người tiêu dùng quốc gia.", "zh-Hans": "通过韩国政府主管的Do-Not-Call防推销骚扰登记系统，一次性拦截所有金融贷款推销及商业营销电话。"},
    principle: {"en": "Registering on the official Fair Trade Commission and Financial Services Commission Do-Not-Call portals legally restricts commercial spam calls.", "vi": "Đăng ký trên cổng Do-Not-Call của Ủy ban Thương mại Công bằng và Ủy ban Dịch vụ Tài chính sẽ cấm các doanh nghiệp gọi tiếp thị theo luật.", "zh-Hans": "在公平交易委员会与金融监督院官方Do-Not-Call平台登记后，金融机构依法不得擅自向登记号码拨打商业推销电话。"},
    example: {"en": "A single online registration blocks marketing calls from over 3,000 licensed financial institutions and telemarketers.", "vi": "Chỉ một lần đăng ký online sẽ chặn cuộc gọi chào mời từ hơn 3.000 tổ chức tài chính và đơn vị bán hàng qua điện thoại.", "zh-Hans": "完成一次短信实名验证，即可全面屏蔽来自3000多家正规金融机构及电销企业的商业营销来电。"},
    actionItem: {"en": "Visit donotcall.go.kr and donotcall.or.kr from your mobile browser and authenticate via SMS to block all marketing spam.", "vi": "Truy cập donotcall.go.kr và donotcall.or.kr trên điện thoại, xác thực số điện thoại qua tin nhắn SMS để kích hoạt chặn quảng cáo.", "zh-Hans": "用手机浏览器访问 donotcall.go.kr 和 donotcall.or.kr，通过手机短信验证完成一键拦截登记。"},
  },
  "신용점수 올리는 KCB/NICE 비금융 정보 제출": {
    title: {"en": "Boost Credit Score: Submit Non-Financial Records to KCB & NICE", "vi": "Tăng điểm tín dụng cá nhân: Nộp hồ sơ phi tài chính cho KCB và NICE", "zh-Hans": "快速提升信用积分：向KCB与NICE提交非金融缴费凭证"},
    summary: {"en": "Instantly improve your credit score by submitting proof of on-time utility bills, national health insurance, and telecom payments.", "vi": "Tăng ngay điểm tín dụng cá nhân bằng cách gửi xác nhận đóng tiền bảo hiểm y tế quốc gia, tiền điện nước và cước viễn thông đúng hạn.", "zh-Hans": "通过提交国民健康保险、通信费及公共事业费用的正常缴费记录，在几分钟内即时提高个人信用评分。"},
    principle: {"en": "Credit rating agencies (NICE/KCB) grant instant bonus points when borrowers submit 6+ months of verified on-time non-financial payments.", "vi": "Các cơ quan xếp hạng tín dụng (NICE/KCB) cộng điểm thưởng ngay lập tức khi người dân nộp bằng chứng đóng tiền công cộng trên 6 tháng không chậm trễ.", "zh-Hans": "韩国两大信用评估机构(KCB/NICE)针对提交6个月以上正常缴费凭证的居民，给予即时加分政策。"},
    example: {"en": "Submitting telecommunications and health insurance payment records can raise credit scores by 10 to 30 points in minutes.", "vi": "Nộp chứng từ nộp tiền bảo hiểm y tế và cước điện thoại giúp tăng 10 đến 30 điểm tín dụng chỉ sau 5 phút.", "zh-Hans": "在线提交健康保险和手机费缴费凭证后，个人信用积分通常可即时上涨10至30分。"},
    actionItem: {"en": "Open your Toss or Kakao Pay app, navigate to Credit Management, and click 'Submit Non-Financial Info' via government certificate.", "vi": "Mở ứng dụng Toss hoặc Kakao Pay, vào mục Quản lý tín dụng và bấm 'Nộp thông tin phi tài chính' qua chứng thực điện tử.", "zh-Hans": "打开Toss或Kakao Pay的'信用管理'菜单，点击'提交加分资料'，通过简易认证一键同步公团缴费记录。"},
  },
  "신용카드 포인트 현금 일괄 계좌 입금": {
    title: {"en": "신용카드 포인트 현금 일괄 계좌 입금 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 신용카드 포인트 현금 일괄 계좌 입금 to optimize everyday decisions and reduce costs."},
    principle: {"en": "여신금융협회 '카드포인트 통합조회' 사이트에서 전 카드사 포인트 원클릭 현금화"},
    example: {"en": "소멸 예정 포인트까지 1원 단위로 내 주거래 은행 계좌로 즉시 입금"},
    actionItem: {"en": "카드포인트 통합조회(cardpoint.or.kr)에서 잔여 포인트를 현금 입금하세요."},
  },
  "직무 인터뷰 포트폴리오 STAR 기법 구성": {
    title: {"en": "직무 인터뷰 포트폴리오 STAR 기법 구성 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 직무 인터뷰 포트폴리오 STAR 기법 구성 to optimize everyday decisions and reduce costs."},
    principle: {"en": "Situation(상황) → Task(과제) → Action(행동) → Result(성과)"},
    example: {"en": "추상적 서술을 배제하고 구체적 지표와 수치로 문제 해결 역량 입증"},
    actionItem: {"en": "나의 대표 프로젝트 1개를 STAR 구조 4줄로 요약해 정리하세요."},
  },
  "환절기 비염 식염수 코 세척 요령": {
    title: {"en": "환절기 비염 식염수 코 세척 요령 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 환절기 비염 식염수 코 세척 요령 to optimize everyday decisions and reduce costs."},
    principle: {"en": "체온과 비슷한 미온수의 0.9% 멸균 생리식염수로 비강 세척"},
    example: {"en": "알레르기 항원과 미세먼지를 물리적으로 배출하여 염증 완화"},
    actionItem: {"en": "외출 후 귀가 시 전용 세척기로 코 세척을 1회 진행해 보세요."},
  },
  "해외 ATM 현지 통화 인출 수수료 절약 카드": {
    title: {"en": "해외 ATM 현지 통화 인출 수수료 절약 카드 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 해외 ATM 현지 통화 인출 수수료 절약 카드 to optimize everyday decisions and reduce costs."},
    principle: {"en": "트래블로그, 트래블월렛 카드로 해외 ATM 현지 통화 출금 시 수수료 0원"},
    example: {"en": "현지 사설 환전소 사기 위험 없이 은행 공식 ATM에서 안전하게 인출"},
    actionItem: {"en": "해외여행 전 외화 충전식 체크카드를 발급받아 두세요."},
  },
  "가정 내 화재 대비 소화기 점검과 투척용 소화기": {
    title: {"en": "가정 내 화재 대비 소화기 점검과 투척용 소화기 (Practical Life Guide)"},
    summary: {"en": "Practical guidance for 가정 내 화재 대비 소화기 점검과 투척용 소화기 to optimize everyday decisions and reduce costs."},
    principle: {"en": "분말소화기 지침이 녹색 범위(0.7~0.98 MPa)에 있는지 확인"},
    example: {"en": "노약자나 어린이를 위해 던지는 투척용 소화기를 주방에 구비"},
    actionItem: {"en": "현관이나 주방의 소화기 압력 게이지 바늘이 정상인지 확인하세요."},
  },
};

/**
 * Resolves localized text for any of the 36 life topics across all 88 languages.
 */
export function resolveLifeTopicI18n(
  rawTitle: string,
  locale?: string
): { title?: string; summary?: string; principle?: string; example?: string; actionItem?: string } | null {
  if (!locale || locale === "ko") return null;
  const clean = rawTitle.replace(/\s*\(시즌\s*\d+\s*심화\s*가이드\)/, "").trim();
  const entry = (LIFE_DATA_89 && LIFE_DATA_89[clean]) || LIFE_TOPICS_I18N[clean];
  if (!entry) return null;

  const isHant = locale === "zh-Hant" || locale === "zt";
  const normLocale = locale === "zs" ? "zh-Hans" : (locale === "zt" ? "zh-Hant" : locale);

  let title = entry.title?.[normLocale] || (isHant ? entry.title?.["zh-Hans"] : undefined) || entry.title?.en;
  let summary = entry.summary?.[normLocale] || (isHant ? entry.summary?.["zh-Hans"] : undefined) || entry.summary?.en;
  let principle = entry.principle?.[normLocale] || (isHant ? entry.principle?.["zh-Hans"] : undefined) || entry.principle?.en;
  let example = entry.example?.[normLocale] || (isHant ? entry.example?.["zh-Hans"] : undefined) || entry.example?.en;
  let actionItem = entry.actionItem?.[normLocale] || (isHant ? entry.actionItem?.["zh-Hans"] : undefined) || entry.actionItem?.en;

  if (isHant) {
    try {
      const OpenCC = require("opencc-js");
      const converter = OpenCC.Converter({ from: "cn", to: "tw" });
      if (title) title = converter(title);
      if (summary) summary = converter(summary);
      if (principle) principle = converter(principle);
      if (example) example = converter(example);
      if (actionItem) actionItem = converter(actionItem);
    } catch {
      // fallback to simplified if opencc not loaded
    }
  }

  return { title, summary, principle, example, actionItem };
}
