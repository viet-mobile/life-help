export default function PrivacyNotice() {
  return (
    <section className="border-t border-slate-200 bg-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <h3 className="text-base font-bold text-slate-800">개인정보 보호 안내</h3>

        <p className="mt-3 text-sm leading-6 font-medium text-slate-700">
          저희 회사는 고객님의 사생활 보호를 위해 고객의 성함과 주소, 전화번호를 따로 저장하지
          않습니다. 또한 고객님의 전화번호를 050으로 시작하는 임시번호로 변환하여 기사님께 전달하고,
          고객님의 편의를 위해 일주일 동안만 임시번호의 효력을 유지한 후에는 임시번호를 폐기합니다.
          고객님께서 저희 서비스를 사용하신 이력은 고객님의 기기에만 저장되며, 고객님이 기기를
          변경하시는 경우에는 기존 기기에 저장된 사용 이력은 새로운 기기로 이전되지 않을 수
          있습니다.
        </p>

        <h3 className="mt-6 text-base font-bold text-slate-800">
          Thông báo về bảo vệ thông tin cá nhân
        </h3>

        <p className="mt-3 text-sm leading-6 font-medium text-slate-700">
          Để bảo vệ quyền riêng tư của khách hàng, công ty chúng tôi không lưu trữ riêng tên, địa
          chỉ và số điện thoại của khách hàng. Ngoài ra, số điện thoại của khách hàng sẽ được chuyển
          đổi thành một số điện thoại tạm thời bắt đầu bằng 050 và cung cấp cho kỹ thuật viên. Để
          thuận tiện cho khách hàng, số điện thoại tạm thời chỉ có hiệu lực trong một tuần và sau đó
          sẽ được hủy bỏ. Lịch sử sử dụng dịch vụ của khách hàng chỉ được lưu trên thiết bị của
          khách hàng. Nếu khách hàng thay đổi thiết bị, lịch sử sử dụng được lưu trên thiết bị cũ có
          thể không được chuyển sang thiết bị mới.
        </p>
      </div>
    </section>
  );
}
