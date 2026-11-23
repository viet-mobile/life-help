import json, re

# Load studyTopics89.json
path = '/Users/juboklee/life-project/life-help/lib/learn/dailyInsights/studyTopics89.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Clean c-115 and c-156
for cid in ['c-115', 'c-156']:
    entry = data.get(cid, {})
    principle = entry.get('principle', {})
    for lang, val in list(principle.items()):
        if isinstance(val, str):
            # Replace Korean note with English or clean native note
            clean_val = val.replace('(일정 시간마다 2배씩 기하급수적 증식)', '(tăng gấp đôi theo cấp số nhân theo chu kỳ đều đặn)' if lang == 'vi' else '(exponential growth doubling at regular intervals)')
            principle[lang] = clean_val

# 2. Comprehensive Vietnamese translations for m-001 to m-036
m_vi = {
    "m-001": {
        "title": "Quy tắc 72 tính lãi kép",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội thông qua công thức tính lãi kép theo Quy tắc 72.",
        "principle": "Thời gian để số vốn tăng gấp đôi ≒ 72 ÷ Lãi suất hàng năm (%)",
        "example": "Đầu tư ETF với lợi nhuận 8%/năm, 72 ÷ 8 = vốn nhân đôi sau 9 năm.",
        "actionItem": "Chia 72 cho tỷ suất lợi nhuận kỳ vọng của các sản phẩm tài chính bạn đang tham gia."
    },
    "m-002": {
        "title": "Mua trả góp 0% hay thanh toán ngay nhận giảm giá",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội qua tính toán điểm hòa vốn tài chính.",
        "principle": "Chọn trả góp nếu lợi nhuận từ việc gửi tiết kiệm số tiền đó vượt quá mức giảm giá khi thanh toán ngay.",
        "example": "Nếu được giảm giá 5% khi trả ngay so với gửi tiết kiệm 4%, chọn trả ngay sẽ có lợi hơn.",
        "actionItem": "So sánh mức giảm giá trả ngay với lãi suất tiền gửi trước khi bấm chọn trả góp 0%."
    },
    "m-003": {
        "title": "Tính ngược thuế suất biên thu nhập thực tế khi đàm phán lương",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội qua công thức tính thu nhập thực nhận sau thuế.",
        "principle": "Mức tăng thực nhận = Mức tăng danh nghĩa × (1 - Thuế suất biên - Tỷ lệ bảo hiểm)",
        "example": "Tăng lương danh nghĩa 5 triệu nhưng thuế và bảo hiểm chiếm 25% thì thực nhận tăng 3,75 triệu.",
        "actionItem": "Khi đàm phán lương, hãy tính toán song song tổng lương trước thuế và mức tăng thu nhập thực nhận hàng tháng."
    },
    "m-004": {
        "title": "Công thức thâm hụt calo giảm 1kg mỡ thừa",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội với công thức thâm hụt calo khoa học.",
        "principle": "Giảm 1kg mỡ thuần túy ≒ Cần tạo thâm hụt khoảng 7.700 kcal",
        "example": "Tạo thâm hụt 500 kcal mỗi ngày sẽ giúp giảm 1kg mỡ sau khoảng 15 ngày.",
        "actionItem": "Thay vì chỉ nhìn cân nặng, hãy theo dõi việc duy trì mức thâm hụt 500 kcal mỗi ngày."
    },
    "m-005": {
        "title": "Tránh phí chuyển đổi kép DCC 3~8% khi quẹt thẻ quốc tế",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội bằng cách thanh toán bằng đồng nội tệ tại điểm đến.",
        "principle": "Thanh toán bằng tiền nhà = Phí quy đổi sang tiền nhà + Phí xử lý giao dịch ngoại tệ của ngân hàng",
        "example": "Thanh toán bằng đồng Won hoặc tiền bản địa giúp tiết kiệm 3-8% phí chuyển đổi bổ sung.",
        "actionItem": "Bật tính năng 'Chặn thanh toán bằng đồng nội tệ ở nước ngoài (DCC)' trên ứng dụng thẻ ngân hàng."
    },
    "m-006": {
        "title": "Định lượng nồng độ nước giặt tối ưu cho máy giặt",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội với lượng nước giặt chuẩn xác.",
        "principle": "Nồng độ bão hòa chất hoạt động bề mặt: Dùng quá mức khuyến nghị làm tăng 0% hiệu quả làm sạch",
        "example": "Cho lượng nước giặt gấp đôi chỉ làm tăng thêm 2 lần xả, gây lãng phí nước và tiền điện.",
        "actionItem": "Kiểm tra kỹ vạch chia thể tích trên nắp nước giặt và chỉ dùng đúng định lượng theo trọng lượng đồ giặt."
    },
    "m-007": {
        "title": "Sức mạnh toán học của tái đầu tư cổ tức (DRIP)",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội thông qua tái đầu tư cổ tức định kỳ.",
        "principle": "Tái đầu tư cổ tức giúp gia tăng số lượng cổ phiếu sở hữu, tạo ra hiệu ứng tăng trưởng kép theo cấp số nhân.",
        "example": "Một khoản đầu tư với cổ tức 4% được tái đầu tư đều đặn sẽ vượt trội hơn nhiều so với việc rút tiền mặt tiêu dùng.",
        "actionItem": "Kích hoạt tính năng tự động tái đầu tư cổ tức trên tài khoản chứng khoán của bạn."
    },
    "m-008": {
        "title": "So sánh đơn giá để tránh bẫy ảo giác mua số lượng lớn",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội bằng cách tính đơn giá chuẩn.",
        "principle": "Đơn giá = Tổng giá tiền ÷ Tổng khối lượng; hàng đóng gói lớn chưa chắc đã rẻ hơn gói nhỏ.",
        "example": "Gói 1kg giá 100.000đ đắt hơn 2 gói 500g đang khuyến mãi giá 45.000đ mỗi gói.",
        "actionItem": "Luôn kiểm tra dòng chữ ghi 'đơn giá trên 100g hoặc 100ml' trên nhãn kệ siêu thị trước khi mua."
    },
    "m-009": {
        "title": "So sánh trợ cấp thôi việc loại DC và DB khi chuyển việc",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội với bài toán lương hưu.",
        "principle": "Chọn DB nếu tốc độ tăng lương cao hơn tỷ suất đầu tư; chọn DC nếu tự tin đầu tư đạt lợi nhuận cao hơn.",
        "example": "Tăng lương 6%/năm nên giữ DB, nhưng nếu lương đi ngang và có danh mục ETF 8% thì DC vượt trội.",
        "actionItem": "So sánh tốc độ tăng lương kỳ vọng với tỷ suất đầu tư trước khi chuyển đổi quỹ hưu trí."
    },
    "m-010": {
        "title": "Tối ưu hóa vùng nhịp tim Zone 2 tăng sức bền tim mạch",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội trong tập luyện thể thao.",
        "principle": "Zone 2 = (Nhịp tim tối đa [220 - Tuổi] - Nhịp tim nghỉ) × 0.60 đến 0.70 + Nhịp tim nghỉ.",
        "example": "Tập luyện ở vùng Zone 2 giúp đốt cháy chất béo tối đa và nâng cao dung tích ti thể mà không làm kiệt sức.",
        "actionItem": "Sử dụng đồng hồ thông minh duy trì nhịp tim trong vùng Zone 2 ít nhất 45 phút mỗi buổi chạy."
    },
    "m-011": {
        "title": "Toán học điều chỉnh chu kỳ sinh học vượt qua lệch múi giờ (Jet Lag)",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi đi công tác xa.",
        "principle": "Đồng hồ sinh học điều chỉnh khoảng 1 giờ mỗi ngày khi bay về hướng tây và 1.5 ngày khi bay về hướng đông.",
        "example": "Lệch 6 múi giờ cần khoảng 4-6 ngày thích nghi; tiếp xúc ánh sáng buổi sáng giúp đẩy nhanh tiến trình.",
        "actionItem": "Chỉnh đồng hồ theo giờ nơi đến ngay khi lên máy bay và ăn theo bữa của giờ mới."
    },
    "m-012": {
        "title": "Chế độ vắng nhà hay duy trì nhiệt độ sưởi 18-20°C",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội với hệ thống sưởi ấm.",
        "principle": "Làm nóng lại sàn và đường ống từ trạng thái lạnh ngắt tốn thêm tới 30% năng lượng so với duy trì nền nhiệt ổn định.",
        "example": "Ra ngoài dưới 10 tiếng nên duy trì ở 18-20°C thay vì tắt hẳn sưởi.",
        "actionItem": "Đặt nhiệt độ nền 18°C khi ra ngoài trong ngày vào mùa đông thay vì tắt lò sưởi hoàn toàn."
    },
    "m-013": {
        "title": "Chiến lược bình quân giá (DCA) giảm giá vốn đầu tư",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội qua phương pháp mua tích lũy định kỳ.",
        "principle": "Mua định kỳ một khoản tiền cố định giúp mua được nhiều cổ phần hơn khi giá giảm và ít hơn khi giá tăng.",
        "example": "Giá giảm 50% rồi phục hồi về ban đầu giúp chiến lược DCA đạt lợi nhuận dương trong khi mua 1 lần hòa vốn.",
        "actionItem": "Cài đặt lệnh tự động mua ETF vào một ngày cố định hàng tháng."
    },
    "m-014": {
        "title": "Toán học tối ưu hóa hiệu suất điều hòa biến tần (Inverter)",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội với hóa đơn tiền điện.",
        "principle": "Máy nén Inverter giảm công suất xuống còn 20-30% khi đạt nhiệt độ cài đặt, tiết kiệm hơn nhiều so với việc bật/tắt liên tục.",
        "example": "Để điều hòa chạy liên tục ở 26°C tốn ít điện hơn việc bật lạnh 18°C rồi tắt lặp đi lặp lại.",
        "actionItem": "Duy trì nhiệt độ 26-27°C kèm quạt gió nhẹ thay vì bật tắt điều hòa nhiều lần trong ngày."
    },
    "m-015": {
        "title": "Tính tỷ suất sinh lời (ROI) khi đầu tư học tập và chứng chỉ",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội cho phát triển bản thân.",
        "principle": "ROI giáo dục = (Mức tăng lương hàng năm × Số năm làm việc - Học phí) ÷ Chi phí đầu tư.",
        "example": "Khóa học 20 triệu giúp lương tăng 3 triệu/tháng sẽ hoàn vốn chỉ sau chưa đầy 7 tháng.",
        "actionItem": "Tính thời gian hoàn vốn (Payback Period) trước khi quyết định đăng ký khóa học nghề mới."
    },
    "m-016": {
        "title": "Công thức tính lượng nước cơ thể cần uống mỗi ngày",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội cho sức khỏe.",
        "principle": "Lượng nước cần mỗi ngày (ml) = Trọng lượng cơ thể (kg) × 30 đến 35 ml (+ 500ml nếu vận động nhiều).",
        "example": "Người nặng 60kg cần uống khoảng 1.8 đến 2.1 lít nước mỗi ngày để đảm bảo trao đổi chất.",
        "actionItem": "Chuẩn bị bình nước có vạch chia dung tích 1 lít và uống hết 2 bình trong ngày làm việc."
    },
    "m-017": {
        "title": "Thời điểm vàng đặt vé máy bay theo quy luật thống kê",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi săn vé máy bay.",
        "principle": "Thuật toán hàng không thường mở bán mức giá tối ưu nhất vào khoảng 6 đến 8 tuần trước ngày bay.",
        "example": "Đặt trước 2 tháng giúp tiết kiệm từ 15-30% so với đặt sát ngày hoặc quá sớm trước 6 tháng.",
        "actionItem": "Bật tính năng theo dõi giá vé trên Google Flights hoặc Skyscanner 2 tháng trước chuyến đi."
    },
    "m-018": {
        "title": "Kiểm tra rò rỉ nước ngầm bằng kim đồng hồ nước",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội qua kiểm tra đồng hồ nước.",
        "principle": "Khóa toàn bộ vòi nước trong nhà: nếu kim ngôi sao nhỏ vẫn quay chậm, chắc chắn có rò rỉ ngầm.",
        "example": "Một vòi nước rò rỉ nhỏ có thể làm thất thoát 30.000 lít nước và tiền triệu mỗi năm.",
        "actionItem": "Khóa hết vòi và quan sát đồng hồ nước trong 15 phút vào cuối tuần để phát hiện rò rỉ sớm."
    },
    "m-019": {
        "title": "Toán học bảo toàn sức mua thực tế trước lạm phát",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội chống trượt giá tiền tệ.",
        "principle": "Lãi suất thực tế ≒ Lãi suất danh nghĩa - Tỷ lệ lạm phát - Thuế lãi suất.",
        "example": "Gửi tiết kiệm 5% khi lạm phát 4% và thuế 1% thì sức mua thực nhận thực tế bằng 0%.",
        "actionItem": "Phân bổ một phần tài sản vào các kênh tăng trưởng có khả năng sinh lời cao hơn lạm phát."
    },
    "m-020": {
        "title": "Tối ưu hóa tỷ lệ hoàn tiền và quyền lợi thẻ tín dụng",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi sử dụng thẻ tín dụng.",
        "principle": "Tỷ lệ hưởng lợi = (Tổng tiền hoàn + Giảm giá hàng tháng - Phí thường niên chia đều) ÷ Tổng chi tiêu.",
        "example": "Nếu chi tiêu 10 triệu và nhận lại 300.000đ ưu đãi, tỷ lệ hưởng lợi đạt 3%, là mức rất tốt.",
        "actionItem": "Chọn thẻ tín dụng có danh mục hoàn tiền trùng khớp với thói quen chi tiêu lớn nhất của bạn."
    },
    "m-021": {
        "title": "Khấu trừ 3.3% hay quyết toán thuế thu nhập cá nhân cho người làm tự do",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi quyết toán thuế.",
        "principle": "Nếu tỷ lệ chi phí thực tế hoặc chi phí định mức làm giảm thu nhập chịu thuế, bạn sẽ được hoàn tiền thuế đã nộp.",
        "example": "Được khấu trừ 3.3% trong năm nhưng thu nhập thuộc bậc thuế thấp sẽ được nhận lại tiền hoàn thuế.",
        "actionItem": "Thu thập đầy đủ hóa đơn chứng từ chi phí phục vụ công việc để làm thủ tục quyết toán thuế."
    },
    "m-022": {
        "title": "Công thức Harris-Benedict tính tỷ lệ trao đổi chất cơ bản (BMR)",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội trong dinh dưỡng thể hình.",
        "principle": "BMR (Nam) = 88.36 + (13.4 × kg) + (4.8 × cm) - (5.7 × tuổi); BMR (Nữ) = 447.6 + (9.2 × kg) + (3.1 × cm) - (4.3 × tuổi).",
        "example": "Biết chính xác BMR giúp bạn không bao giờ ăn dưới mức năng lượng sinh tồn của cơ thể.",
        "actionItem": "Tính chỉ số BMR của bản thân và nhân với hệ số vận động để xác định tổng năng lượng tiêu thụ hàng ngày (TDEE)."
    },
    "m-023": {
        "title": "So sánh phí hành lý quá cước tại sân bay và mua trước trực tuyến",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi chuẩn bị hành lý.",
        "principle": "Phí quá cước tại quầy sân bay đắt gấp 2 đến 3 lần so with mua gói hành lý trực tuyến trước chuyến bay.",
        "example": "Mua thêm 5kg online mất 200.000đ nhưng bị phạt tại cửa máy bay có thể tốn hơn 600.000đ.",
        "actionItem": "Cân hành lý tại nhà bằng cân xách tay trước khi khởi hành ra sân bay."
    },
    "m-024": {
        "title": "Điều chỉnh phao bồn cầu tiết kiệm 40.000 lít nước mỗi năm",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội qua tiết kiệm tài nguyên nước.",
        "principle": "Hạ thấp van phao hoặc đặt chai nước 1.5L vào két bồn cầu giúp tiết kiệm 1.5L mỗi lần xả.",
        "example": "Gia đình 4 người xả 20 lần/ngày tiết kiệm được 30 lít/ngày, tương đương gần 11.000 lít/năm.",
        "actionItem": "Mở nắp két nước bồn cầu và vặn chỉnh ốc vít hạ thấp mực nước phao ngắt."
    },
    "m-025": {
        "title": "Tái cân bằng danh mục đầu tư và tối đa hóa chỉ số Sharpe",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội trong quản lý tài sản.",
        "principle": "Bán bớt lớp tài sản tăng giá mạnh để mua lớp tài sản đang định giá thấp giúp tự động 'mua đáy bán đỉnh'.",
        "example": "Duy trì tỷ lệ 60% cổ phiếu / 40% trái phiếu hàng năm giúp giảm 30% độ biến động của tài khoản.",
        "actionItem": "Thiết lập lịch tái cân bằng danh mục vào ngày cuối cùng của mỗi quý."
    },
    "m-026": {
        "title": "Toán học về lực cản khí động học và tốc độ lái xe tiết kiệm nhiên liệu",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi vận hành xe.",
        "principle": "Lực cản không khí tăng theo bình phương vận tốc; chạy trên 100km/h tiêu hao nhiên liệu tăng vọt.",
        "example": "Duy trì tốc độ 80-90km/h trên cao tốc tiết kiệm 15-20% xăng so với chạy ép ga 120km/h.",
        "actionItem": "Sử dụng chế độ kiểm soát hành trình (Cruise Control) ở dải tốc độ kinh tế 80-90km/h."
    },
    "m-027": {
        "title": "Tính lương làm thêm giờ và đơn giá lương giờ chuẩn",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội về quyền lợi lao động.",
        "principle": "Lương giờ chuẩn = Lương cơ bản tháng ÷ 209 giờ; Làm thêm ngày thường tính tối thiểu 150%, ngày nghỉ 200%.",
        "example": "Làm thêm 10 giờ vào ngày thường sẽ được nhận lương tương đương 15 giờ làm việc bình thường.",
        "actionItem": "Kiểm tra bảng lương chi tiết để đối chiếu số giờ tăng ca và hệ số lương tương ứng."
    },
    "m-028": {
        "title": "Quang học hình học của quy tắc 20-20-20 bảo vệ mắt",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội cho thị lực.",
        "principle": "Nhìn ra xa 20 feet (khoảng 6 mét) giúp cơ thể mi của mắt thả lỏng hoàn toàn trạng thái điều tiết.",
        "example": "Mỗi 20 phút làm việc với màn hình, nhìn ra xa 6 mét trong 20 giây giúp ngăn ngừa cận thị và mỏi mắt.",
        "actionItem": "Cài đặt ứng dụng nhắc nhở thư giãn mắt sau mỗi 20 phút ngồi trước máy tính."
    },
    "m-029": {
        "title": "So sánh chi phí trên mỗi Gigabyte giữa eSIM du lịch và SIM địa phương",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi sử dụng internet ở nước ngoài.",
        "principle": "Chi phí trên mỗi GB = Giá gói cước ÷ Dung lượng data; đánh giá cùng với phí duy trì số điện thoại.",
        "example": "eSIM 5GB giá 200.000đ (40.000đ/GB) tiện lợi hơn mua SIM vật lý nếu chuyến đi ngắn ngày.",
        "actionItem": "Tính đơn giá mỗi GB data của các nhà mạng trước khi mua gói chuyển vùng quốc tế."
    },
    "m-030": {
        "title": "Quản lý tủ lạnh theo nguyên tắc Nhập trước Xuất trước (FIFO)",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội để giảm lãng phí thực phẩm.",
        "principle": "Xếp thực phẩm mới mua ra phía sau, đưa thực phẩm cũ ra phía trước để dùng trước khi hết hạn.",
        "example": "Giảm 50% lượng thực phẩm phải vứt bỏ giúp tiết kiệm hàng triệu đồng chi tiêu mỗi tháng.",
        "actionItem": "Dán nhãn ngày mở nắp lên các hộp gia vị và thực phẩm tươi sống trong tủ lạnh."
    },
    "m-031": {
        "title": "Lãi kép ngược: Tốc độ trả nợ các khoản vay lãi suất cao",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội trong xử lý nợ vay.",
        "principle": "Trả hết khoản nợ lãi suất 15% mang lại hiệu quả tương đương việc đạt lợi nhuận đầu tư 15% miễn thuế.",
        "example": "Ưu tiên dồn tiền trả hết khoản nợ lãi suất cao nhất giúp tiết kiệm hàng chục triệu tiền lãi tích lũy.",
        "actionItem": "Liệt kê các khoản vay theo lãi suất từ cao xuống thấp và ưu tiên trả dứt điểm khoản cao nhất."
    },
    "m-032": {
        "title": "Ngưỡng tiêu thụ dữ liệu di động ngăn ngừa sốc cước phí",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi dùng 4G/5G.",
        "principle": "Xem video độ phân giải cao tốn khoảng 1.5GB đến 3GB mỗi giờ; video 480p chỉ tốn khoảng 500MB.",
        "example": "Chuyển chất lượng video sang 720p hoặc 480p khi dùng mạng di động giúp tiết kiệm 70% dung lượng data.",
        "actionItem": "Cài đặt giới hạn cảnh báo dung lượng data di động trên điện thoại ở mức 80% gói cước."
    },
    "m-033": {
        "title": "Toán học về giá thực hiện quyền chọn cổ phiếu (Stock Option) và thuế",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi nhận quyền chọn cổ phiếu.",
        "principle": "Lợi nhuận ròng = (Giá thị trường - Giá thực hiện) × Số cổ phần - Thuế thu nhập và phí.",
        "example": "Hiểu rõ sự khác biệt giữa thời điểm trao quyền (Vesting) và thời điểm thực hiện quyền giúp tối ưu hóa số thuế phải nộp.",
        "actionItem": "Tham vấn chuyên gia thuế trước khi thực hiện bán cổ phiếu quyền chọn quy mô lớn."
    },
    "m-034": {
        "title": "Chu kỳ giấc ngủ 90 phút: Thức dậy sảng khoái từ giấc ngủ REM",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội cho giấc ngủ chất lượng.",
        "principle": "Một chu kỳ giấc ngủ hoàn chỉnh kéo dài khoảng 90 phút; thức dậy vào cuối chu kỳ giúp cơ thể tỉnh táo nhất.",
        "example": "Ngủ 6 tiếng (4 chu kỳ) hoặc 7.5 tiếng (5 chu kỳ) giúp tránh cảm giác choáng váng do thức dậy giữa giấc ngủ sâu.",
        "actionItem": "Cài đặt báo thức theo các mốc bội số của 90 phút cộng thêm 15 phút thời gian chìm vào giấc ngủ."
    },
    "m-035": {
        "title": "Vé máy bay đa chặng (Open-Jaw) tiết kiệm thời gian và chi phí",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi lên kế hoạch du lịch.",
        "principle": "Bay đến thành phố A và bay về từ thành phố B giúp tiết kiệm chi phí tàu xe và thời gian quay lại điểm ban đầu.",
        "example": "Hành trình Seoul -> Tokyo / Osaka -> Seoul tránh việc phải mua vé tàu Shinkansen khứ hồi tốn kém.",
        "actionItem": "Tìm kiếm theo tùy chọn 'Nhiều thành phố (Multi-city)' khi đặt vé cho chuyến đi qua nhiều điểm đến."
    },
    "m-036": {
        "title": "Ngắt nguồn điện chờ: Loại bỏ điện tiêu thụ ẩn của thiết bị",
        "summary": "Mẹo Toán học thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội với hóa đơn tiền điện.",
        "principle": "Các thiết bị có màn hình đồng hồ hoặc điều khiển từ xa tiêu tốn từ 5 đến 10% lượng điện sinh hoạt ở chế độ chờ.",
        "example": "Dùng ổ cắm có công tắc ngắt cho TV, dàn âm thanh và lò vi sóng giúp tiết kiệm hàng trăm nghìn đồng mỗi tháng.",
        "actionItem": "Sử dụng ổ cắm có công tắc riêng cho các cụm thiết bị giải trí để ngắt điện khi không dùng."
    }
}

