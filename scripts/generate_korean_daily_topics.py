import json
import os

KOREAN_TOPICS = [
    {
        "id": "k-001",
        "baseTitleKo": "전·월세 계약 시 보증금 보호 필수 특약",
        "category": "wealth",
        "en": {
            "title": "Essential Lease Clauses to Protect Rental Deposit (Jeonse/Wolse)",
            "summary": "Protect your rental deposit in South Korea against landlord debt with standard defense clauses.",
            "principle": "Standard defense clause protecting against the legal gap before opposing power takes effect (midnight next day).",
            "example": "\"The landlord shall not establish any rights or mortgages on this property until the day after the balance is paid. Any violation will immediately void the contract and refund the full deposit.\"",
            "actionItem": "Always demand the clause prohibiting mortgage registration before your opposing power takes effect."
        },
        "vi": {
            "title": "Điều khoản bắt buộc để bảo vệ tiền cọc khi thuê nhà (Jeonse/Wolse)",
            "summary": "Bảo vệ trọn vẹn tiền cọc thuê nhà tại Hàn Quốc trước các khoản nợ của chủ nhà bằng điều khoản đặc biệt.",
            "principle": "Điều khoản tiêu chuẩn giúp phòng ngừa rủi ro trong khoảng trống hiệu lực pháp lý (0h ngày hôm sau).",
            "example": "\"Bên cho thuê cam kết không thế chấp hay phát sinh quyền lợi nào trên bất động sản đến hết ngày hôm sau khi nhận đủ tiền. Nếu vi phạm, hợp đồng lập tức bị hủy và hoàn trả 100% tiền cọc.\"",
            "actionItem": "Bắt buộc yêu cầu ghi rõ điều khoản cấm thế chấp vào mục thỏa thuận đặc biệt trong hợp đồng."
        },
        "zh-Hans": {
            "title": "全租·月租签约时保护租房押金的必备特约条款",
            "summary": "通过标准防范特约条款，避免房东在搬入当天抵押房产，切实守护在韩租房押金安全。",
            "principle": "防范对抗力生效时间差（次日凌晨0点）法律盲区的标准特约条款。",
            "example": "\"房东直至支付尾款次日不得在该房产设定抵押权等任何权利，如有违反立即解除合同并全额退还押金。\"",
            "actionItem": "签约时务必在特约事项栏明确注明禁止设定抵押权条款。"
        },
        "ja": {
            "title": "チョンセ・ウォルセ契約時に保証金を守る必須特約",
            "summary": "引越し当日の対抗力発生タイムラグを突いた家主の抵当権設定を防ぎ、大切な保証金を保護します。",
            "principle": "対抗力発生の時間差（翌日午前0時）の盲点を防御する標準特約条項。",
            "example": "「賃貸人は残金支払日の翌日まで本物件に根抵当権等の権利を設定せず、違反時は即座に契約解除および保証金全額を返還する。」",
            "actionItem": "契約書の特約欄に根抵当権設定禁止の文言を必ず明記してください。"
        }
    },
    {
        "id": "k-002",
        "baseTitleKo": "동주민센터·정부24 민원 서류 무료 발급",
        "category": "saving",
        "en": {
            "title": "Free Public Certificate Issuance: Community Centers & Government24",
            "summary": "Save time and administrative fees by issuing official residence and tax documents online or via kiosks.",
            "principle": "In-person window issuance (400–1,000 KRW) vs Government24 app and unmanned kiosks (100% Free).",
            "example": "Fees are completely waived when using the Government24 mobile app or unmanned certificate kiosks in metro stations.",
            "actionItem": "Skip the counter queue and use automated kiosks or Government24 online."
        },
        "vi": {
            "title": "Cấp giấy tờ hành chính công miễn phí tại Trung tâm dân cư và Government24",
            "summary": "Tiết kiệm lệ phí hành chính và thời gian khi xin cấp giấy tờ cư trú, chứng nhận thuế tại Hàn Quốc.",
            "principle": "Cấp trực tiếp tại quầy tốn 400~1.000 won vs Cấp qua ứng dụng Government24 hoặc máy tự động (Miễn phí).",
            "example": "Miễn phí hoàn toàn khi dùng ứng dụng Government24 hoặc máy cấp chứng nhận tự động tại ga tàu điện ngầm.",
            "actionItem": "Thay vì xếp hàng tại quầy trung tâm dân cư, hãy dùng máy cấp tự động hoặc ứng dụng Government24."
        },
        "zh-Hans": {
            "title": "居民中心·政府24(Government24)免费打印民政证明文件",
            "summary": "避开人工窗口手续费，在线上或地铁站无人自助机免费开具居民登记与税务证明。",
            "principle": "人工窗口开具（400~1,000韩元）vs 政府24App及无人机打印（完全免费）。",
            "example": "使用政府24App或地铁站内的无人便民打印机时，免除全部手续费。",
            "actionItem": "无需在居民中心窗口排队，推荐直接使用无人打印机或政府24开具证明。"
        },
        "ja": {
            "title": "住民センター・政府24での民願書類の無料発行",
            "summary": "住民登録謄本や納税証明を窓口手数料なしで手軽にオンラインや無人機で発行できます。",
            "principle": "窓口発行（400〜1,000ウォン）vs 政府24アプリおよび無人発給機（完全無料）。",
            "example": "政府24アプリや地下鉄駅にある無人民願発給機を利用すれば手数料が免除されます。",
            "actionItem": "窓口で並ぶ代わりに無人発給機や政府24アプリを活用しましょう。"
        }
    },
    {
        "id": "k-003",
        "baseTitleKo": "신뢰감을 주는 한국 기업 면접 말끝 처리",
        "category": "career",
        "en": {
            "title": "Confident Sentence Endings for Korean Job Interviews",
            "summary": "Deliver professionalism, clarity, and decisive competence by using clear formal ending forms (-ㅂ니다/습니다).",
            "principle": "Replace tentative speech with assertive formal endings to demonstrate executive presence and accountability.",
            "example": "Instead of \"It seems like... (~인 것 같아요)\", say \"I analyzed the data and successfully executed the project (~완수했습니다)\".",
            "actionItem": "Practice concluding interview answers with firm, resonant formal speech."
        },
        "vi": {
            "title": "Cách ngắt câu tạo sự tin cậy trong phỏng vấn tuyển dụng tại Hàn Quốc",
            "summary": "Thể hiện sự chuyên nghiệp, quyết đoán và năng lực làm việc bằng đuôi câu trang trọng chuẩn mực.",
            "principle": "Tránh đuôi câu do dự, sử dụng đuôi câu kính ngữ trang trọng (-ㅂ니다/습니다) để thể hiện sự tự tin.",
            "example": "Thay vì nói mơ hồ \"Hình như là... (~인 것 같아요)\", hãy nói \"Tôi đã phân tích và hoàn thành xuất sắc (~완수했습니다)\".",
            "actionItem": "Luyện tập dứt khoát kết thúc câu trả lời với giọng điệu quả quyết, tự tin."
        },
        "zh-Hans": {
            "title": "韩国企业求职面试展现信赖感的干练句尾技巧",
            "summary": "在韩国求职面试中避免模糊不定的语气，用标准正式语尾展现高度专业性与决断力。",
            "principle": "不使用含糊拖沓的尾音，使用展现专业度与担当的“-ㅂ니다/습니다”正式格语尾。",
            "example": "避免使用“好像是... (~인 것 같아요)”，改用“我经过精准分析已圆满达成目标 (~완수했습니다)”。",
            "actionItem": "面试练习时训练用坚决干脆的语调结束每一句话。"
        },
        "ja": {
            "title": "韓国企業の面接で信頼感を与える語尾の結び方",
            "summary": "曖昧な表現を排し、格式ある体言止めやハムニダ体でプロフェッショナルな決断力を示します。",
            "principle": "語尾を濁さず専門性と主体性を明確に示す「-ㅂ니다/습니다」格式体。",
            "example": "「〜のようです（~인 것 같아요）」の代わりに「〜と分析し成功裏に完遂いたしました（~완수했습니다）」と答える。",
            "actionItem": "面接練習では文末をきっぱりと言い切る訓練を行いましょう。"
        }
    },
    {
        "id": "k-004",
        "baseTitleKo": "한국 병원·약국 통증 표현 의태어 모음",
        "category": "health",
        "en": {
            "title": "Korean Mimetic Words for Accurate Pain Descriptions at Clinics",
            "summary": "Clearly communicate subtle pain sensations to Korean doctors and pharmacists using natural descriptive expressions.",
            "principle": "Expressing sensory nuances helps medical providers diagnose accurately (throbbing, stinging, dull ache).",
            "example": "Throbbing headache = '지끈지끈', Stabbing sharp stomach ache = '콕콕 쑤셔요', Burning chest = '화끈화끈'.",
            "actionItem": "Bookmark key pain mimetic words on your phone before visiting a clinic in Korea."
        },
        "vi": {
            "title": "Từ tượng hình miêu tả cơn đau chính xác tại bệnh viện và hiệu thuốc Hàn Quốc",
            "summary": "Mô tả chính xác cảm giác đau cho bác sĩ và dược sĩ Hàn Quốc bằng các từ tượng hình tự nhiên.",
            "principle": "Sử dụng từ tượng thanh tượng hình giúp bác sĩ chẩn đoán chính xác nguyên nhân (đau nhói, đau buốt, âm ỉ).",
            "example": "Đau đầu giật giật = '지끈지끈', Đau bụng nhói từng cơn = '콕콕 쑤셔요', Nóng rát lồng ngực = '화끈화끈'.",
            "actionItem": "Lưu lại các từ miêu tả cơn đau vào điện thoại để dùng khi đi khám bệnh tại Hàn Quốc."
        },
        "zh-Hans": {
            "title": "在韩国医院与药房精准描述病痛的拟态词指南",
            "summary": "运用自然生动的拟态词向韩国医生与药剂师准确传达疼痛的具体感觉与部位。",
            "principle": "生动传达痛感有助于医生做出精准诊断（偏头痛抽痛、针扎刺痛、灼烧感）。",
            "example": "头痛欲裂胀痛 = '지끈지끈'，腹部针扎样刺痛 = '콕콕 쑤셔요'，胸口火辣灼热 = '화끈화끈'。",
            "actionItem": "去韩国医院前将核心疼痛表达保存在手机备忘录中。"
        },
        "ja": {
            "title": "韓国の病院・薬局で正確に痛みを伝えるオノマトペ集",
            "summary": "ズキズキ、チクチクなどの韓国語独特の擬態語で医師や薬剤師に痛みのニュアンスを的確に伝えます。",
            "principle": "感覚的な痛みのニュアンスを正確に伝えることで誤診を防ぎ迅速な治療を受けられます。",
            "example": "頭がズキズキする＝「지끈지끈」、お腹がチクチク刺すように痛い＝「콕콕 쑤셔요」、胸がヒリヒリ熱い＝「화끈화끈」。",
            "actionItem": "韓国で病院にかかる前に痛みのオノマトペをメモしておきましょう。"
        }
    },
    {
        "id": "k-005",
        "baseTitleKo": "한국 대중교통 하차 태그와 환승 할인 규칙",
        "category": "travel",
        "en": {
            "title": "Korean Public Transit: Tap-Off Rules & Transfer Discounts",
            "summary": "Maximize transit savings in South Korea by always tapping off to earn free or discounted bus/subway transfers.",
            "principle": "Transfers are discounted up to 4 times within 30 minutes (60 min from 9 PM to 7 AM) when tapping off upon exit.",
            "example": "Failing to tap off results in maximum distance penalty fare and eliminates your next transfer discount.",
            "actionItem": "Always tap your transit card when getting off buses and subways in Korea."
        },
        "vi": {
            "title": "Quy tắc quẹt thẻ khi xuống xe và giảm giá chuyển tuyến giao thông công cộng Hàn Quốc",
            "summary": "Tiết kiệm chi phí đi lại bằng cách luôn quẹt thẻ khi xuống xe buýt hoặc tàu điện ngầm để hưởng ưu đãi chuyển tuyến.",
            "principle": "Được giảm giá chuyển tuyến tối đa 4 lần trong vòng 30 phút (60 phút từ 21h đến 7h sáng) nếu quẹt thẻ lúc xuống.",
            "example": "Nếu quên quẹt thẻ khi xuống xe, bạn sẽ bị tính cước tối đa và mất quyền giảm giá chuyển tuyến ở chuyến tiếp theo.",
            "actionItem": "Luôn nhớ quẹt thẻ giao thông khi bước xuống xe buýt và tàu điện ngầm."
        },
        "zh-Hans": {
            "title": "韩国公共交通下车刷卡与换乘优惠核心规则",
            "summary": "下车务必刷交通卡，享受地铁与公交之间长达4次免费或高额折扣换乘优惠。",
            "principle": "下车刷卡后30分钟内（夜间21点至次日早7点放宽至60分钟）可享最多4次换乘优惠。",
            "example": "若下车未刷卡，将被扣除最长区间补交罚款，且下一次换乘无法享受减免优惠。",
            "actionItem": "在韩国乘坐公交车与地铁下车时一定要记得刷交通卡。"
        },
        "ja": {
            "title": "韓国の公共交通での下車時タッチと乗継割引ルール",
            "summary": "地下鉄とバスの下車時に必ず交通カードをタッチして、無料または割引の乗換特典を受けましょう。",
            "principle": "下車タッチ後30分以内（21時〜翌朝7時は60分以内）に最大4回まで乗換割引が適用されます。",
            "example": "下車時のタッチを忘れると最長距離のペナルティ料金が課され、次回の乗換割引も無効になります。",
            "actionItem": "韓国でバスや地下鉄を降りる際は必ず交通カードをリーダーにタッチしてください。"
        }
    },
    {
        "id": "k-006",
        "baseTitleKo": "층간소음 분쟁 완화 정중한 쿠션어 쪽지",
        "category": "problem",
        "en": {
            "title": "Polite Cushion-Word Notes to Resolve Apartment Noise Disputes",
            "summary": "Defuse apartment floor noise conflicts amicably in Korea using polite, empathetic cushion-language notes.",
            "principle": "Direct confrontation causes emotional friction; gentle polite notes with small gifts prevent escalation.",
            "example": "\"Hello, neighbor! We know it is unintended, but sounds travel easily at night. We would deeply appreciate your kind consideration.\"",
            "actionItem": "Leave a polite handwritten note with a small treat rather than pounding on ceilings or doors."
        },
        "vi": {
            "title": "Mẫu thư nhã nhặn dùng từ đệm giải quyết mâu thuẫn tiếng ồn chung cư",
            "summary": "Hóa giải êm thấm tranh chấp tiếng ồn giữa các tầng chung cư tại Hàn Quốc bằng lời nhắn lịch sự, tinh tế.",
            "principle": "Đối đầu trực tiếp dễ gây căng thẳng; một mảnh giấy viết tay kèm quà nhỏ giúp thấu hiểu lẫn nhau.",
            "example": "\"Chào anh/chị hàng xóm, tôi biết không phải cố ý nhưng đêm khuya âm thanh rất vang. Rất mong anh/chị lưu tâm giúp một chút ạ.\"",
            "actionItem": "Viết giấy nhắn nhẹ nhàng kèm bánh nhỏ treo ở cửa thay vì gõ trần hay cãi vã."
        },
        "zh-Hans": {
            "title": "化解公寓楼层噪音纠纷的礼貌委婉便利贴沟通法",
            "summary": "在韩国公寓生活遇到楼层噪音时，用委婉柔和的用语留言，避免邻里争执与摩擦。",
            "principle": "当面冲突易激化矛盾，贴附礼貌手写留言与小点心能更有效促成邻里理解。",
            "example": "“邻居您好，知道您并非有意，但深夜声音容易共振传导，如果能稍加留意我们将感激不尽。”",
            "actionItem": "不要冲动敲门敲天花板，用温和客气的手写便利贴表达诉求。"
        },
        "ja": {
            "title": "階間騒音トラブルを円満に緩和する丁寧なクッション言葉メモ",
            "summary": "韓国の集合住宅での騒音問題を、相手を思いやる丁寧な表現のメモで角を立てずに解決します。",
            "principle": "直接の怒鳴り込みは反発を招くため、小さなお菓子を添えた丁寧な手紙が最も効果的です。",
            "example": "「お隣様、わざとではないと存じますが、夜間は響きやすいため少しご配慮いただけますと幸いです。」",
            "actionItem": "感情的にドアを叩くのではなく、思いやりのある手書きメモをポストに入れましょう。"
        }
    },
    {
        "id": "k-007",
        "baseTitleKo": "등기부등본 갑구·을구 권리분석 핵심",
        "category": "wealth",
        "en": {
            "title": "Real Estate Registry (Deed) Analysis: Section A (Gap-gu) & Section B (Eul-gu)",
            "summary": "Verify true ownership and financial encumbrances on Korean property deeds before signing contracts.",
            "principle": "Section A records ownership, provisional seizure, and auctions; Section B records mortgages and senior loans.",
            "example": "Ensure total mortgage debt plus all tenant deposits does not exceed 70% of the property's market value.",
            "actionItem": "Inspect an up-to-date registry issued on the exact day you sign and pay the balance."
        },
        "vi": {
            "title": "Phân tích trích lục bất động sản Hàn Quốc: Mục A (Gap-gu) và Mục B (Eul-gu)",
            "summary": "Kiểm tra chủ sở hữu thực sự và các khoản thế chấp ngân hàng trên trích lục nhà đất trước khi ký hợp đồng.",
            "principle": "Mục A ghi nhận quyền sở hữu, phong tỏa và bán đấu giá; Mục B ghi nhận nợ thế chấp và cầm cố.",
            "example": "Đảm bảo tổng nợ thế chấp cộng với toàn bộ tiền cọc thuê nhà không vượt quá 70% giá trị thị trường của căn nhà.",
            "actionItem": "Luôn yêu cầu xem trích lục bất động sản được in ngay trong ngày ký hợp đồng và ngày trả tiền nốt."
        },
        "zh-Hans": {
            "title": "韩国不动产登记簿誊本甲区(Gap-gu)与乙区(Eul-gu)权利分析核心",
            "summary": "签约前透彻分析不动产登记簿，核实真正房东身份及房产是否存在抵押贷款风险。",
            "principle": "甲区记载所有权归属、假扣押及拍卖事项；乙区记载抵押权及各类担保借款。",
            "example": "确保房产总抵押贷款加上全部租客押金之和不超过房产实际市值的70%。",
            "actionItem": "签约当天与支付尾款当天必须分别打印最新的登记簿誊本进行核对。"
        },
        "ja": {
            "title": "不動産登記簿謄本の甲区・乙区の権利分析の要点",
            "summary": "韓国で住宅を契約する前に、真の所有者と抵当権設定状況を正確に読み解く方法を身につけます。",
            "principle": "甲区は所有権や仮差押え・競売を記載し、乙区は根抵当権や担保融資を記載します。",
            "example": "根抵当権設定額＋入居者の保証金総額が住宅相場の70%を超えていないか確認します。",
            "actionItem": "契約締結日と残金支払日当日にそれぞれ最新の登記簿謄本を発行して確認しましょう。"
        }
    },
    {
        "id": "k-008",
        "baseTitleKo": "알뜰교통카드/K-패스 대중교통비 환급 규칙",
        "category": "saving",
        "en": {
            "title": "K-Pass / Commuter Cards: Up to 53% Public Transit Cashback in Korea",
            "summary": "Receive monthly refunds on bus and subway fares across Korea with the nationwide K-Pass transit initiative.",
            "principle": "Taking public transit at least 15 times a month triggers a 20% (General), 30% (Youth 19-34), or 53% (Low Income) refund.",
            "example": "A youth spending 80,000 KRW monthly on commuting receives 24,000 KRW deposited directly back each month.",
            "actionItem": "Link your commercial credit/debit card to the official K-Pass app to activate auto-refunds."
        },
        "vi": {
            "title": "Quy tắc hoàn tiền chi phí giao thông K-Pass lên tới 53% tại Hàn Quốc",
            "summary": "Nhận tiền hoàn hàng tháng khi đi xe buýt và tàu điện ngầm khắp Hàn Quốc với chương trình K-Pass.",
            "principle": "Sử dụng giao thông công cộng từ 15 lần/tháng trở lên sẽ được hoàn 20% (Phổ thông), 30% (Thanh niên 19-34 tuổi), 53% (Thu nhập thấp).",
            "example": "Thanh niên chi 80.000 won tiền tàu xe mỗi tháng sẽ được nhận lại 24.000 won tiền mặt chuyển thẳng vào tài khoản.",
            "actionItem": "Đăng ký thẻ ngân hàng vào ứng dụng K-Pass để tự động nhận tiền hoàn mỗi tháng."
        },
        "zh-Hans": {
            "title": "韩国公共交通K-Pass卡高达53%返现退费规则",
            "summary": "使用全韩国通用的K-Pass交通卡，每月乘坐公交与地铁享受最高53%的现金返还。",
            "principle": "每月乘坐公共交通15次以上，可享受20%（普通）、30%（19~34岁青年）或53%（低收入层）退费返现。",
            "example": "青年群体每月交通费支出8万韩元，次月将直接到账返现2.4万韩元。",
            "actionItem": "申领商业银行交通卡后，务必下载官方K-Pass App完成卡号绑定。"
        },
        "ja": {
            "title": "K-パス／アルットゥル交通カードの最大53%交通費キャッシュバック規則",
            "summary": "韓国全域のバス・地下鉄利用時に、月間最大53%の現金融資キャッシュバックを受けられます。",
            "principle": "月15回以上公共交通を利用すると、一般20%、青年（19〜34歳）30%、低所得層53%が返還されます。",
            "example": "青年が月8万ウォン利用した場合、毎月2万4千ウォンが口座に自動キャッシュバックされます。",
            "actionItem": "提携カード発行後、K-Pass公式アプリにカード番号を登録して利用を開始しましょう。"
        }
    },
    {
        "id": "k-009",
        "baseTitleKo": "한국 직장 이메일 격식체 첫인사와 끝인사",
        "category": "career",
        "en": {
            "title": "Formal Etiquette for Business Emails in Korean Workplaces",
            "summary": "Master polite Korean business greetings and closing formulas to maintain impeccable professional decorum.",
            "principle": "Standard format: greeting with affiliation/title -> state purpose clearly -> closing wish -> formal sign-off.",
            "example": "\"안녕하십니까, [소속] [이름] [직급]입니다... 노고에 감사드리며, 환절기 건강 유의하시기 바랍니다. [이름] 드림.\"",
            "actionItem": "Save polite opening and closing snippets in your email client signature settings."
        },
        "vi": {
            "title": "Quy tắc chào hỏi mở đầu và kết thúc email công việc chuẩn mực tại Hàn Quốc",
            "summary": "Nắm vững văn phong trang trọng khi viết email công sở Hàn Quốc để tạo ấn tượng chuyên nghiệp tuyệt đối.",
            "principle": "Cấu trúc chuẩn: Chào hỏi nêu rõ chức vụ/đơn vị -> Nêu mục đích rõ ràng -> Lời chúc -> Ký tên trang trọng (드림/올림).",
            "example": "\"안녕하십니까, [Đơn vị] [Tên] [Chức vụ]입니다... Xin cảm ơn sự hỗ trợ của anh/chị, chúc anh/chị nhiều sức khỏe. [Tên] 드림.\"",
            "actionItem": "Lưu sẵn mẫu mở đầu và kết thúc lịch sự vào phần chữ ký tự động trong hòm thư điện tử."
        },
        "zh-Hans": {
            "title": "韩国职场商务电子邮件标准格式头尾礼仪指南",
            "summary": "熟练掌握韩国职场商务邮件的标准敬语套路，展现严谨可靠的专业职业素养。",
            "principle": "标准格式：标明所属及职务问候 -> 阐明邮件目的 -> 换季健康祝福 -> 正式落款敬语（드림/올림）。",
            "example": "“안녕하십니까, [所属] [姓名] [职务]입니다... 感谢协助，换季时节请多保重身体。[姓名] 드림。”",
            "actionItem": "在企业邮箱签名档中预设标准的商务问候与祝福模板。"
        },
        "ja": {
            "title": "韓国のビジネスメールにおける格式高い冒頭と結びの挨拶",
            "summary": "韓国企業での円滑な業務連絡のため、失礼のない洗練されたビジネスメールの挨拶文をマスターします。",
            "principle": "標準フォーマット：所属・役職を名乗る挨拶 → 用件の明示 → 季節の健康祈願 → 結びの敬語（드림/올림）。",
            "example": "「안녕하십니까, [所属]の[氏名] [役職]です… 平素のご協力に感謝申し上げます。[氏名] 드림.」",
            "actionItem": "メールソフトの署名テンプレートに丁寧な挨拶定型文を保存しておきましょう。"
        }
    },
    {
        "id": "k-010",
        "baseTitleKo": "실손의료보험 병원비 청구 3대 필수 서류",
        "category": "health",
        "en": {
            "title": "3 Essential Documents for Claiming Private Medical Reimbursement (Silbi)",
            "summary": "Ensure rapid, seamless insurance payouts for Korean clinic visits by collecting the three required documents.",
            "principle": "Insurance companies require standardized proof: itemized receipt, detailed billing breakdown, and diagnosis certificate.",
            "example": "Request '진료비 영수증', '진료비 세부내역서', and '처방전 (질병분류기호 포함)' at the payment counter.",
            "actionItem": "Ask the hospital counter for detailed breakdowns before leaving to avoid repeat visits."
        },
        "vi": {
            "title": "3 loại giấy tờ bắt buộc để thanh toán bảo hiểm y tế thực tế (Silbi) tại Hàn Quốc",
            "summary": "Được hoàn tiền viện phí nhanh chóng và đầy đủ bằng cách lấy đủ 3 loại giấy tờ khi khám bệnh.",
            "principle": "Công ty bảo hiểm yêu cầu: Hóa đơn viện phí, Bảng kê chi tiết điều trị và Đơn thuốc có mã bệnh.",
            "example": "Yêu cầu quầy thanh toán xuất: '진료비 영수증', '진료비 세부내역서' và '처방전 có kèm 질병분류기호'.",
            "actionItem": "Luôn xin bảng kê chi tiết viện phí ngay khi thanh toán tại bệnh viện để không phải quay lại."
        },
        "zh-Hans": {
            "title": "韩国实损医疗保险(Silbi)理赔报销必备的三大核心文件",
            "summary": "在韩国就医后迅速获得商业实损保险理赔金，结算时务必开具三项法定凭证。",
            "principle": "保险公司审核报销必备凭证：诊疗费收据、诊疗费明细单、含疾病代码的处方签或诊断书。",
            "example": "结账时要求前台打印：'진료비 영수증'、'진료비 세부내역서' 以及 '처방전(질병분류기호 포함)'。",
            "actionItem": "在医院柜台结账时一并开齐详细明细单，免去二次往返奔波。"
        },
        "ja": {
            "title": "実損医療保険（シルビ）の病院代請求に必要な3大必須書類",
            "summary": "韓国で受診した治療費のスムーズな保険給付を受けるため、窓口で受け取るべき3つの書類を把握します。",
            "principle": "保険金請求の必須3点：診療費領収書、診療費詳細内訳書、疾病コード付き処方箋（診断書）。",
            "example": "会計窓口で「진료비 영수증（領収書）」「진료비 세부내역서（詳細内訳書）」「질병분류기호付き처방전」を依頼します。",
            "actionItem": "病院を出る前に詳細内訳書の発行を窓口で必ず依頼しましょう。"
        }
    }
]

# Write out base topics
out_path = "life-help/lib/learn/dailyInsights/koreanTopics89.json"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"topics": KOREAN_TOPICS}, f, ensure_ascii=False, indent=2)

print(f"Generated {out_path} successfully!")
