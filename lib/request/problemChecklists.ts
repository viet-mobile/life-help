export interface ProblemOption {
  id: string;
  ko: string;
  en: string;
  vi: string;
  zh: string;
  [locale: string]: string | undefined;
}

export const SERVICE_PROBLEM_OPTIONS: Record<string, ProblemOption[]> = {
  // 1. 각종 막힘 (변기, 싱크대, 하수구)
  "clog-clearing": [
    {
      id: "clog-1",
      ko: "변기 물이 전혀 내려가지 않고 역류하여 차오름",
      en: "Toilet water is not draining at all and overflowing",
      vi: "Nước bồn cầu hoàn toàn không thoát được và bị trào ngược",
      zh: "马桶水完全排不下去且溢流回涌",
    },
    {
      id: "clog-2",
      ko: "변기에 물티슈, 칫솔, 뚜껑 등 이물질이 빠짐",
      en: "Foreign object (wet wipe, toothbrush, cap) fell into toilet",
      vi: "Vật thể lạ (khăn ướt, bàn chải, nắp lọ) rơi vào bồn cầu",
      zh: "马桶掉入湿巾、牙刷、盖子等异物",
    },
    {
      id: "clog-3",
      ko: "싱크대 배수구에서 썩은 냄새가 나고 물이 고임",
      en: "Kitchen sink has bad odor and water is pooling",
      vi: "Bồn rửa bát có mùi hôi thối và nước bị đọng ứ",
      zh: "水槽排水口有腐臭异味且积水",
    },
    {
      id: "clog-4",
      ko: "싱크대 하부 호스 또는 바닥 배관에서 물이 넘침",
      en: "Water is overflowing from under-sink pipe or floor drain",
      vi: "Nước tràn ra từ ống dưới bồn rửa hoặc đường ống sàn",
      zh: "水槽下方软管或地面管道溢水",
    },
    {
      id: "clog-5",
      ko: "욕실/화장실 바닥 하수구 머리카락 막힘 및 역류",
      en: "Bathroom floor drain clogged with hair and overflowing",
      vi: "Cống sàn nhà tắm bị tắc do tóc và trào ngược",
      zh: "浴室/卫生间地面排水口被头发堵塞并反水",
    },
    {
      id: "clog-6",
      ko: "세탁실 또는 베란다 배수관에서 거품과 물 역류",
      en: "Laundry room / balcony drain backing up foam and water",
      vi: "Đường thoát nước phòng giặt/ban công bị trào bọt và nước",
      zh: "洗衣房或阳台排水管泡沫和水倒灌",
    },
    {
      id: "clog-7",
      ko: "빌라/상가/건물 메인 오수관로 및 집수정 막힘",
      en: "Building/villa main sewage line or manhole clogged",
      vi: "Đường ống cống chính của tòa nhà/biệt thự bị tắc nghẽn",
      zh: "大楼/公寓总排污管或化粪池管道堵塞",
    },
    {
      id: "clog-8",
      ko: "배관 내시경 카메라 정밀 검사 희망",
      en: "Endoscopic pipe camera inspection requested",
      vi: "Yêu cầu kiểm tra chính xác bằng camera nội soi đường ống",
      zh: "需要管道内窥镜高清摄像头精细检测",
    },
    {
      id: "clog-9",
      ko: "고압 세척기를 이용한 배관 스케일링/통경 필요",
      en: "High-pressure water jetting pipe clearing needed",
      vi: "Cần thông tắc xục rửa đường ống bằng máy áp lực cao",
      zh: "需要高压水枪清洗管道油垢与疏通",
    },
    {
      id: "clog-10",
      ko: "정화조 연결 배관 문제 및 역류 현상",
      en: "Septic tank connection pipe issues and backup",
      vi: "Vấn đề đường ống nối bể phốt và hiện tượng trào ngược",
      zh: "化粪池连接管道故障及倒灌现象",
    },
    {
      id: "clog-11",
      ko: "음식물 분쇄기 연결 배관 내 기름때 응고 막힘",
      en: "Garbage disposal drain pipe grease blockage",
      vi: "Đường ống máy nghiền rác bị đông đặc mỡ và tắc nghẽn",
      zh: "垃圾处理器连接管油脂凝固堵塞",
    },
    {
      id: "clog-12",
      ko: "식당/상가 주방 그리스트랩 청소 및 배관 통경",
      en: "Restaurant grease trap cleaning and pipe clearing",
      vi: "Vệ sinh bể tách mỡ nhà hàng và thông tắc đường ống",
      zh: "餐厅/商业厨房隔油池清理及管道通畅",
    },
  ],

  // 2. 누수 및 수도 배관
  "leak-plumbing": [
    {
      id: "leak-1",
      ko: "아랫집 천장이나 벽체에서 물이 떨어지거나 젖음",
      en: "Water is dripping or dampening downstairs ceiling/wall",
      vi: "Nước nhỏ giọt hoặc ngấm ướt trần/tường nhà tầng dưới",
      zh: "楼下天花板或墙面漏水滴水渗水",
    },
    {
      id: "leak-2",
      ko: "물을 쓰지 않는데도 수도 계량기 별침이 돌아감",
      en: "Water meter spins even when no water is being used",
      vi: "Đồng hồ nước vẫn quay dù không hề sử dụng nước",
      zh: "不用水的情况下水表指针依然在转动",
    },
    {
      id: "leak-3",
      ko: "벽지, 마루바닥, 장판 밑이 축축하고 곰팡이가 생김",
      en: "Wallpaper, wooden floor, or mat is damp with mold",
      vi: "Giấy dán tường, sàn gỗ hoặc dưới chiếu bị ẩm mốc",
      zh: "壁纸、木地板或地板革下方潮湿发霉",
    },
    {
      id: "leak-4",
      ko: "수전/수도꼭지 연결 부위에서 물이 계속 뚝뚝 샘",
      en: "Faucet/tap joint is continuously leaking water",
      vi: "Khớp nối vòi nước liên tục rò rỉ nước",
      zh: "水龙头/角阀连接处不断滴水漏水",
    },
    {
      id: "leak-5",
      ko: "화장실 변기 바닥 틈새 또는 물탱크 부속 누수",
      en: "Toilet base seal or tank fittings are leaking water",
      vi: "Đáy bồn cầu hoặc phụ kiện két nước bị rò rỉ nước",
      zh: "马桶底座缝隙或水箱配件漏水",
    },
    {
      id: "leak-6",
      ko: "겨울철 한파로 수도 배관/계량기 동파 및 결빙",
      en: "Winter freeze broken water pipe or frozen meter",
      vi: "Ống nước/đồng hồ nước bị đóng băng hoặc vỡ do rét đậm",
      zh: "冬季寒潮导致水管/水表冻裂或结冰",
    },
    {
      id: "leak-7",
      ko: "수도꼭지에서 붉은 녹물 또는 흙/이물질이 나옴",
      en: "Rusty brown water or sediment coming from faucets",
      vi: "Nước có cặn bẩn hoặc nước gỉ sắt màu đỏ chảy ra từ vòi",
      zh: "水龙头流出铁锈红水或沉淀杂质",
    },
    {
      id: "leak-8",
      ko: "보일러 배관 또는 난방 분배기 밸브 누수",
      en: "Boiler pipes or heating manifold valve leaking",
      vi: "Đường ống nồi hơi hoặc van chia nhiệt sưởi bị rò rỉ",
      zh: "锅炉管道或地暖分水器阀门漏水",
    },
    {
      id: "leak-9",
      ko: "외벽 크랙 빗물 유입 및 창틀 실리콘 코킹 누수",
      en: "Rainwater leakage from exterior cracks or window seals",
      vi: "Nước mưa thấm qua vết nứt tường ngoài hoặc gioăng cửa sổ",
      zh: "外墙裂缝渗雨水或窗框硅胶老化漏水",
    },
    {
      id: "leak-10",
      ko: "첨단 청음식/가스식 탐지기를 통한 미세 누수 탐지",
      en: "Advanced acoustic/gas trace leak detection needed",
      vi: "Dò tìm rò rỉ vi mô bằng máy siêu âm / khí định vị",
      zh: "需要高端听音仪/气体示踪精准定位暗漏",
    },
    {
      id: "leak-11",
      ko: "수압이 너무 약하여 가압 펌프 설치 문의",
      en: "Water pressure is too low, booster pump installation needed",
      vi: "Áp lực nước quá yếu, muốn lắp đặt máy bơm tăng áp",
      zh: "水压过低想要安装增压泵",
    },
    {
      id: "leak-12",
      ko: "노후 수도관 전체 교체 및 욕실 바닥 방수 재시공",
      en: "Full replacement of old pipes & bathroom floor waterproofing",
      vi: "Thay mới toàn bộ đường ống cũ & chống thấm lại sàn nhà tắm",
      zh: "老旧管道全屋更换及卫生间地面重新防水",
    },
  ],

  // 3. 보일러 설치, 시공, 수리
  "boiler": [
    {
      id: "bl-1",
      ko: "보일러 전원은 켜지나 방이 전혀 따뜻해지지 않음",
      en: "Boiler power is on, but the room is not heating up",
      vi: "Nồi hơi có điện nhưng phòng không ấm lên chút nào",
      zh: "锅炉电源开启但房间完全不热",
    },
    {
      id: "bl-2",
      ko: "샤워할 때 온수가 안 나오고 차가운 물만 나옴",
      en: "No hot water during shower, only cold water comes out",
      vi: "Không có nước nóng khi tắm, chỉ chảy ra nước lạnh",
      zh: "洗澡时不出热水只出冷水",
    },
    {
      id: "bl-3",
      ko: "실내 온도조절기에 숫자 에러 코드가 깜빡거림",
      en: "Error code is flashing on the indoor room thermostat",
      vi: "Mã lỗi số nhấp nháy trên bảng điều khiển nhiệt độ trong nhà",
      zh: "室内温控器屏幕闪烁数字故障代码",
    },
    {
      id: "bl-4",
      ko: "보일러 본체 내부나 하부 배관에서 물이 뚝뚝 떨어짐",
      en: "Water is dripping from inside boiler or bottom pipes",
      vi: "Nước nhỏ giọt từ bên trong máy nồi hơi hoặc ống bên dưới",
      zh: "锅炉内部或底部管道滴水漏水",
    },
    {
      id: "bl-5",
      ko: "보일러 가동될 때 굉음이나 쾅쾅거리는 소음 발생",
      en: "Loud banging noise or rumbling when boiler starts",
      vi: "Tiếng nổ đùng đoàng hoặc tiếng ồn lớn khi nồi hơi hoạt động",
      zh: "锅炉启动运转时发出轰鸣或巨响异响",
    },
    {
      id: "bl-6",
      ko: "가스 냄새 또는 연통 매연 냄새가 실내로 유입됨",
      en: "Gas smell or exhaust fumes entering the room",
      vi: "Mùi khí gas hoặc mùi khói xả tràn vào trong phòng",
      zh: "房间内有煤气味或烟道废气异味",
    },
    {
      id: "bl-7",
      ko: "순환 펌프 고장으로 물 흐르는 소리만 나고 난방 불가",
      en: "Circulation pump failure; water sounds but no heating",
      vi: "Hỏng bơm tuần hoàn, chỉ nghe tiếng nước chảy nhưng không ấm",
      zh: "循环泵故障，只听到水流声但不供暖",
    },
    {
      id: "bl-8",
      ko: "친환경 1등급 콘덴싱 가스보일러 신규 교체 견적 희망",
      en: "Quote requested for new eco-friendly condensing gas boiler",
      vi: "Yêu cầu báo giá thay mới bình gas ngưng tụ tiết kiệm năng lượng",
      zh: "需要更换全新一级能效冷凝式燃气锅炉报价",
    },
    {
      id: "bl-9",
      ko: "각방 온도조절기 고장 또는 밸브 구동기 오작동",
      en: "Individual room thermostat broken or zone actuator failure",
      vi: "Bảng điều khiển nhiệt độ từng phòng hỏng hoặc van tự động lỗi",
      zh: "分室温控器失灵或电动执行器故障",
    },
    {
      id: "bl-10",
      ko: "난방 배관 내 녹물 청소 및 에어(공기) 빼기 필요",
      en: "Heating pipe flush (sludge removal) and bleeding air needed",
      vi: "Cần súc rửa xả khí (xả e) và cặn bẩn đường ống sưởi sàn",
      zh: "地暖管道清洗除垢及排气放气",
    },
    {
      id: "bl-11",
      ko: "기름 보일러 / 전기 보일러 / 연탄 보일러 점검 및 수리",
      en: "Oil / electric / pellet boiler inspection & repair",
      vi: "Kiểm tra và sửa chữa nồi hơi dầu / nồi hơi điện",
      zh: "燃油/电锅炉检修与故障排除",
    },
    {
      id: "bl-12",
      ko: "겨울철 보일러 배관 동파 해빙 및 보온재 재시공",
      en: "Thawing frozen boiler pipes & re-installing insulation",
      vi: "Làm tan băng ống nồi hơi bị đông tuyết & bọc lại bảo ôn",
      zh: "冬季锅炉管道冰冻解冻及保温棉重新包扎",
    },
  ],

  // 4. 전문 청소 (입주/특수/청결)
  "cleaning": [
    {
      id: "clean-1",
      ko: "원룸/투룸/오피스텔 입주 전 이사 청소 (전체 공간 살균 소독)",
      en: "Move-in/turnover cleaning for studio/officetel (Full disinfection)",
      vi: "Dọn dẹp chuyển vào nhà mới cho phòng one-room/officetel (Khử trùng toàn diện)",
      zh: "单间/两居室/公寓入住前深度保洁（全屋杀菌消毒）",
    },
    {
      id: "clean-2",
      ko: "주방 가스레인지/후드 찌든 기름때 및 싱크대 묵은 때 정밀 세척",
      en: "Deep degreasing of kitchen stove/range hood & sink",
      vi: "Tẩy sạch dầu mỡ bám cứng bếp gas/máy hút mùi & bồn rửa bát",
      zh: "厨房燃气灶/抽油烟机重油污及水槽深度清洗",
    },
    {
      id: "clean-3",
      ko: "화장실/욕실 타일 줄눈 곰팡이, 물때 및 거울/변기 스케일링",
      en: "Bathroom tile grout mold, limescale & toilet deep sanitizing",
      vi: "Tẩy mốc khe gạch, cặn canxi nhà tắm & khử trùng bồn cầu",
      zh: "卫生间瓷砖缝隙霉菌、水垢及马桶镜面精细除垢",
    },
    {
      id: "clean-4",
      ko: "창틀/방충망 먼지 제거 및 유리창 양면 청결 클리닝",
      en: "Window frames, screen mesh dust removal & glass cleaning",
      vi: "Vệ sinh khung cửa sổ, lưới chống muỗi & lau kính trong ngoài",
      zh: "窗框缝隙积尘、纱窗除尘及玻璃双面擦洗",
    },
    {
      id: "clean-5",
      ko: "냉장고 내부 분해 스팀 살균 및 음식물 냄새 제거",
      en: "Refrigerator interior disassembly steam sanitation & deodorization",
      vi: "Tháo lắp vệ sinh hơi nước khử mùi diệt khuẩn tủ lạnh",
      zh: "冰箱内部拆卸高温蒸汽杀菌及异味清除",
    },
    {
      id: "clean-6",
      ko: "에어컨 분해 필터 세척 및 냉각핀 곰팡이 고압 세척",
      en: "Air conditioner disassembly filter & cooling fin mold cleaning",
      vi: "Tháo rửa màng lọc điều hòa & xịt rửa giàn lạnh khử nấm mốc",
      zh: "空调深度拆洗滤网及散热片高压防霉清洗",
    },
    {
      id: "clean-7",
      ko: "세탁기 세탁조(통돌이/드럼) 분해 살균 및 찌꺼기 제거",
      en: "Washing machine tub disassembly deep cleaning & descaling",
      vi: "Tháo lồng máy giặt (cửa trên/cửa ngang) khử cặn bẩn & vi khuẩn",
      zh: "洗衣机内筒（波轮/滚筒）拆机除垢杀菌",
    },
    {
      id: "clean-8",
      ko: "바닥 마루/장판 찌든 때 기계 세척 및 왁스 코팅",
      en: "Floor machine scrubbing, stain removal & protective wax coating",
      vi: "Đánh bóng sàn máy chà sàn, tẩy ố & phủ sáp bảo vệ",
      zh: "木地板/地革污渍机械刷洗及抛光打蜡保护",
    },
    {
      id: "clean-9",
      ko: "침대 매트리스/패브릭 소파 집먼지진드기 습식 세척 및 살균",
      en: "Mattress / fabric sofa dust mite extraction & wet deep clean",
      vi: "Giặt nệm / sofa vải hút bọ bụi & giặt ướt khử mùi diệt khuẩn",
      zh: "床垫/布艺沙发除螨及湿式深度抽洗杀菌",
    },
    {
      id: "clean-10",
      ko: "쓰레기집/특수 청소 (대량 폐기물 분리수거 및 탈취/방역)",
      en: "Clutter / hoarder house deep clean (Bulk disposal & deodorization)",
      vi: "Dọn dẹp nhà rác/dọn đặc biệt (Thu gom rác thải & khử mùi diệt khuẩn)",
      zh: "垃圾房/特殊保洁（大件废弃物清运分类及深度除味防疫）",
    },
    {
      id: "clean-11",
      ko: "신축 건물 입주 전 공사 분진/시멘트 자국/페인트 제거",
      en: "Post-construction cleaning (Cement dust, paint splatters removal)",
      vi: "Dọn dẹp sau xây dựng (Làm sạch bụi mịn xi măng & vết sơn)",
      zh: "开荒保洁（清除水泥粉尘、乳胶漆印及装修残留痕迹）",
    },
    {
      id: "clean-12",
      ko: "반려동물 털/배변 냄새 제거 및 친환경 피톤치드 연무 소독",
      en: "Pet hair/odor removal & eco-friendly phytoncide fogging",
      vi: "Khử mùi hôi lông/chất thải thú cưng & xông tinh dầu phytoncide",
      zh: "宠物毛发/便溺异味深度清除及环保植物杀菌喷雾",
    },
  ],

  // 5. 주거/원룸 맞춤 방 구하기
  "housing": [
    {
      id: "h-1",
      ko: "보증금 100만~300만 원대의 저렴하고 안전한 원룸",
      en: "Affordable studio with 1M~3M KRW low deposit",
      vi: "Phòng one-room giá rẻ, đặt cọc thấp 1~3 triệu won",
      zh: "保证金100~300万韩元的平价安全单间",
    },
    {
      id: "h-2",
      ko: "외국인 등록증 소지자 및 비자 제한 없이 계약 가능한 방",
      en: "Apartment open to foreigner registration card & legal visa",
      vi: "Nhà chấp nhận ký hợp đồng cho người nước ngoài có ARC",
      zh: "持有外国人登陆证可正常签约无限制的房源",
    },
    {
      id: "h-3",
      ko: "풀옵션 (세탁기, 냉장고, 에어컨, 가스레인지/인덕션 포함)",
      en: "Full option (Washer, Fridge, A/C, Stove/Induction included)",
      vi: "Đầy đủ tiện nghi (máy giặt, tủ lạnh, điều hòa, bếp)",
      zh: "全套家电（包含洗衣机、冰箱、空调、燃气灶/电磁炉）",
    },
    {
      id: "h-4",
      ko: "단기 계약 (3개월 ~ 6개월) 가능한 원룸 또는 고시텔",
      en: "Short-term lease (3 to 6 months) available studio/gosiwon",
      vi: "Có thể thuê ngắn hạn (3 tháng ~ 6 tháng) hoặc gosiwon",
      zh: "可短租（3个月~6个月）的单间或考室院",
    },
    {
      id: "h-5",
      ko: "친구/동료/가족과 함께 살 수 있는 투룸 또는 쓰리룸",
      en: "Two-room or three-room house to share with coworkers/family",
      vi: "Nhà 2 phòng hoặc 3 phòng ở chung cùng bạn bè/gia đình",
      zh: "可与朋友/同事/家人合住的两居室或三居室",
    },
    {
      id: "h-6",
      ko: "지하철역 또는 버스 정류장 도보 5분 이내 역세권",
      en: "Within 5 minutes walk to subway or bus transit",
      vi: "Đi bộ dưới 5 phút tới ga tàu điện ngầm hoặc bến xe buýt",
      zh: "步行5分钟内直达地铁站或公交总站",
    },
    {
      id: "h-7",
      ko: "관리비 및 공과금이 투명하고 저렴한 가성비 방",
      en: "Transparent and low maintenance fee/utilities",
      vi: "Tiền quản lý và điện nước rõ ràng, tiết kiệm",
      zh: "管理费及水电煤气透明便宜的高性价比房源",
    },
    {
      id: "h-8",
      ko: "주차 가능 및 엘리베이터가 설치된 신축 건물",
      en: "Parking space & elevator available in modern building",
      vi: "Có chỗ đỗ xe và thang máy trong tòa nhà mới",
      zh: "带停车位且有电梯的新建建筑",
    },
    {
      id: "h-9",
      ko: "반려동물(강아지, 고양이) 동반 입주 가능한 방",
      en: "Pet-friendly accommodation (dogs, cats allowed)",
      vi: "Cho phép nuôi thú cưng (chó, mèo)",
      zh: "允许饲养宠物（猫/狗）共同入住的房源",
    },
    {
      id: "h-10",
      ko: "계약 만료 전 조기 퇴거 양도 및 보증금 반환 중개",
      en: "Early lease takeover & deposit return assistance",
      vi: "Hỗ trợ sang nhượng phòng chuyển đi sớm & lấy lại tiền cọc",
      zh: "合同期满前转租过户及保证金退还协调",
    },
  ],

  // 6. 은행 계좌 개설 도움
  "bank-help": [
    {
      id: "bank-1",
      ko: "외국인등록증/여권 소지 신규 통장 개설 동행",
      en: "Bank account opening escort with ARC / Passport",
      vi: "Đồng hành mở tài khoản ngân hàng bằng ARC / Hộ chiếu",
      zh: "外国人登陆证/护照新开银行账户陪同办理",
    },
    {
      id: "bank-2",
      ko: "체크카드 및 교통카드(T-money) 기능 탑재 카드 발급 신청",
      en: "Debit card with T-money transportation function application",
      vi: "Đăng ký phát hành thẻ Check kết hợp thẻ giao thông",
      zh: "办理借记卡及附带交通卡功能卡片",
    },
    {
      id: "bank-3",
      ko: "스마트폰 모바일 뱅킹 및 금융인증서/OTP 발급",
      en: "Mobile internet banking, Digital certificate & OTP setup",
      vi: "Cài đặt ứng dụng ngân hàng di động, chứng chỉ số & OTP",
      zh: "手机银行APP安装及数字证书/OTP密码器申请",
    },
    {
      id: "bank-4",
      ko: "본국 해외 송금(Remittance) 한도 증액 및 계좌 등록",
      en: "International remittance limit increase & beneficiary setup",
      vi: "Nâng hạn mức chuyển tiền quốc tế và đăng ký tài khoản thụ hưởng",
      zh: "本国海外汇款限额提升及收款人账户绑定",
    },
    {
      id: "bank-5",
      ko: "분실된 통장/카드 재발급 및 최근 거래내역서 출력",
      en: "Re-issuing lost passbook/card & printing bank statements",
      vi: "Cấp lại sổ/thẻ bị mất và in sao kê lịch sử giao dịch",
      zh: "存折/银行卡丢失补办及打印近期流水明细",
    },
    {
      id: "bank-6",
      ko: "비밀번호 5회 연속 오류 해제 및 계좌 지급정지 해제",
      en: "Resetting 5-time password errors & unfreezing account",
      vi: "Mở khóa lỗi nhập sai mật khẩu 5 lần & mở khóa tài khoản",
      zh: "解除连续5次输错密码锁定及解除账户冻结",
    },
    {
      id: "bank-7",
      ko: "월급 수령을 위한 급여통장 지정 및 자동이체 등록",
      en: "Salary payroll account designation & automatic debit setup",
      vi: "Đăng ký tài khoản nhận lương & cài đặt chuyển khoản tự động",
      zh: "指定工资结算账户及设置自动转账",
    },
    {
      id: "bank-8",
      ko: "외국인 전용 신용카드 발급 자격 상담 및 서류 준비 지원",
      en: "Foreigner credit card eligibility check & document assistance",
      vi: "Tư vấn điều kiện mở thẻ tín dụng người nước ngoài & chuẩn bị hồ sơ",
      zh: "外国人专属信用卡申请资质审核及材料准备",
    },
  ],

  // 7. 보험 가입 도움 (외국인등록증·행정)
  "insurance-help": [
    {
      id: "insur-1",
      ko: "국민건강보험(외국인 직장/지역가입) 자격 확인 및 등록 동행",
      en: "National Health Insurance qualification check & enrollment escort",
      vi: "Xác nhận tư cách & đồng hành đăng ký Bảo hiểm Y tế Quốc dân",
      zh: "国民健康保险（外国人职场/地域加入）资格确认及登记陪同",
    },
    {
      id: "insur-2",
      ko: "체류자격별 외국인 전용 의무보험(출국만기/귀국비용/상해보험)",
      en: "Foreign worker mandatory insurances (Departure guarantee / Accident)",
      vi: "Bảo hiểm bắt buộc theo visa (Mãn hạn xuất cảnh / Chi phí về nước / Tai nạn)",
      zh: "外国人专属法定必备保险（出国满期/回国费用/意外伤害保险）",
    },
    {
      id: "insur-3",
      ko: "민간 실손의료비(실비) 보험 및 질병/상해 입원비 보장 상담",
      en: "Private medical indemnity & hospitalization coverage consulting",
      vi: "Tư vấn bảo hiểm y tế tư nhân, hỗ trợ viện phí & phẫu thuật",
      zh: "韩国商业实损医疗险（实费）及疾病/意外住院津贴咨询",
    },
    {
      id: "insur-4",
      ko: "자동차 / 이륜차(오토바이) 의무보험 및 종합보험 비교 가입",
      en: "Auto / Motorcycle compulsory & comprehensive insurance setup",
      vi: "So sánh đăng ký bảo hiểm bắt buộc & toàn diện cho xe máy / ô tô",
      zh: "汽车/摩托车交强险及商业综合险比价投保",
    },
    {
      id: "insur-5",
      ko: "질병/사고 발생 시 보험금 청구 서류 안내 및 모국어 번역 지원",
      en: "Insurance claim filing guidance & medical document translation",
      vi: "Hướng dẫn thủ tục yêu cầu bồi thường bảo hiểm & dịch thuật hồ sơ bệnh án",
      zh: "患病/意外理赔申请材料指导及医疗文件母语翻译",
    },
    {
      id: "insur-6",
      ko: "비자 변경에 따른 보험 갱신 및 해약 환급금 신청",
      en: "Visa status update insurance adjustments & surrender value refund",
      vi: "Điều chỉnh bảo hiểm theo thay đổi visa & rút tiền hoàn lại bảo hiểm",
      zh: "签证变更相应的保险更新及退保解约返还金申请",
    },
    {
      id: "insur-7",
      ko: "치아보험 / 암보험 / 주요 수술비 집중 보장 플랜 상담",
      en: "Dental, cancer & major surgery insurance plan consulting",
      vi: "Tư vấn gói bảo hiểm nha khoa, ung thư & phẫu thuật lớn",
      zh: "牙齿保险/癌症保险/重大手术医疗津贴专项咨询",
    },
    {
      id: "insur-8",
      ko: "본국 완전 귀국 시 미청구 보험금 일괄 조회 및 수령 지원",
      en: "Unclaimed insurance benefits inquiry & collection prior to repatriation",
      vi: "Tra cứu & hỗ trợ nhận tiền bảo hiểm chưa thanh toán trước khi về nước",
      zh: "完全回国前回国未领保险金一键查询及清算领款",
    },
  ],

  // 8. 구인/구직 도움 (주거 안심 계약)
  "job-help": [
    {
      id: "job-1",
      ko: "제조업 / 공장 생산직 / 조립 / 품질 검사 (기숙사/숙식 제공)",
      en: "Manufacturing / Factory production & assembly (Dormitory provided)",
      vi: "Sản xuất / Công xưởng / Lắp ráp linh kiện & kiểm hàng (Có ký túc xá)",
      zh: "制造业/工厂生产组装/质检（提供住宿与三餐）",
    },
    {
      id: "job-2",
      ko: "음식점 / 식당 주방 보조 / 홀서빙 / 조리사 (외국인 채용 가능)",
      en: "Restaurant kitchen assistant / Hall server / Cook (Foreigner welcome)",
      vi: "Nhà hàng / Phụ bếp / Phục vụ bàn / Đầu bếp (Nhận người nước ngoài)",
      zh: "餐厅/饭店后厨帮工/前厅服务员/厨师（招收外国人）",
    },
    {
      id: "job-3",
      ko: "건설 / 인테리어 현장 형틀, 철근, 목수, 전기 및 배관 설비",
      en: "Construction / Interior site carpentry, rebar, electrical & plumbing",
      vi: "Công trường xây dựng / Nội thất, cốp pha, sắt thép, thợ mộc, điện nước",
      zh: "建筑工地/室内装修木工、钢筋、水电管道安装",
    },
    {
      id: "job-4",
      ko: "무역 / 물류 창고 입출고 / 지게차 운전 / 패킹 작업",
      en: "Trade / Logistics warehouse inbound-outbound, forklift & packing",
      vi: "Thương mại / Kho logistics xuất nhập kho / Lái xe nâng / Đóng gói",
      zh: "贸易物流仓库出入库理货/叉车操作/打包作业",
    },
    {
      id: "job-5",
      ko: "통번역 / 사무직 / 외국인 마케팅 / 해외 영업 전문직",
      en: "Interpretation / Office administration / Global marketing professional",
      vi: "Thông phiên dịch / Nhân viên văn phòng / Marketing quốc tế",
      zh: "商务翻译/办公室文员/海外营销专业岗位",
    },
    {
      id: "job-6",
      ko: "근로계약서 체결 검토 (임금, 근로시간, 주휴수당, 4대보험 확인)",
      en: "Employment contract review (Wage, work hours, 4 major social insurances)",
      vi: "Rà soát hợp đồng lao động (Lương bổng, giờ làm, trợ cấp tuần, bảo hiểm)",
      zh: "劳动就业合同审核（薪资、工时、周休津贴、四大保险确认）",
    },
    {
      id: "job-7",
      ko: "임금 체불, 퇴직금 미지급 및 부당 해고 노동상담 동행",
      en: "Unpaid wages, severance pay & labor dispute legal consultation escort",
      vi: "Đồng hành tư vấn tranh chấp lao động, nợ lương & trợ cấp thôi việc",
      zh: "拖欠工资、退职金未结清及劳动纠纷法律咨询陪同",
    },
    {
      id: "job-8",
      ko: "사업주 전용: 성실하고 신뢰할 수 있는 합법 비자 외국인 인력 채용 의뢰",
      en: "For Employers: Hiring qualified & diligent legal foreign workers",
      vi: "Dành cho chủ doanh nghiệp: Yêu cầu tuyển dụng lao động hợp pháp",
      zh: "雇主直聘专区：诚招踏实可靠、合法签证外籍优秀员工",
    },
  ],

  // 9. 병원 동행, 통역 도움
  "hospital-help": [
    {
      id: "hosp-1",
      ko: "대학병원 / 종합병원 전문과 진료 예약 및 사전 접수",
      en: "General/university hospital appointment booking & check-in",
      vi: "Đặt lịch khám chuyên khoa bệnh viện lớn & làm thủ tục tiếp đón",
      zh: "大学医院/综合医院专家门诊预约挂号及预检登记",
    },
    {
      id: "hosp-2",
      ko: "치과 충치, 신경치료, 발치, 임플란트 동행 통역",
      en: "Dental cavities, root canal, extraction escort & interpretation",
      vi: "Thông dịch đồng hành khám nha khoa sâu răng, nhổ răng, trồng răng",
      zh: "牙科蛀牙、根管治疗、拔牙、种植牙陪同翻译",
    },
    {
      id: "hosp-3",
      ko: "정형외과 뼈/관절 골절, 허리 통증, 물리치료 통역",
      en: "Orthopedic bone fracture, back pain, physical therapy translation",
      vi: "Thông dịch chỉnh hình gãy xương, đau lưng, vật lý trị liệu",
      zh: "骨科骨折、腰背剧痛、物理康复治疗诊疗翻译",
    },
    {
      id: "hosp-4",
      ko: "내과 / 이비인후과 감기, 장염, 복통, 위/대장 내시경 검사 통역",
      en: "Internal medicine / ENT colds, gastroenteritis, endoscopy translation",
      vi: "Nội khoa / Tai mũi họng cảm cúm, đau bụng, nội soi dạ dày đại tràng",
      zh: "内科/耳鼻喉科感冒、肠胃炎、腹痛、胃肠镜检查翻译",
    },
    {
      id: "hosp-5",
      ko: "산부인과 / 비뇨의학과 정밀 검진 및 프라이빗 상담 통역",
      en: "OB-GYN / Urology checkups & confidential doctor consultation",
      vi: "Khám phụ khoa / Nam khoa chuyên sâu & thông dịch bảo mật",
      zh: "妇产科/泌尿外科专科检查及隐私就诊翻译",
    },
    {
      id: "hosp-6",
      ko: "외국인 국가건강검진 종합 검사 결과표 모국어 설명",
      en: "National health screening report explanation in native tongue",
      vi: "Giải thích kết quả khám sức khỏe định kỳ bằng tiếng mẹ đẻ",
      zh: "国家健康体检综合检查报告母语详细解读",
    },
    {
      id: "hosp-7",
      ko: "야간 또는 공휴일 응급실(ER) 긴급 방문 동행 지원",
      en: "Night/weekend emergency room (ER) escort & assistance",
      vi: "Hỗ trợ đồng hành cấp cứu ban đêm hoặc ngày lễ",
      zh: "夜间或节假日急诊室（ER）紧急陪同救治",
    },
    {
      id: "hosp-8",
      ko: "약국 처방전 복용 방법, 부작용 및 주의사항 통역",
      en: "Pharmacy prescription dosage, precautions & instructions",
      vi: "Hướng dẫn uống thuốc theo đơn, lưu ý tác dụng phụ tại nhà thuốc",
      zh: "药房处方药服用方法、禁忌及注意事项解释",
    },
  ],

  // 10. 이동전화 개통 도움
  "mobile-help": [
    {
      id: "mob-1",
      ko: "외국인등록증/여권으로 본인 인증 가능한 알뜰폰(USIM) 개통",
      en: "Foreigner budget USIM activation with full identity authentication",
      vi: "Kích hoạt SIM giá rẻ (USIM) xác thực danh tính bằng ARC/Hộ chiếu",
      zh: "持外国人登陆证/护照开通可实名认证的廉价卡（USIM）",
    },
    {
      id: "mob-2",
      ko: "선불 유심(Prepaid SIM) 간편 충전 및 데이터 무제한 요금제 상담",
      en: "Prepaid SIM card quick recharge & unlimited data plans",
      vi: "Nạp tiền SIM trả trước nhanh chóng & gói cước data không giới hạn",
      zh: "预付费电话卡（Prepaid SIM）便捷充值及无限流量套餐咨询",
    },
    {
      id: "mob-3",
      ko: "통신 3사(SKT/KT/LGU+) 5G/LTE 신규 개통 및 최신 스마트폰 기기변경",
      en: "Major carriers (SKT/KT/LGU+) new sign-up & latest smartphone upgrades",
      vi: "Đăng ký mạng lớn (SKT/KT/LGU+) & đổi máy điện thoại thông minh mới",
      zh: "韩国三大运营商（SKT/KT/LGU+）合约开通及最新智能手机换机",
    },
    {
      id: "mob-4",
      ko: "원룸/가정용 초고속 광랜 인터넷 및 기가 와이파이(Wi-Fi) 설치",
      en: "Studio/Home high-speed fiber internet & Giga Wi-Fi setup",
      vi: "Lắp đặt mạng cáp quang tốc độ cao & Giga Wi-Fi cho phòng trọ/gia đình",
      zh: "单间/家庭高速光纤宽带及千兆Wi-Fi路由器安装",
    },
    {
      id: "mob-5",
      ko: "통신비 미납/정지 해결, 명의 변경 및 알뜰폰 번호이동(MNP)",
      en: "Unpaid bill suspension release, ownership transfer & number portability (MNP)",
      vi: "Xử lý nợ cước mở khóa mạng, đổi tên chính chủ & chuyển mạng giữ số",
      zh: "欠费停机复通、机主实名过户及携号转网（MNP）",
    },
    {
      id: "mob-6",
      ko: "모바일 본인확인(PASS 앱) 설치 및 금융/공공기관 본인인증 지원",
      en: "PASS identity verification app setup & mobile authentication help",
      vi: "Cài đặt ứng dụng định danh PASS & hỗ trợ xác thực dịch vụ công",
      zh: "安装PASS身份认证APP及金融/政务移动实名认证协助",
    },
    {
      id: "mob-7",
      ko: "스마트폰 액정 파손, 배터리 교체 및 공식 AS 센터 동행",
      en: "Screen damage, battery replacement & official service center escort",
      vi: "Vỡ màn hình, thay pin & đồng hành tới trung tâm bảo hành chính hãng",
      zh: "手机碎屏维修、电池更换及官方售后中心陪同",
    },
    {
      id: "mob-8",
      ko: "국제전화 요금 절약 어플리케이션 및 선불 데이터 쿠폰 충전",
      en: "Discount international calling apps & prepaid data coupon recharge",
      vi: "Ứng dụng gọi quốc tế tiết kiệm & nạp thẻ cước data trả trước",
      zh: "国际长途省钱APP设置及预付费流量充值包",
    },
  ],
};