# Apply m-001 to m-036 Vietnamese
for k, trans in m_vi.items():
    if k in data:
        for f in ['title', 'summary', 'principle', 'example', 'actionItem']:
            if f in data[k]:
                data[k][f]['vi'] = trans[f]

# 3. Comprehensive English and Vietnamese for e-001 to e-036
e_clean = {
    "e-001": {
        "en": {
            "title": "Crucial Differences: Yield vs. Return vs. Interest",
            "summary": "Practical English tip: Optimize everyday decisions and opportunity costs with the crucial differences among yield, return, and interest.",
            "principle": "Interest (fixed coupon rate), Yield (current yield relative to market price), Return (total gain including capital appreciation).",
            "example": "Even if dividend yield is 8%, a 10% drop in share price results in a negative total return.",
            "actionItem": "Always check the 'Total Return' metric first in international investment prospectuses."
        },
        "vi": {
            "title": "Sự khác biệt cốt lõi giữa Yield, Return và Interest",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi đầu tư quốc tế.",
            "principle": "Interest (lãi suất cố định), Yield (tỷ suất cổ tức trên giá thị trường), Return (tổng lợi nhuận bao gồm lãi vốn).",
            "example": "Dù tỷ suất cổ tức là 8%, nhưng nếu giá cổ phiếu giảm 10% thì tổng lợi nhuận (Total Return) vẫn âm.",
            "actionItem": "Luôn kiểm tra chỉ số 'Total Return' đầu tiên khi đọc bản cáo bạch đầu tư nước ngoài."
        }
    },
    "e-002": {
        "en": {
            "title": "Cancellation and Refund Templates for International Subscriptions",
            "summary": "Practical English tip: Optimize everyday decisions and opportunity costs with templates for canceling auto-renewals and requesting refunds.",
            "principle": "Use neutral phrases like 'unintended renewal' and request a 'one-time courtesy' refund without assigning blame.",
            "example": "\"I noticed an unintended renewal charge for [Service]. Could you please issue a refund as a one-time courtesy?\"",
            "actionItem": "Send this exact wording to live customer support chat when canceling an unintended foreign subscription."
        },
        "vi": {
            "title": "Mẫu thư hủy gia hạn tự động và yêu cầu hoàn tiền dịch vụ quốc tế",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí cơ hội khi quản lý đăng ký dịch vụ.",
            "principle": "Sử dụng cụm từ 'unintended renewal' (gia hạn ngoài ý muốn) và 'one-time courtesy' (châm chước một lần) thay vì tranh cãi gay gắt.",
            "example": "\"I noticed an unintended renewal charge for [Service]. Could you please issue a refund as a one-time courtesy?\"",
            "actionItem": "Gửi ngay mẫu câu này cho bộ phận hỗ trợ khách hàng khi phát hiện đăng ký bị tự động gia hạn."
        }
    },
    "e-003": {
        "en": {
            "title": "Resume Action Verbs: Replacing 'Responsible for'",
            "summary": "Practical English tip: Optimize everyday decisions and career opportunities by replacing passive phrasing with impactful action verbs.",
            "principle": "Use proactive power verbs that highlight accomplishments and quantifiable outcomes instead of passive duty descriptions.",
            "example": "Replace 'Responsible for sales' with 'Spearheaded regional sales expansion, boosting annual revenue by 24%'.",
            "actionItem": "Upgrade your resume bullet points by beginning with dynamic verbs like Spearheaded, Orchestrated, or Optimized."
        },
        "vi": {
            "title": "Động từ hành động trong CV: Thay thế cụm từ 'Responsible for'",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và cơ hội nghề nghiệp trong viết hồ sơ xin việc.",
            "principle": "Sử dụng các động từ hành động mạnh mẽ thể hiện thành tích nổi bật thay cho các cách diễn đạt bị động.",
            "example": "Thay vì 'Responsible for sales', hãy viết 'Spearheaded regional sales expansion, boosting annual revenue by 24%'.",
            "actionItem": "Mở đầu các dòng mô tả kinh nghiệm trong CV bằng các động từ như Spearheaded, Orchestrated, Optimized."
        }
    },
    "e-004": {
        "en": {
            "title": "3 Essential Pain Descriptors: Throbbing vs. Sharp vs. Dull",
            "summary": "Practical English tip: Optimize everyday decisions and medical communication by accurately conveying pain sensations.",
            "principle": "Accurately conveying the precise nuance of pain prevents misdiagnoses and ensures swift medical intervention.",
            "example": "\"I have a throbbing headache\" vs. \"It is a sharp pain when taking deep breaths\".",
            "actionItem": "Define your pain clearly with one core descriptor (throbbing, sharp, dull) before visiting a clinic abroad."
        },
        "vi": {
            "title": "3 từ mô tả triệu chứng đau chuẩn xác: Throbbing, Sharp và Dull",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và trao đổi y tế chính xác khi đi khám bệnh.",
            "principle": "Mô tả chuẩn xác tính chất cơn đau giúp bác sĩ chẩn đoán nhanh chóng và tránh chẩn đoán nhầm.",
            "example": "\"I have a throbbing headache\" (đau nhói giật theo nhịp) khác với \"It is a sharp pain\" (đau nhói buốt).",
            "actionItem": "Xác định rõ cảm giác đau của mình bằng từ vựng chuẩn (throbbing, sharp, dull) trước khi gặp bác sĩ ở nước ngoài."
        }
    },
    "e-005": {
        "en": {
            "title": "Asserting Flight Delay Compensation and Meal Voucher Rights",
            "summary": "Practical English tip: Optimize everyday decisions and travel rights by asserting statutory airline care policies.",
            "principle": "Invoking the airline's statutory Duty of Care for delayed flights.",
            "example": "\"Could you please provide written confirmation of the delay and meal or hotel vouchers under your policy?\"",
            "actionItem": "Always request a written confirmation of flight delay and meal vouchers at the airport desk."
        },
        "vi": {
            "title": "Yêu cầu bồi thường và phiếu ăn uống khi chuyến bay bị hoãn",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và bảo vệ quyền lợi du lịch khi bay quốc tế.",
            "principle": "Quy định rõ ràng về nghĩa vụ chăm sóc hành khách (Duty of Care) của các hãng hàng không khi có sự cố hoãn chuyến.",
            "example": "\"Could you please provide written confirmation of the delay and meal vouchers under your policy?\"",
            "actionItem": "Luôn yêu cầu nhân viên quầy sân bay cung cấp văn bản xác nhận hoãn chuyến và phiếu hỗ trợ ăn uống."
        }
    },
    "e-006": {
        "en": {
            "title": "Claims for Damaged International Shipments: Replacement or Full Refund",
            "summary": "Practical English tip: Optimize everyday decisions and consumer rights with claims for damaged shipments.",
            "principle": "\"The item arrived damaged in transit (attached photos). Please issue a full refund or immediate replacement.\"",
            "example": "Provide photographic proof together with a definitive requested remedy (full refund or immediate replacement).",
            "actionItem": "Photograph the damaged package before opening and submit a claim using this template."
        },
        "vi": {
            "title": "Yêu cầu đổi hàng mới hoặc hoàn tiền khi hàng quốc tế bị hư hỏng",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và bảo vệ quyền lợi mua sắm trực tuyến.",
            "principle": "\"The item arrived damaged in transit (attached photos). Please issue a full refund or immediate replacement.\"",
            "example": "Đính kèm hình ảnh bằng chứng rõ ràng cùng yêu cầu bồi thường dứt khoát (hoàn tiền hoặc đổi sản phẩm mới).",
            "actionItem": "Chụp ảnh bưu phẩm bị hư hại trước khi mở hộp và gửi khiếu nại ngay cho người bán theo mẫu câu trên."
        }
    },
    "e-007": {
        "en": {
            "title": "Reading US Stock Ex-Dividend Dates for Dividend Eligibility",
            "summary": "Practical English tip: Optimize everyday decisions and investment timing with dividend calendar terminology.",
            "principle": "Shares must be bought before the Ex-Dividend Date to qualify for dividend distribution.",
            "example": "Verify trade execution against the Ex-Dividend Date rather than the Record Date.",
            "actionItem": "Look up the Ex-Dividend Date of target stocks on financial analysis portals."
        },
        "vi": {
            "title": "Đọc ngày giao dịch không hưởng quyền (Ex-Dividend Date) của cổ phiếu Mỹ",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và thời điểm nhận cổ tức quốc tế.",
            "principle": "Cần hoàn tất mua cổ phiếu trước ngày Ex-Dividend Date ít nhất một ngày làm việc để được nhận cổ tức.",
            "example": "Xác nhận lệnh khớp dựa trên ngày giao dịch không hưởng quyền chứ không phải ngày chốt danh sách (Record Date).",
            "actionItem": "Tra cứu lịch Ex-Dividend Date của mã cổ phiếu bạn quan tâm trên các trang tài chính quốc tế."
        }
    },
    "e-008": {
        "en": {
            "title": "Best Rate Guarantee (BRG) Hotel Claim Writing",
            "summary": "Practical English tip: Optimize everyday decisions and lodging expenses with Best Rate Guarantee claim phrasing.",
            "principle": "Best Rate Guarantee (BRG): Claim a matching rate and discount if a lower public price is found elsewhere.",
            "example": "\"I found a lower rate of $X on [Site] for the exact same room and dates. Please apply your Best Rate Guarantee.\"",
            "actionItem": "Capture screenshots of third-party booking prices right after reserving on the official hotel site."
        },
        "vi": {
            "title": "Mẫu thư yêu cầu áp dụng cam kết giá tốt nhất (BRG) của khách sạn",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí đặt phòng khách sạn.",
            "principle": "Best Rate Guarantee (BRG): Được áp dụng mức giá thấp hơn kèm ưu đãi giảm thêm nếu tìm thấy giá rẻ hơn ở trang khác.",
            "example": "\"I found a lower rate of $X on [Site] for the exact same room and dates. Please apply your Best Rate Guarantee.\"",
            "actionItem": "Chụp ảnh màn hình giá rẻ hơn ở các trang đặt phòng ngay sau khi đặt trên trang chủ của khách sạn."
        }
    },
    "e-009": {
        "en": {
            "title": "LinkedIn Networking Cold Outreach Template",
            "summary": "Practical English tip: Optimize career networking with respectful cold outreach messages.",
            "principle": "Mention common ground, express genuine appreciation, and propose a concise 15-minute introductory coffee chat.",
            "example": "\"I admire your recent work on [Project] and would love to ask two brief questions over a 15-minute coffee chat.\"",
            "actionItem": "Reach out to an industry professional on LinkedIn with this respectful networking note."
        },
        "vi": {
            "title": "Mẫu tin nhắn kết nối chuyên nghiệp (Cold Message) trên LinkedIn",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và mở rộng mạng lưới quan hệ công việc.",
            "principle": "Nêu điểm tương đồng, bày tỏ sự ngưỡng mộ chân thành và đề xuất buổi trò chuyện ngắn gọn 15 phút.",
            "example": "\"I admire your recent work on [Project] and would love to ask two brief questions over a 15-minute virtual coffee chat.\"",
            "actionItem": "Gửi tin nhắn kết nối lịch sự tới một chuyên gia trong ngành mà bạn muốn học hỏi kinh nghiệm."
        }
    },
    "e-010": {
        "en": {
            "title": "Food Allergy and Dietary Restriction Phrases for Dining Abroad",
            "summary": "Practical English tip: Optimize health safety when dining out internationally with clear allergy phrasing.",
            "principle": "\"I have a severe allergy to [Ingredient]. Does this dish contain any traces of it?\"",
            "example": "Use the phrase 'traces of' to prevent cross-contamination risks for severe food allergies.",
            "actionItem": "Save your allergen terms in English on your smartphone before dining abroad."
        },
        "vi": {
            "title": "Mẫu câu hỏi về thành phần gây dị ứng tại nhà hàng nước ngoài",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và bảo đảm an toàn sức khỏe khi ăn uống.",
            "principle": "\"I have a severe allergy to [Ingredient]. Does this dish contain any traces of it?\"",
            "example": "Sử dụng cụm từ 'traces of' (dấu vết của) để tránh nguy cơ nhiễm chéo các thành phần gây dị ứng nặng.",
            "actionItem": "Lưu sẵn tên các thực phẩm bạn bị dị ứng bằng tiếng Anh trên điện thoại trước khi gọi món ở nước ngoài."
        }
    },
    "e-011": {
        "en": {
            "title": "Polite Phrases for Complimentary Hotel Room Upgrades",
            "summary": "Practical English tip: Optimize hotel stays with respectful upgrade inquiry expressions.",
            "principle": "\"We are celebrating our anniversary. Are there any complimentary room upgrades available?\"",
            "example": "Combine a polite celebration mention with the term 'complimentary upgrade'.",
            "actionItem": "Ask politely with a smile at check-in whether any complimentary upgrades are available."
        },
        "vi": {
            "title": "Cách ngỏ lời lịch sự để được nâng cấp hạng phòng khách sạn miễn phí",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và trải nghiệm nghỉ dưỡng tại khách sạn.",
            "principle": "\"We are celebrating our anniversary. Are there any complimentary room upgrades available?\"",
            "example": "Kết hợp khéo léo dịp kỷ niệm đặc biệt với cụm từ 'complimentary upgrade' (nâng hạng miễn phí).",
            "actionItem": "Tươi cười lịch sự hỏi nhân viên lễ tân khi nhận phòng xem có cơ hội nâng cấp phòng hay không."
        }
    },
    "e-012": {
        "en": {
            "title": "Immediate Airbnb Cleanliness Complaints and Resolution Writing",
            "summary": "Practical English tip: Optimize accommodation rights with prompt cleanliness dispute phrasing.",
            "principle": "\"The property is not in clean condition upon arrival. Please see attached photos and send a cleaning team.\"",
            "example": "Submit time-stamped photos to Airbnb support within 24 hours of check-in.",
            "actionItem": "Document cleanliness issues with photos and message the host immediately inside the app."
        },
        "vi": {
            "title": "Mẫu khiếu nại khẩn cấp khi phòng Airbnb không đảm bảo vệ sinh",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và bảo vệ quyền lợi lưu trú.",
            "principle": "\"The property is not in clean condition upon arrival. Please see attached photos and send a cleaning team.\"",
            "example": "Gửi hình ảnh bằng chứng kèm mốc thời gian cho bộ phận hỗ trợ trong vòng 24 giờ kể từ khi nhận phòng.",
            "actionItem": "Chụp ảnh mọi vấn đề vệ sinh và gửi tin nhắn ngay cho chủ nhà trên ứng dụng khi vừa bước vào phòng."
        }
    },
    "e-013": {
        "en": {
            "title": "How to Inspect ETF Expense Ratios and Management Fees",
            "summary": "Practical English tip: Optimize long-term investment returns by decoding ETF fee disclosures.",
            "principle": "Expense Ratio: The annual operating fee deducted automatically from fund assets.",
            "example": "An ETF with a 0.03% expense ratio versus 0.5% saves tens of thousands of dollars over 20 years.",
            "actionItem": "Search and compare the expense ratios of your current foreign index funds and ETFs."
        },
        "vi": {
            "title": "Cách kiểm tra tỷ lệ chi phí quản lý quỹ (Expense Ratio) của ETF",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và lợi nhuận đầu tư dài hạn.",
            "principle": "Expense Ratio: Tỷ lệ phí quản lý và vận hành được trừ tự động hàng năm từ tài sản của quỹ.",
            "example": "Quỹ ETF có phí 0.03% so với quỹ 0.5% sẽ giúp bạn tiết kiệm được một khoản tiền rất lớn sau 20 năm.",
            "actionItem": "Tra cứu và so sánh tỷ lệ chi phí hoạt động (Expense Ratio) của các quỹ ETF mà bạn đang nắm giữ."
        }
    },
    "e-014": {
        "en": {
            "title": "Amazon Post-Purchase Price Drop Refund Inquiry Expressions",
            "summary": "Practical English tip: Optimize online shopping savings when retail prices decrease post-order.",
            "principle": "\"I noticed the price dropped shortly after my purchase. Could you please credit the difference?\"",
            "example": "A courteous and well-timed inquiry on live chat often yields promotional store credits.",
            "actionItem": "Reach out to customer live chat if an item's price dropped before shipment."
        },
        "vi": {
            "title": "Mẫu câu yêu cầu hoàn chênh lệch khi giá hàng trên Amazon giảm sau khi mua",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và tiết kiệm chi phí mua sắm trực tuyến.",
            "principle": "\"I noticed the price dropped shortly after my purchase. Could you please credit the difference?\"",
            "example": "Yêu cầu lịch sự và đúng thời điểm qua hỗ trợ trực tuyến (live chat) thường giúp bạn nhận được tiền hoàn ưu đãi.",
            "actionItem": "Liên hệ ngay với bộ phận hỗ trợ khách hàng nếu sản phẩm giảm giá trước khi bưu kiện được giao."
        }
    },
    "e-015": {
        "en": {
            "title": "Polite Deadline Follow-Up Expressions in Business English Emails",
            "summary": "Practical English tip: Optimize professional project delivery with polite deadline reminders.",
            "principle": "Use phrases like 'gentle reminder' and 'to ensure we stay on schedule' to keep deadlines on track.",
            "example": "\"A gentle reminder regarding [Task]. To ensure we stay on schedule, could you provide an update by tomorrow?\"",
            "actionItem": "Use this phrasing when following up politely on pending project deliverables."
        },
        "vi": {
            "title": "Cách nhắc nhở hạn chót công việc lịch sự trong email tiếng Anh",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và hiệu quả phối hợp công việc chuyên nghiệp.",
            "principle": "Sử dụng các cụm từ nhẹ nhàng như 'gentle reminder' và 'to ensure we stay on schedule' để giục công việc đúng hạn.",
            "example": "\"A gentle reminder regarding [Task]. To ensure we stay on schedule, could you provide an update by tomorrow?\"",
            "actionItem": "Áp dụng mẫu câu này khi cần nhắc nhở đồng nghiệp hoặc đối tác phản hồi công việc đang bị trễ hạn."
        }
    },
    "e-016": {
        "en": {
            "title": "Requesting Non-Drowsy Medications at Foreign Pharmacies",
            "summary": "Practical English tip: Optimize daytime alertness and health safety with pharmacy keywords.",
            "principle": "\"I need cold medication for daytime work. Does this have a non-drowsy formula?\"",
            "example": "Distinguish between drowsy and non-drowsy active ingredients.",
            "actionItem": "Confirm with the pharmacist that the medication is a 'non-drowsy formula' before driving."
        },
        "vi": {
            "title": "Cách hỏi mua thuốc không gây buồn ngủ (Non-drowsy) tại hiệu thuốc",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và duy trì sự tỉnh táo khi cần làm việc.",
            "principle": "\"I need cold medication for daytime work. Does this have a non-drowsy formula?\"",
            "example": "Phân biệt rõ ràng giữa thành phần gây buồn ngủ (drowsy) và không gây buồn ngủ (non-drowsy).",
            "actionItem": "Luôn xác nhận với dược sĩ rằng loại thuốc bạn mua là 'non-drowsy formula' nếu bạn cần lái xe hay làm việc."
        }
    },
    "e-017": {
        "en": {
            "title": "Filing Property Irregularity Reports (PIR) for Lost Baggage",
            "summary": "Practical English tip: Optimize luggage recovery rights with lost baggage claim procedures.",
            "principle": "\"My checked luggage did not arrive on the carousel. I need to file a Property Irregularity Report.\"",
            "example": "A Property Irregularity Report (PIR) number is mandatory to file airline lost baggage claims.",
            "actionItem": "Obtain the physical PIR report and reference file number at the baggage service counter."
        },
        "vi": {
            "title": "Khai báo biên bản thất lạc hành lý (PIR) tại sân bay",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và quyền lợi tìm lại hành lý thất lạc.",
            "principle": "\"My checked luggage did not arrive on the carousel. I need to file a Property Irregularity Report.\"",
            "example": "Số biên bản PIR là giấy tờ bắt buộc để hãng hàng không tiến hành truy tìm và giải quyết bồi thường hành lý.",
            "actionItem": "Nhận biên bản PIR gốc có mã hồ sơ theo dõi tại quầy dịch vụ hành lý sân bay trước khi rời đi."
        }
    },
    "e-018": {
        "en": {
            "title": "Preventing Rental Car Return Damage Disputes with Pre-Existing Scratch Records",
            "summary": "Practical English tip: Optimize car rental expenses by documenting vehicle conditions prior to departure.",
            "principle": "\"Please note these pre-existing scratches on the rental inspection form before I depart.\"",
            "example": "Document existing scratches on the checkout agreement before leaving the rental lot.",
            "actionItem": "Take a full 360-degree walk-around video of the vehicle before driving off."
        },
        "vi": {
            "title": "Tránh tranh chấp vết trầy xước có sẵn khi thuê xe ô tô ở nước ngoài",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí thuê xe khi du lịch.",
            "principle": "\"Please note these pre-existing scratches on the rental inspection form before I depart.\"",
            "example": "Ghi nhận đầy đủ mọi vết xước có từ trước vào biên bản bàn giao xe trước khi rời khỏi bãi xe.",
            "actionItem": "Quay video toàn cảnh 360 độ xung quanh xe bằng điện thoại ngay khi nhận chìa khóa."
        }
    },
    "e-019": {
        "en": {
            "title": "Decoding Bond Coupons vs. Yield to Maturity (YTM)",
            "summary": "Practical English tip: Optimize fixed income decisions with bond yield metrics.",
            "principle": "Coupon Rate is the fixed percentage on par value; Yield to Maturity (YTM) is the real annualized return.",
            "example": "When a bond trades at a discount, its YTM is higher than the coupon rate.",
            "actionItem": "Always evaluate foreign bonds by Yield to Maturity (YTM) rather than nominal coupon rate."
        },
        "vi": {
            "title": "Phân biệt lãi suất danh nghĩa (Coupon) và lợi suất đáo hạn (YTM) của trái phiếu",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và hiệu quả đầu tư trái phiếu quốc tế.",
            "principle": "Coupon Rate là lãi suất tính theo mệnh giá; Yield to Maturity (YTM) mới là tỷ suất sinh lời thực tế khi nắm giữ đến đáo hạn.",
            "example": "Khi trái phiếu được giao dịch dưới mệnh giá (discount), chỉ số YTM sẽ cao hơn lãi suất danh nghĩa Coupon.",
            "actionItem": "Luôn đánh giá trái phiếu quốc tế dựa trên chỉ số YTM thay vì chỉ nhìn vào mức lãi suất Coupon."
        }
    },
    "e-020": {
        "en": {
            "title": "Using International Toll-Free Support Numbers via Internet Calling",
            "summary": "Practical English tip: Optimize customer support calls abroad by utilizing toll-free directories.",
            "principle": "Toll-free numbers (such as US 1-800) can be dialed for free using VoIP services.",
            "example": "Call US 1-800 customer service lines for airlines and hotels free of charge via Skype.",
            "actionItem": "Check if the international service provider offers a toll-free 1-800 support line."
        },
        "vi": {
            "title": "Cách gọi tổng đài miễn cước quốc tế (1-800) qua ứng dụng internet",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí liên lạc với các hãng dịch vụ nước ngoài.",
            "principle": "Các đầu số Toll-free (như 1-800 của Mỹ) có thể gọi hoàn toàn miễn phí qua các ứng dụng gọi điện internet như Skype.",
            "example": "Gọi điện tới tổng đài hỗ trợ của các hãng hàng không hoặc khách sạn Mỹ mà không tốn cước viễn thông quốc tế.",
            "actionItem": "Kiểm tra xem đối tác dịch vụ quốc tế có đầu số miễn cước 1-800 hay không trước khi gọi điện thoại thông thường."
        }
    },
    "e-021": {
        "en": {
            "title": "Diplomatic Salary Negotiation Phrasing in Global Interviews",
            "summary": "Practical English tip: Optimize compensation discussions with tactful salary expectation phrasing.",
            "principle": "Inquire about the company's approved budget range before giving a specific salary figure.",
            "example": "\"Before discussing specific numbers, could you share the approved salary band for this position?\"",
            "actionItem": "Ask tactfully about the designated salary band during initial compensation discussions."
        },
        "vi": {
            "title": "Cách đàm phán mức lương khéo léo trong phỏng vấn tuyển dụng quốc tế",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và thu nhập khi làm việc tại các công ty đa quốc gia.",
            "principle": "Hỏi thăm về khung ngân sách đã được phê duyệt của công ty trước khi đưa ra con số kỳ vọng cụ thể.",
            "example": "\"Before discussing specific numbers, could you share the approved salary band for this position?\"",
            "actionItem": "Lịch sự hỏi về khoảng lương định mức của vị trí tuyển dụng trong buổi trao đổi đầu tiên về đãi ngộ."
        }
    },
    "e-022": {
        "en": {
            "title": "Communicating Medical Urgency in Emergency Rooms Abroad",
            "summary": "Practical English tip: Optimize urgent healthcare triage with emergency clinical descriptors.",
            "principle": "\"The patient is experiencing acute chest pain and shortness of breath. This is an urgent emergency.\"",
            "example": "Use urgent clinical descriptors like 'acute onset' and 'shortness of breath'.",
            "actionItem": "Clearly state 'acute severe symptoms' when arriving at an emergency department."
        },
        "vi": {
            "title": "Cách diễn đạt mức độ khẩn cấp y tế tại phòng cấp cứu ở nước ngoài",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và tiếp cận cấp cứu y tế kịp thời.",
            "principle": "\"The patient is experiencing acute chest pain and shortness of breath. This is an urgent emergency.\"",
            "example": "Sử dụng các từ vựng chỉ mức độ nguy cấp như 'acute' (cấp tính, dữ dội) và 'shortness of breath' (khó thở).",
            "actionItem": "Nói rõ cụm từ 'acute severe symptoms' ngay khi đến bàn phân loại bệnh nhân tại phòng cấp cứu."
        }
    },
    "e-023": {
        "en": {
            "title": "Checking Restaurant Bills for Duplicate Gratuity and Service Charges",
            "summary": "Practical English tip: Optimize dining costs abroad by checking receipts for included service fees.",
            "principle": "\"Is gratuity already included in the total, or is this line for an optional additional tip?\"",
            "example": "Avoid tipping twice in tourist destinations when gratuity is already factored into the bill.",
            "actionItem": "Inspect the bottom of the check to see if 'Tip' or 'Gratuity Included' is already listed."
        },
        "vi": {
            "title": "Kiểm tra hóa đơn nhà hàng nước ngoài để tránh trả tiền tip (tiền boa) trùng lặp",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí ăn uống khi du lịch.",
            "principle": "\"Is gratuity already included in the total, or is this line for an optional additional tip?\"",
            "example": "Tránh việc trả tiền boa hai lần tại các điểm du lịch khi tiền dịch vụ đã được cộng sẵn vào hóa đơn.",
            "actionItem": "Xem kỹ phần dưới cùng của hóa đơn xem có dòng chữ 'Tip' hoặc 'Gratuity Included' hay chưa trước khi ký."
        }
    },
    "e-024": {
        "en": {
            "title": "Inquiring at Public Transit Lost and Found Counters",
            "summary": "Practical English tip: Optimize recovery of forgotten belongings with transit lost-and-found phrasing.",
            "principle": "\"I left a black backpack on train #402, carriage 3, around 2:30 PM. Has it been turned in?\"",
            "example": "Record the train number, carriage, seat, and distinctive characteristics of the lost item.",
            "actionItem": "Take a photo of your transit ticket or boarding pass as soon as you board."
        },
        "vi": {
            "title": "Hỏi thông tin tại quầy thất lạc hành lý (Lost & Found) của phương tiện công cộng",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và khả năng tìm lại đồ đạc bỏ quên.",
            "principle": "\"I left a black backpack on train #402, carriage 3, around 2:30 PM. Has it been turned in?\"",
            "example": "Cung cấp đầy đủ số hiệu chuyến tàu, số toa, vị trí ngồi và các đặc điểm nhận dạng nổi bật của món đồ.",
            "actionItem": "Chụp lại vé tàu hoặc thông tin chuyến đi ngay khi lên xe để làm bằng chứng tra cứu khi cần."
        }
    },
    "e-025": {
        "en": {
            "title": "Practical Interpretation of Earnings Per Share (EPS) and P/E Ratios",
            "summary": "Practical English tip: Optimize equity valuation analysis with fundamental financial metrics.",
            "principle": "Assess valuation by combining EPS growth trends with the P/E ratio.",
            "example": "A stock with a below-average P/E and three consecutive years of EPS growth indicates solid value.",
            "actionItem": "Compare trailing P/E and forward P/E ratios for target international equities."
        },
        "vi": {
            "title": "Phân tích thực tế chỉ số thu nhập trên mỗi cổ phần (EPS) và P/E",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và định giá cổ phiếu quốc tế.",
            "principle": "Đánh giá mức độ định giá cổ phiếu bằng cách kết hợp xu hướng tăng trưởng EPS cùng chỉ số P/E so với ngành.",
            "example": "Cổ phiếu có P/E thấp hơn mức trung bình ngành nhưng EPS tăng trưởng 3 năm liên tiếp thường là cơ hội tốt.",
            "actionItem": "So sánh tỷ số Trailing P/E (quá khứ) và Forward P/E (kỳ vọng) của doanh nghiệp mục tiêu."
        }
    },
    "e-026": {
        "en": {
            "title": "Polite Phrases for Requesting First-Purchase Discount Codes",
            "summary": "Practical English tip: Optimize retail checkout savings by requesting introductory promo codes.",
            "principle": "\"Hello! I am about to place my first order. Are there any welcome promo codes available for new customers?\"",
            "example": "Live chat representatives often provide 10-15% courtesy discount codes upon polite request.",
            "actionItem": "Ask live chat for a first-order discount or welcome promo code before checking out."
        },
        "vi": {
            "title": "Mẫu câu xin mã giảm giá cho đơn hàng đầu tiên (First Purchase Discount)",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và tiết kiệm khi mua sắm trực tuyến.",
            "principle": "\"Hello! I am about to place my first order. Are there any welcome promo codes available for new customers?\"",
            "example": "Nhân viên chăm sóc khách hàng trực tuyến thường sẵn sàng gửi mã giảm giá 10-15% khi bạn ngỏ lời lịch sự.",
            "actionItem": "Nhắn tin qua khung chat hỏi mã ưu đãi khách hàng mới trước khi hoàn tất thanh toán giỏ hàng."
        }
    },
    "e-027": {
        "en": {
            "title": "Polite Phrases for Voicing Constructive Dissent in Meetings",
            "summary": "Practical English tip: Optimize collaborative decision-making with diplomatic disagreement phrases.",
            "principle": "\"I see your point, but from another perspective, we might consider...\"",
            "example": "Acknowledge the colleague's perspective before introducing an alternative solution.",
            "actionItem": "Begin your constructive dissent in meetings with 'I agree with the core goal, however...'"
        },
        "vi": {
            "title": "Cách bày tỏ ý kiến bất đồng lịch sự và xây dựng trong cuộc họp tiếng Anh",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và xây dựng môi trường làm việc chuyên nghiệp.",
            "principle": "\"I see your point, but from another perspective, we might consider...\"",
            "example": "Ghi nhận và tôn trọng quan điểm của đồng nghiệp trước khi đưa ra một góc nhìn hoặc giải pháp thay thế.",
            "actionItem": "Bắt đầu phần phản biện trong cuộc họp bằng câu 'I agree with the core goal, however...'."
        }
    },
    "e-028": {
        "en": {
            "title": "Reading Prescription Warning Labels and Dosage Instructions",
            "summary": "Practical English tip: Optimize medication safety by understanding prescription instructions.",
            "principle": "Follow 'Take with meals' vs. 'On an empty stomach' to ensure proper drug absorption.",
            "example": "Prevent stomach irritation and maximize bioavailability by observing medication timing.",
            "actionItem": "Carefully inspect warning labels and intake instructions on prescription bottles."
        },
        "vi": {
            "title": "Đọc hiểu nhãn chỉ dẫn dùng thuốc và đơn thuốc tiếng Anh",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và bảo đảm an toàn khi uống thuốc.",
            "principle": "Phân biệt rõ ràng giữa 'Take with meals' (uống sau khi ăn) và 'On an empty stomach' (uống lúc bụng đói).",
            "example": "Uống đúng thời điểm giúp tránh kích ứng dạ dày và bảo đảm thuốc được hấp thu tốt nhất vào cơ thể.",
            "actionItem": "Đọc kỹ các nhãn phụ cảnh báo màu vàng hoặc đỏ dán trên lọ thuốc được kê đơn ở nước ngoài."
        }
    },
    "e-029": {
        "en": {
            "title": "Phrasing for Advance Airline Special Meal Requests",
            "summary": "Practical English tip: Optimize in-flight comfort by specifying dietary requirements in advance.",
            "principle": "\"I would like to request a vegetarian/halal/low-sodium meal for my upcoming flight.\"",
            "example": "Select dietary preferences online 24 to 48 hours prior to scheduled departure.",
            "actionItem": "Pre-order a light or easily digestible special meal before long-haul flights."
        },
        "vi": {
            "title": "Mẫu câu đăng ký suất ăn đặc biệt (Special Meal) trên máy bay",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và sức khỏe trên các chuyến bay dài.",
            "principle": "\"I would like to request a vegetarian/halal/low-sodium meal for my upcoming flight.\"",
            "example": "Đăng ký yêu cầu suất ăn đặc biệt trên website hãng hàng không trước giờ bay ít nhất 24 đến 48 tiếng.",
            "actionItem": "Đặt trước các suất ăn thanh đạm, dễ tiêu hóa trước các chuyến bay đường dài."
        }
    },
    "e-030": {
        "en": {
            "title": "Templates for Misdelivered Packages and Missing Item Claims",
            "summary": "Practical English tip: Optimize everyday decisions and opportunity costs with templates for misdelivered packages and missing item claims.",
            "principle": "\"I received an incorrect item instead of what I ordered. Please provide a prepaid return shipping label.\"",
            "example": "Request a prepaid return shipping label when a merchant sends the wrong item.",
            "actionItem": "Ask the seller to provide a prepaid return label immediately upon receiving an incorrect item."
        },
        "vi": {
            "title": "Mẫu thư yêu cầu đổi hàng khi nhận sai sản phẩm đã đặt trực tuyến",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và chi phí xử lý khi giao nhầm hàng.",
            "principle": "\"I received an incorrect item instead of what I ordered. Please provide a prepaid return shipping label.\"",
            "example": "Yêu cầu người bán cung cấp nhãn vận chuyển trả hàng trả trước cước (prepaid return label) khi họ giao nhầm.",
            "actionItem": "Yêu cầu người bán gửi nhãn gửi hàng miễn phí trước khi mang gói hàng đi trả."
        }
    },
    "e-031": {
        "en": {
            "title": "Reading Treasury Inflation-Protected Securities (TIPS) Disclosures",
            "summary": "Practical English tip: Optimize capital preservation during inflationary cycles with TIPS terminology.",
            "principle": "Treasury Inflation-Protected Securities (TIPS) adjust principal value with the CPI.",
            "example": "As inflation rises, the adjusted principal increases, generating higher dollar coupon payments.",
            "actionItem": "Monitor TIPS yield spreads following major consumer price index announcements."
        },
        "vi": {
            "title": "Đọc hiểu trái phiếu chống lạm phát kho bạc Mỹ (TIPS)",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và bảo vệ tài sản trước lạm phát.",
            "principle": "TIPS điều chỉnh giá trị gốc theo chỉ số giá tiêu dùng CPI, giúp bảo toàn giá trị thực của dòng tiền.",
            "example": "Khi lạm phát tăng, giá trị gốc trái phiếu tăng theo, kéo theo số tiền nhận lãi định kỳ cũng tăng lên.",
            "actionItem": "Theo dõi biến động lợi suất trái phiếu TIPS sau khi các chỉ số lạm phát của Mỹ được công bố."
        }
    },
    "e-032": {
        "en": {
            "title": "Phrases for Declining Redundant Rental Car Collision Damage Waivers",
            "summary": "Practical English tip: Optimize travel budgets by declining unnecessary car insurance addons.",
            "principle": "\"I would like to decline the Collision Damage Waiver (CDW) as my credit card covers primary rental insurance.\"",
            "example": "Save $20-$30 per day by utilizing primary auto rental coverage included with premium credit cards.",
            "actionItem": "Firmly decline redundant collision damage waivers at the car rental counter if card coverage applies."
        },
        "vi": {
            "title": "Mẫu câu từ chối bảo hiểm trùng lặp không cần thiết khi thuê xe ô tô",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và tiết kiệm chi phí thuê xe.",
            "principle": "\"I would like to decline the Collision Damage Waiver (CDW) as my credit card covers primary rental insurance.\"",
            "example": "Tiết kiệm 20-30 USD mỗi ngày bằng cách tận dụng quyền lợi bảo hiểm xe thuê có sẵn trên thẻ tín dụng.",
            "actionItem": "Dứt khoát từ chối gói bảo hiểm thân vỏ bổ sung (CDW) nếu thẻ tín dụng của bạn đã bao gồm quyền lợi này."
        }
    },
    "e-033": {
        "en": {
            "title": "Cover Letter Sentences That Showcase Cross-Functional Project Leadership",
            "summary": "Practical English tip: Optimize professional job applications with impactful leadership phrases.",
            "principle": "\"Successfully navigated ambiguous cross-functional challenges to deliver on time.\"",
            "example": "Demonstrate proactive problem-solving by citing how you steered through ambiguity.",
            "actionItem": "Add a concrete single sentence to your cover letter highlighting success under uncertainty."
        },
        "vi": {
            "title": "Mẫu câu thư ứng tuyển (Cover Letter) làm nổi bật năng lực lãnh đạo dự án",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và gây ấn tượng mạnh với nhà tuyển dụng.",
            "principle": "\"Successfully navigated ambiguous cross-functional challenges to deliver on time.\"",
            "example": "Chứng minh năng lực chủ động giải quyết vấn đề bằng ví dụ thực tế vượt qua những tình huống mơ hồ.",
            "actionItem": "Thêm một câu cụ thể vào thư xin việc nêu rõ kết quả đạt được trong hoàn cảnh nhiều thử thách."
        }
    },
    "e-034": {
        "en": {
            "title": "Phrases for Consulting Pharmacists Regarding Jet Lag and Sleep Aids",
            "summary": "Practical English tip: Optimize post-flight recovery with sleep aid consultation phrases.",
            "principle": "\"I am struggling with insomnia and jet lag. Do you have mild melatonin supplements?\"",
            "example": "Distinguish sleep onset insomnia from travel-related circadian jet lag.",
            "actionItem": "Consult local pharmacists for mild melatonin or non-prescription sleep aids using these terms."
        },
        "vi": {
            "title": "Mẫu câu tham vấn dược sĩ về chứng mất ngủ do lệch múi giờ (Jet Lag)",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và phục hồi sức khỏe sau chuyến bay dài.",
            "principle": "\"I am struggling with insomnia and jet lag. Do you have mild melatonin supplements?\"",
            "example": "Phân biệt rõ tình trạng khó ngủ thông thường với rối loạn nhịp sinh học do bay xuyên múi giờ.",
            "actionItem": "Nhờ dược sĩ tư vấn thực phẩm bổ sung melatonin dịu nhẹ hoặc hỗ trợ giấc ngủ bằng mẫu câu trên."
        }
    },
    "e-035": {
        "en": {
            "title": "Requesting Post-Checkout Luggage Storage at Hotels",
            "summary": "Practical English tip: Optimize final vacation days by requesting complimentary baggage holding.",
            "principle": "\"Could you please hold our luggage until 4 PM after checkout?\"",
            "example": "Use the verbs 'hold' or 'store' to secure complimentary luggage holding on your final travel day.",
            "actionItem": "Take a smartphone photo of the luggage claim tag upon dropping bags at front desk."
        },
        "vi": {
            "title": "Mẫu câu nhờ gửi hành lý tại khách sạn sau khi đã làm thủ tục trả phòng",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và tự do tham quan ngày cuối chuyến đi.",
            "principle": "\"Could you please hold our luggage until 4 PM after checkout?\"",
            "example": "Sử dụng các động từ 'hold' hoặc 'store' để nhờ khách sạn giữ hộ hành lý miễn phí trong vài tiếng.",
            "actionItem": "Chụp ảnh thẻ gửi hành lý (luggage tag) bằng điện thoại để tránh thất lạc khi quay lại nhận đồ."
        }
    },
    "e-036": {
        "en": {
            "title": "Disputing Unauthorized Credit Card Charges and Initiating Chargebacks",
            "summary": "Practical English tip: Optimize financial security by disputing fraudulent transactions promptly.",
            "principle": "\"I do not recognize this transaction on [Date]. Please initiate a chargeback dispute immediately.\"",
            "example": "Filing a formal chargeback dispute with your card issuer for unrecognized transactions.",
            "actionItem": "Call your credit card company immediately to report unauthorized charges and request a chargeback."
        },
        "vi": {
            "title": "Mẫu câu khiếu nại giao dịch thẻ tín dụng bất thường và yêu cầu hoàn trả (Chargeback)",
            "summary": "Mẹo Tiếng Anh thực tế: Tối ưu hóa các quyết định hàng ngày và bảo vệ tài chính trước gian lận thẻ.",
            "principle": "\"I do not recognize this transaction on [Date]. Please initiate a chargeback dispute immediately.\"",
            "example": "Yêu cầu ngân hàng phát hành thẻ khởi động quy trình khiếu nại hoàn tiền khi phát hiện giao dịch lạ.",
            "actionItem": "Gọi ngay cho đường dây nóng của ngân hàng phát hành thẻ để khóa thẻ và yêu cầu chargeback."
        }
    }
}

for k, val in e_clean.items():
    if k in data:
        for f in ['title', 'summary', 'principle', 'example', 'actionItem']:
            if f in data[k]:
                data[k][f]['en'] = val['en'][f]
                data[k][f]['vi'] = val['vi'][f]

# 4. Clean any remaining sq actionItems in e-001 to e-036
hangul = re.compile(r'[\uac00-\ud7a3]')
for i in range(1, 37):
    k = f'e-{i:03d}'
    item = data.get(k, {})
    for f in ['title', 'summary', 'principle', 'example', 'actionItem']:
        sq_val = item.get(f, {}).get('sq')
        if isinstance(sq_val, str) and hangul.search(sq_val):
            # Fall back to English or clean Albanian
            en_val = item.get(f, {}).get('en', '')
            item[f]['sq'] = en_val

# Save updated studyTopics89.json
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Updated studyTopics89.json successfully.')