/**
 * Returns the checklist options for a service slug in the user's locale
 */
export function getProblemOptionsForService(slug: string, locale: string): { id: string; label: string; ko: string; translated: string }[] {
  // Normalize slug aliases
  let targetSlug = slug.toLowerCase();
  if (targetSlug.includes("clog") || targetSlug.includes("toilet") || targetSlug.includes("sink") || targetSlug.includes("drain")) {
    targetSlug = "clog-clearing";
  } else if (targetSlug.includes("leak") || targetSlug.includes("pipe") || targetSlug.includes("water") || targetSlug.includes("plumb")) {
    targetSlug = "leak-plumbing";
  } else if (targetSlug.includes("boiler") || targetSlug.includes("heat")) {
    targetSlug = "boiler";
  } else if (targetSlug.includes("clean")) {
    targetSlug = "cleaning";
  } else if (targetSlug.includes("hous") || targetSlug.includes("room") || targetSlug.includes("rent")) {
    targetSlug = "housing";
  } else if (targetSlug.includes("bank") || targetSlug.includes("finance") || targetSlug.includes("card")) {
    targetSlug = "bank-help";
  } else if (targetSlug.includes("insur")) {
    targetSlug = "insurance-help";
  } else if (targetSlug.includes("job") || targetSlug.includes("work") || targetSlug.includes("hire") || targetSlug.includes("employ")) {
    targetSlug = "job-help";
  } else if (targetSlug.includes("hosp") || targetSlug.includes("medic") || targetSlug.includes("doctor")) {
    targetSlug = "hospital-help";
  } else if (targetSlug.includes("mobile") || targetSlug.includes("phone") || targetSlug.includes("telecom") || targetSlug.includes("usim")) {
    targetSlug = "mobile-help";
  }

  const list = SERVICE_PROBLEM_OPTIONS[targetSlug] || SERVICE_PROBLEM_OPTIONS["job-help"];

  return list.map((item) => {
    let text = item.ko;
    if (locale === "ko") {
      text = item.ko;
    } else if (locale === "vi") {
      text = item.vi || item.en || item.ko;
    } else if (locale.startsWith("zh")) {
      text = item.zh || item.en || item.ko;
    } else if (item[locale]) {
      text = item[locale] as string;
    } else {
      // Non-Korean locales always fall back to universal English, NEVER Korean
      text = item.en || item.ko;
    }

    return {
      id: item.id,
      label: text,
      ko: item.ko,
      translated: text,
    };
  });
}
